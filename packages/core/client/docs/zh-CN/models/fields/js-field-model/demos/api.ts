import { faker } from '@faker-js/faker';
import MockAdapter from 'axios-mock-adapter';
import { APIClient } from '@nocobase/sdk';

export const api = new APIClient({
  baseURL: 'https://localhost:8000/api',
});

const mock = new MockAdapter(api.axios);

const records = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  name: faker.person.firstName(),
  status: faker.helpers.arrayElement(['active', 'pending', 'blocked']),
  score: faker.number.int({ min: 0, max: 100 }),
  meta: {
    email: faker.internet.email(),
    city: faker.location.city(),
  },
}));

mock.onGet('users:list').reply((config) => {
  const page = parseInt(config.params?.page) || 1;
  const pageSize = parseInt(config.params?.pageSize) || 5;
  const start = (page - 1) * pageSize;
  const items = records.slice(start, start + pageSize);
  return [
    200,
    {
      data: items,
      meta: { page, pageSize, count: records.length },
    },
  ];
});

// 兼容详情页取单条记录
mock.onGet('/users:get').reply((config) => {
  const id = parseInt(config.params?.filterByTk || config.params?.id) || 1;
  const rec = records.find((r) => r.id === id) || records[0];
  return [200, { data: rec }];
});
mock.onGet('users:get').reply((config) => {
  const id = parseInt(config.params?.filterByTk || config.params?.id) || 1;
  const rec = records.find((r) => r.id === id) || records[0];
  return [200, { data: rec }];
});

// 创建（用于表单示例提交时不报错）
function handleCreate(config: any) {
  try {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const nextId = records.length ? Math.max(...records.map((r) => r.id)) + 1 : 1;
    const rec = { id: nextId, ...body };
    records.push(rec as any);
    return [200, { data: rec }];
  } catch (e) {
    return [200, { data: {} }];
  }
}
mock.onPost('users:create').reply(handleCreate);
mock.onPost('/users:create').reply(handleCreate);

// 校验接口：/validate-code
mock.onPost('/validate-code').reply((config) => {
  try {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    const val = String(body?.value || '');
    const ok = /^[A-Z0-9]{4,8}$/.test(val);
    return [200, { valid: ok, message: ok ? 'OK' : '仅允许大写字母与数字，长度 4-8' }];
  } catch (e) {
    return [200, { valid: false, message: '校验失败' }];
  }
});

// 远程建议：/suggest?keyword=
mock.onGet('/suggest').reply((config) => {
  const kw = String(config.params?.keyword || '').toLowerCase();
  const arr = records
    .map((r) => r.name)
    .filter((n) => !kw || n.toLowerCase().includes(kw))
    .slice(0, 6);
  return [200, { items: arr }];
});
