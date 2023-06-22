import { IApi } from 'umi';

export default (api: IApi) => {
  api.addRuntimePlugin(() => ['../plugin-routerBase/runtime.ts']);
  api.addRuntimePluginKey(() => ['routerBase']);

  api.onGenerateFiles(() => {
    api.writeTmpFile({
      path: '../plugin-routerBase/runtime.ts',
      content: `
export function modifyContextOpts(memo) {
  return  { ...memo, basename: window.routerBase };
};
`,
    });
  });
};
