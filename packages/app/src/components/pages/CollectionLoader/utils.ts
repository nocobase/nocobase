import cloneDeep from 'lodash/cloneDeep';
import { history } from 'umi';

export function getPathName(params) {
  const { pagepath, viewId, items = [], lastItem = {}, newItem = {} } = cloneDeep(params);
  let path = `/${pagepath}`;
  if (viewId) {
    path += `/views/${viewId}`;
  }
  let last = items.pop();
  last = {...last, ...lastItem};
  path += items.map(item => `/items/${item.itemId}/tabs/${item.tabId}`).join('/');
  if (typeof last.itemId !== 'undefined') {
    path += `/items/${last.itemId}/tabs/${last.tabId}`;
  }
  if (typeof newItem.itemId !== 'undefined') {
    path += `/items/${newItem.itemId}/tabs/${newItem.tabId}`;
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
