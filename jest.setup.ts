import path from 'path';
import dotenv from 'dotenv';
import prettyFormat from 'pretty-format';

dotenv.config({
  path: path.resolve(__dirname, process.env.ENV_FILE || '.env'),
});

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
