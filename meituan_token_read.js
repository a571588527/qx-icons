// meituan_token_read.js
// QX task：显示已存的美团 token，供复制发给 Rocky
const token = $prefs.valueForKey('meituan_token');
if (token) {
  $notify('美团 token', '长按复制发给 Rocky', token);
} else {
  $notify('美团 token', '还没抓到', '先打开美团 App 逛一下，等抓取通知');
}
$done();
