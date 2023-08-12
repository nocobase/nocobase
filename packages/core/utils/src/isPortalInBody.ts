/**
 * 判断一个 DOM 对象是否是由 createPortal 挂在到了 body 上
 * @param domNode DOM 对象
 */

export const isPortalInBody = (dom: Element) => {
  while (dom) {
    if (dom.id === 'root') {
      return false;
    }
    dom = dom.parentNode as Element;
  }

  // 测试环境下大部分都是直接 render 的组件，是没有以 root 为 ID 的根元素的
  if (process.env.__TEST__) {
    return false;
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!document.querySelector('#root')) {
      throw new Error(`isPortalInBody: can not find element with id 'root'`);
    }
  }

  return true;
};
