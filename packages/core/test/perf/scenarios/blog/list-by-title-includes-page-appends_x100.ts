// __benchmarks__/k6/write-single.js
import http from 'k6/http';
import { check, sleep } from 'k6';

import { uid } from '../../utils.js';
export { setup } from './setup.js';

export const options = {
  stages: [
    // { duration: '1s', target: 1 },
    { duration: '1s', target: 100 },
    { duration: '59s', target: 100 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% 请求 < 400ms
    http_req_failed: ['rate<0.01'], // 失败率 < 1%
  },
};

export default function ({ token }) {
  const keyword = uid(1);
  const url = `${__ENV.TARGET_ORIGIN}/api/posts:list?filter=${JSON.stringify({
    $and: [{ title: { $includes: keyword } }],
  })}&sort=-createdAt&pageSize=50&page=${
    Math.floor(Math.random() * 2000) + 1
  }&appends[]=category&appends[]=tags&appends[]=createdBy&appends[]=updatedBy&appends[]=comments`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Role': 'admin',
    },
  };

  const res = http.get(url, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has data': (r) => r.json('data').length > 1,
  });

  sleep(1);
}
