/*
# 客户端常规请求

# 步骤

Step 1: 启动服务器
yarn run:example api-client/server start

Step 2: 客户端常规请求 —— api.request()
yarn run:example api-client/api.request
*/
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

(async () => {
  const response = await api.request({
    url: 'test:list',
  });
  // 等价于
  // const response = await api.resource('test').list();
  console.log(response.data);
})();
