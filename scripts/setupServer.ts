import dotenv from 'dotenv';
import path from 'path';
import prettyFormat from 'pretty-format';

global['prettyFormat'] = prettyFormat;

// 把 console.error 转换成 error，方便断言
(() => {
  const spy = vi.spyOn(console, 'error');
  afterAll(() => {
    spy.mockRestore();
  });
})();

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
