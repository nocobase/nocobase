import { initEnv } from '@nocobase/cli';

process.env.APP_ENV_PATH = process.env.APP_ENV_PATH || '.env.test';

initEnv();

expect.extend({
  /**
   * 自定义匹配器，用于检查一个值是否与期望值相等（在转换为字符串后）。
   * 这允许测试断言兼容数字和字符串类型。
   * * 用法: expect(value).toEqualNumberOrString(expected)
   * expect.toEqualNumberOrString(expected)
   */
  toEqualNumberOrString(received, expected) {
    const pass = String(received) === String(expected);
    if (pass) {
      return {
        message: () => `expected ${received} not to be string-equal to ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be string-equal to ${expected}`,
        pass: false,
      };
    }
  },
});
