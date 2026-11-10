// meituan_token_capture.js
// QX script-request-header：自动抓美团 token，存本机不上网
// 触发：任意 meituan.com 请求（token 在请求头 Cookie 里）
// 抓到后存 $prefs 键 meituan_token，token 变了才弹一次通知
const headers = $request.headers || {};
let token = headers['token'] || headers['Token'] || '';
if (!token) {
  const cookie = headers['Cookie'] || headers['cookie'] || '';
  const m = cookie.match(/(?:^|;\s*)token=([^;]+)/);
  if (m) token = m[1];
}
if (token) {
  const old = $prefs.valueForKey('meituan_token');
  if (old !== token) {
    $prefs.setValueForKey(token, 'meituan_token');
    $notify('美团 token 已抓到', '点开查看并复制', token);
  }
}
$done({});
