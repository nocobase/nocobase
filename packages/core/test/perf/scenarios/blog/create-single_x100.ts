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
