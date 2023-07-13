/*
# 客户端资源请求

# 步骤

Step 1: 启动服务器
yarn run:example api-client/server start

Step 2: 客户端资源请求 —— api.resource(name).action(params)
yarn run:example api-client/api.resource
*/
import { APIClient } from '@nocobase/sdk';

const api = new APIClient({
  baseURL: 'http://localhost:13000/api',
});

(async () => {
  const response = await api.resource('test').list();
  // 等价于
  // const response = await api.request({
  //   url: 'test:list',
  // });
  console.log(response.data);
})();
