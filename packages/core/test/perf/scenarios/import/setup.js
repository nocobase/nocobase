const http = require('k6/http');
const { check } = require('k6');

export function setup() {
  // 在测试开始前执行一次
  let res = http.post(`${__ENV.TARGET_ORIGIN}/api/auth:signIn`, {
    account: 'nocobase',
    password: 'admin123',
  });

  check(res, { 'login succeeded': (r) => r.status === 200 });

  // 假设返回里有 token
  let data = res.json('data');
  return { token: data.token };
}
