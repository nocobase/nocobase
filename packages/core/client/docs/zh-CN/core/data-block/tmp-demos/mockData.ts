import type { Application } from '@nocobase/client';
import MockAdapter from 'axios-mock-adapter';

const mockData = {
  'users:list': {
    data: [
      {
        id: '1',
        nickname: 'Jack Ma',
        email: 'test@gmail.com',
        favoriteColor: '#1677FF',
      },
      {
        id: '2',
        email: 'jim@gmail.com',
        nickname: 'Jim Green',
        favoriteColor: '#36C',
      },
      {
        id: '3',
        nickname: 'Tom Cat',
        email: 'tom@gmail.com',
        favoriteColor: '#F0F',
      },
    ],
  },
  'users:destroy': {
    result: 'ok',
  },
  'roles:list': {
    data: [
      {
        name: 'root',
        title: 'Root',
        description: 'Root',
      },
      {
        name: 'admin',
        title: 'Admin',
        description: 'Admin description',
      },
    ],
  },
  'test1:list': {
    data: [
      {
        id: '1',
        field1: 'aaa',
        field2: 1,
      },
      {
        id: '2',
        field1: 'bbb',
        field2: 2,
      },
      {
        id: '3',
        field1: 'ccc',
        field2: 3,
      },
    ],
  },
};

export function mock(app: Application) {
  const mock = new MockAdapter(app.apiClient.axios);

  Object.entries(mockData).forEach(([url, data]) => {
    mock.onGet(url).reply(async (config) => {
      return [200, data];
    });
    mock.onPost(url).reply(async (config) => {
      return [200, data];
    });
    mock.onDelete(url).reply(async (config) => {
      return [200, data];
    });
  });
}
