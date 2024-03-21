import React, { useEffect, useState } from 'react';
import {
  APIClient,
  APIClientProvider,
  CollectionFieldProvider,
  CollectionProvider_deprecated,
  compose,
  RecordProvider,
  useCollectionField_deprecated,
} from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';

const apiClient = new APIClient();

const mock = new MockAdapter(apiClient.axios);

mock.onGet('/posts/1/tags:list').reply(200, {
  data: [
    { id: 1, name: 'Tag 1' },
    { id: 2, name: 'Tag 2' },
  ],
});

const collection = {
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      targetKey: 'id',
      sourceKey: 'id',
      foreignKey: 'postId',
      otherKey: 'tagId',
    },
  ],
};

const record = { id: 1 };

const providers = [
  // API 客户端
  [APIClientProvider, { apiClient }],
  // 提供当前数据表行记录的上下文
  [RecordProvider, { record }],
  // 提供数据表配置的上下文
  [CollectionProvider_deprecated, { collection }],
  // 提供字段配置上的下文
  [CollectionFieldProvider, { name: 'tags' }],
];

export default compose(...providers)(() => {
  const { resource } = useCollectionField_deprecated();
  const [items, setItems] = useState([]);
  useEffect(() => {
    // 请求地址为 /posts/1/tags:list
    resource
      .list()
      .then((response) => {
        setItems(response?.data?.data);
      })
      .catch(console.error);
  }, []);
  return <div>{items?.map((item, key) => <div key={key}>{item.name}</div>)}</div>;
});
