import prettyFormat from 'pretty-format';
import Worker from './__mocks__/workerMock';

global['prettyFormat'] = prettyFormat;
//@ts-ignore
global['Worker'] = Worker;
//@ts-ignore
global.URL.createObjectURL = function () {};



jest.setTimeout(300000);

// 把 console.error 转换成 error，方便断言
(() => {
  const spy = jest.spyOn(console, 'error');
  afterAll(() => {
    spy.mockRestore();
  });
})();
