import prettyFormat from 'pretty-format';

global['prettyFormat'] = prettyFormat;

jest.setTimeout(300000);

// 把 console.error 转换成 error，方便断言
(() => {
  const spy = jest.spyOn(console, 'error');
  beforeAll(() => {
      spy.mockImplementation((message) => {
      console.log(message);
      throw new Error(message);
    });
  });
  afterAll(() => {
    spy.mockRestore();
  });
})();

