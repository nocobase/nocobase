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

  if (process.env.NODE_ENV !== 'production' && !document.querySelector('#root')) {
    throw new Error(`isPortalInBody: can not find element with id 'root'`);
  }

  return true;
};
