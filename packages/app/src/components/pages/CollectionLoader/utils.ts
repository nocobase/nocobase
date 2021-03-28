import cloneDeep from 'lodash/cloneDeep';
import { history } from 'umi';

export function getPathName(params) {
  const {
    pagepath,
    viewName,
    removeLastItem,
    items = [],
    lastItem = {},
    newItem = {},
  } = cloneDeep(params);
  let path = `/${pagepath}`;
  if (viewName) {
    path += `/views/${viewName}`;
  }
  let last = items.pop();
  path += items
    .map(item => `/items/${item.itemId}/tabs/${item.tabName}`)
    .join('/');
  if (removeLastItem) {
    return path;
  }
  last = { ...last, ...lastItem };
  if (typeof last.itemId !== 'undefined') {
    path += `/items/${last.itemId}/tabs/${last.tabName}`;
  }
  if (typeof newItem.itemId !== 'undefined') {
    path += `/items/${newItem.itemId}/tabs/${newItem.tabName}`;
  }
  return path;
}

/**
 * 跳转
 *
 * @param params
 * @param item
 */
export function redirectTo(params = {}) {
  const pathname = getPathName(params);
  history.push(pathname);
}
