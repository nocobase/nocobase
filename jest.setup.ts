import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import prettyFormat from 'pretty-format';
import yargs from 'yargs';

const envFile = existsSync(resolve(__dirname, '.env.test')) ? '.env.test' : '.env';

dotenv.config({
  path: resolve(__dirname, envFile),
});

if (yargs.argv.dbDialect) {
  process.env.DB_DIALECT = yargs.argv.dbDialect as any;
}

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
