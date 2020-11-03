import cloneDeep from 'lodash/cloneDeep';
import { history } from 'umi';

export function getPathName(params, item: any = {}) {
  const { pagepath, viewId, items = [] } = cloneDeep(params);
  let path = `/${pagepath}`;
  if (viewId) {
    path += `/views/${viewId}`;
  }
  let lastItem = items.pop();
  lastItem = {...lastItem, ...item};
  path += items.map(item => `/items/${item.itemId}/tabs/${item.tabId}`).join('/');
  if (lastItem.itemId) {
    path += `/items/${lastItem.itemId}/tabs/${lastItem.tabId}`;
  }
  return path;
}

/**
 * 跳转
 * 
 * @param params 
 * @param item 
 */
export function redirectTo(params = {}, item: any = {}) {
  const pathname = getPathName(params, item);
  history.push(pathname);
}
