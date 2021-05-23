import { createGlobalState } from 'react-hooks-global-state';
import { useRequest } from 'ahooks';
import request from 'umi-request';

const initialState = {
  actions: {},
};

type GlobalActionNames = 'routes:getAccessible' | 'routes:getMenu' | 'users:check';

const { setGlobalState, useGlobalState } = createGlobalState(initialState);

export { setGlobalState, useGlobalState }

export function setGlobalActionState(actionName: GlobalActionNames, data) {
  setGlobalState('actions', (actions) => ({
    ...actions,
    [actionName]: data,
  }));
}

export function useGlobalAction(actionName: GlobalActionNames, options: any = {}) {
  const result = useAction(actionName, {
    onSuccess(data) {
      setGlobalActionState(actionName, data);
    },
    ...options,
  });
  return result;
}

export async function refreshGlobalAction(actionName: GlobalActionNames) {
  const { data } = await doAction(actionName);
  setGlobalActionState(actionName, data);
}

export function useAction(actionName, options: any = {}) {
  let params = actionName;
  if (typeof actionName === 'string') {
    params = { url: `/api/${actionName}` };
  }
  return useRequest(params, {
    formatResult: result => result?.data,
    // requestMethod(service) {
    //   if (typeof service === 'string') {
    //     return request(service,);
    //   }
    //   if (typeof service === 'object') {
    //     const { url, ...rest } = service;
    //     return request(url, rest);
    //   }
    //   throw new Error('request options error');
    // },
    ...options,
  });
}

export async function doAction(actionName: any, options?: any) {
  const res = await request(`/api/${actionName}`, options);
  return res.data;
}

export function usePage(name: string, options?: any) {
  return useAction('routes:getPage', {
    refreshDeps: [name],
    ...options,
  });
}