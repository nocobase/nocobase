declare interface Window {
  onBackPressed: (cb: (v: boolean) => boolean) => void;
}
/**
 * App 右滑返回
 * @param cb 回调函数，返回 true 表示 web 自己消费，false表示 app 消费
 */
window.onBackPressed = (cb) => {
  if (history.length === 1) {
    cb(false);
  } else {
    history.back();
    cb(true);
  }
};
