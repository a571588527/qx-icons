// 捕获中国移动 appTokenLogin 请求体里的 token（App 原生票据）
// 用法：QX [rewrite_local] 加一行：
//   ^https://wx\.10086\.cn/qwhdsso/appTokenLogin url script-request-body https://raw.githubusercontent.com/a571588527/qx-icons/main/cmcc_token_capture.js
// 然后打开中国移动 App → 我的 → 签到领流量，脚本会把 token 存入 cmcc_app_token 并弹通知。
// 再跑 cmcc_token_read.js 任务把存好的 token 显示出来，复制发给服务器端配置用。
// 注意：token 只保存在本机 QX，不会上传到任何地方。

const body = $request.body || "";
let token = "";

try {
  const data = JSON.parse(body);
  token = data.token || "";
} catch (e) {
  const m = body.match(/(?:^|&)token=([^&]+)/);
  if (m) {
    try { token = decodeURIComponent(m[1]); } catch (e2) { token = m[1]; }
  }
}

if (token) {
  $prefs.setValueForKey(token, "cmcc_app_token");
  $notify("移动 app_token 已保存", "已存入 cmcc_app_token", token.slice(0, 40) + "...");
} else {
  $notify("移动 app_token", "请求体里没有 token 字段", body.slice(0, 80));
}

$done({});
