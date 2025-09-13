import type { APIClient } from '@nocobase/sdk';
import MockAdapter from 'axios-mock-adapter';

// 将 mock 安装到传入的 APIClient 上，避免重复创建实例导致 baseURL/拦截器不一致
export function setupApiMock(api: APIClient) {
  const mock = new MockAdapter(api.axios);
  // 简单模拟列表接口：users:list
  const records = Array.from({ length: 20 }).map((_, i) => ({ id: i + 1, name: `User_${i + 1}` }));

  mock.onGet('users:list').reply((config) => {
    const page = parseInt(String((config.params || {}).page || 1));
    const pageSize = parseInt(String((config.params || {}).pageSize || 10));
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

  // 详情：users:get（根据 filterByTk 返回单条）
  mock.onGet('users:get').reply((config) => {
    const tk = (config.params || {}).filterByTk;
    const rec = records.find((r) => String(r.id) === String(tk)) || records[0];
    return [200, { data: rec, meta: {} }];
  });
}
