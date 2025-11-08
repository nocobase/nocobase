// __benchmarks__/k6/write-single.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export { setup } from './setup.js';

export const options = {
  stages: [
    { duration: '1s', target: 100 },
    { duration: '59s', target: 100 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 请求 < 500ms
    http_req_failed: ['rate<0.01'], // 失败率 < 1%
  },
};

export default function ({ token }) {
  const id = Math.floor(Math.random() * 1000000) + 1;
  const url = `${__ENV.TARGET_ORIGIN}/api/posts:get/${id}?appends[]=comments&appends[]=category&appends[]=tags&appends[]=createdBy&appends[]=comments`;
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
  });
}
