// __benchmarks__/k6/write-single.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

export { setup } from './setup.js';

export const options = {
  stages: [
    { duration: '1s', target: 100 },
    { duration: '59s', target: 100 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'], // 95% 请求 < 400ms
    http_req_failed: ['rate<0.01'], // 失败率 < 1%
  },
};

export default function ({ token }) {
  const url = `${__ENV.TARGET_ORIGIN}/api/posts:create`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Role': 'admin',
    },
  };
  const payload = JSON.stringify({
    title: `Title ${__VU}-${__ITER} ${Math.random().toString(36)}`,
    content: 'Some content',
    categoryId: 1,
    tags: [1, 2],
    publishedAt: new Date().toISOString(),
    status: 'published',
    allowComments: true,
    featured: false,
    viewCount: Math.floor(Math.random() * 1000),
    excerpt: 'This is a short excerpt of the post.',
    musicUrl: 'https://example.com/music.mp3',
    coverImage: 'https://example.com/cover.jpg',
    slug: `title-${__VU}-${__ITER}-${Math.random().toString(36)}`,
    read: 1,
    score: 4.5,
  });

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

// export function teardown({ token }) {
//   const url = `${__ENV.TARGET_ORIGIN}/api/posts:destroy`;
//   const params = {
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     },
//     queries: {
//       filter: JSON.stringify({ id: { $gt: 1000000 } }),
//     },
//   };

//   let res = http.delete(url, params);

//   check(res, {
//     'status is 200': (r) => r.status === 200,
//   });
// }

export function handleSummary(data) {
  const passes = getExecutionsCount(data.setup_data.token, 1);
  const fails = getExecutionsCount(data.setup_data.token, 0);
  const totalCount = passes + fails;

  data.metrics.executions = {
    contains: 'default',
    type: 'rate',
    values: {
      fails,
      passes,
      rate: totalCount !== 0 ? passes / totalCount : 0,
    },
  };
  return {
    stdout: textSummary(data, { enableColors: true }),
  };
}

function getExecutionsCount(token: string, status?: number) {
  const filter = { key: 'o96nn6fws73', status };
  const encodedFilter = encodeURIComponent(JSON.stringify(filter));
  const url = http.url`${__ENV.TARGET_ORIGIN}/api/executions:list?filter=${encodedFilter}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Role': 'admin',
    },
  };
  const res = http.request('GET', url, null, params);
  return Number(JSON.parse(res.body).meta.count);
}
