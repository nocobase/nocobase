//@ts-nocheck
import dotenv from 'dotenv';
import path from 'path';

class Worker {
  url: any;
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
  onmessage(msg: any) {
    throw new Error('Method not implemented.');
  }
}
global['Worker'] = Worker;
global['prettyFormat'] = prettyFormat;
global.URL.createObjectURL = function () {};
jest.setTimeout(300000);

// 把 console.error 转换成 error，方便断言
(() => {
  const spy = jest.spyOn(console, 'error');
  afterAll(() => {
    spy.mockRestore();
  });
})();
