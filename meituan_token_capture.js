// meituan_token_capture.js v2
// QX script-request-header：自动抓美团 token，存本机不上网
// v2：加一次调试通知（确认规则是否生效）+ 多处找 token（请求头/Cookie/URL 参数）
const headers = $request.headers || {};
const url = $request.url || {};
// 调试：脚本第一次跑起来就弹一次，确认规则+MitM 已生效
if (!$prefs.valueForKey('meituan_debug_fired')) {
  $prefs.setValueForKey('1', 'meituan_debug_fired');
  $notify('美团抓取规则已生效', '脚本已跑起来，正在等 token', String(url).slice(0, 80));
}
let token = headers['token'] || headers['Token'] || '';
if (!token) {
  const cookie = headers['Cookie'] || headers['cookie'] || '';
  const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (m) token = m[1];
}
if (!token) {
  const q = String(url).match(/[?&]token=([^&]+)/);
  if (q) token = decodeURIComponent(q[1]);
}
if (token) {
  const old = $prefs.valueForKey('meituan_token');
  if (old !== token) {
    $prefs.setValueForKey(token, 'meituan_token');
    $notify('美团 token 已抓到', '点开查看并复制', token);
  }
}
$done({});
