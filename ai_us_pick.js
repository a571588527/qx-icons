/*
 AI 美国节点自动优选（Quantumult X 定时脚本）

 做的事（每次运行）：
 1. 取「美国自动」分组里的全部美国节点；
 2. 逐个用 Google 送中检测：被送中的、连不上的，都排除；
 3. 在剩下的节点里测延迟，选延迟最低的；
 4. 为了出口 IP 稳定：当前节点还可用、且比最优节点慢不超过 MARGIN 毫秒时，继续用它，不来回切；
    当前节点挂了、被送中、或明显更慢时，才切换；
 5. 把「美国自动」切到选定的节点，并且只在换节点或没有可用节点时发通知。

 用法：把本文件放进 Quantumult X 的 Scripts 文件夹，文件名保持 ai_us_pick.js，
 配置里的定时任务会每 10 分钟运行一次。
*/

var POLICY = "美国自动";          // 被管理的分组名，必须和配置里一致
var MARGIN = 40;                  // 毫秒：新节点至少快这么多才切换
var PREF_KEY = "ai_us_pick_last"; // 记录上次选的节点
var WAIT = 9000;                  // 单个节点检测的最长等待时间（毫秒）
var TEST_URL = "https://www.google.com/maps/timeline";

function log(s) { console.log("[AI-US] " + s); }

function finish(title, msg, notifyIt) {
  if (notifyIt) { $notify("AI 美国节点自动优选", title, msg); }
  log(title + " " + msg);
  $done({ title: "AI 美国节点自动优选", message: title + "\n" + msg });
}

function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise(function (_, rej) { setTimeout(function () { rej("timeout"); }, ms); })
  ]);
}

// 返回 {node, ok}：ok=true 表示连得上且没被送中（和原版脚本一样，HTTP 400 视为被送中）
function checkGoogle(node) {
  var req = {
    url: TEST_URL,
    method: "GET",
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    },
    opts: { policy: node }
  };
  return withTimeout($task.fetch(req), WAIT).then(function (r) {
    var songzhong = (r.statusCode == 400);
    if (songzhong) { log(node + "：已被送中，排除"); }
    return { node: node, ok: !songzhong };
  }).catch(function () {
    log(node + "：检测失败/超时，排除");
    return { node: node, ok: false };
  });
}

try {
  $configuration.sendMessage({ action: "get_customized_policy", content: POLICY }).then(function (res) {
    var info = res && res.ret && res.ret[POLICY];
    if (!info || !info.candidates || !info.candidates.length) {
      return finish("没找到分组", "分组「" + POLICY + "」不存在或里面没有节点，请检查配置", true);
    }
    var nodes = info.candidates;
    log("共 " + nodes.length + " 个节点，开始检测");
    return Promise.all(nodes.map(checkGoogle)).then(function (results) {
      var ok = results.filter(function (x) { return x.ok; }).map(function (x) { return x.node; });
      if (!ok.length) {
        return finish("没有可用节点", "所有美国节点都被送中或连不上，保持当前选择不变", true);
      }
      return $configuration.sendMessage({ action: "url_latency_benchmark", content: ok }).then(function (r) {
        var lat = {};
        ok.forEach(function (n) {
          var v = r && r.ret && r.ret[n];
          lat[n] = (v && v[1] > 0) ? v[1] : null;
        });
        var usable = ok.filter(function (n) { return lat[n] !== null; })
                       .sort(function (a, b) { return lat[a] - lat[b]; });
        if (!usable.length) {
          return finish("没有可用节点", "节点通过了送中检测，但延迟测试都失败，保持当前选择不变", true);
        }
        var best = usable[0];
        var last = $prefs.valueForKey(PREF_KEY);
        var target = best;
        if (last && lat[last] !== null && lat[last] !== undefined && lat[last] <= lat[best] + MARGIN) {
          target = last; // 当前节点仍然够好，不换，保持出口 IP 稳定
        }
        var dict = {};
        dict[POLICY] = target;
        return $configuration.sendMessage({ action: "set_policy_state", content: dict }).then(function (s) {
          if (s && s.error) { return finish("切换失败", String(s.error), true); }
          $prefs.setValueForKey(target, PREF_KEY);
          var changed = (target !== last);
          var msg = target + "（延迟 " + lat[target] + " ms，可用 " + usable.length + "/" + nodes.length + " 个）";
          return finish(changed ? "已切换到" : "保持不变", msg, changed);
        });
      });
    });
  }).catch(function (e) {
    finish("脚本出错", String(e), false);
  });
} catch (e) {
  finish("脚本出错", String(e), false);
}
