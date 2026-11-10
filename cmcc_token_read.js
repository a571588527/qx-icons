// 把 QX 里存好的移动 app_token 显示出来，复制发给服务器端
// 用法：QX 里建一个本地任务（cron）引用这个脚本，手动点运行即可；
//   https://raw.githubusercontent.com/a571588527/qx-icons/main/cmcc_token_read.js
// token 只存在本机，不会上传。

const token = $prefs.valueForKey("cmcc_app_token") || "";
if (token) {
  $notify("移动 app_token", "长按复制后发给 Rocky", token);
} else {
  $notify("移动 app_token", "还没存过", "先打开移动 App 签到页触发一次抓取");
}
$done({});
