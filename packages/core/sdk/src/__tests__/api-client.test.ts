import { AxiosResponse } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { APIClient, Storage } from '../';
import { Auth } from '../APIClient';

describe('api-client', () => {
  test('instance', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
    });
    const mock = new MockAdapter(api.axios);
    mock.onGet('users:get').reply(200, {
      data: { id: 1, name: 'John Smith' },
    });
    const response = await api.request({ url: 'users:get' });
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      data: { id: 1, name: 'John Smith' },
    });
  });

  test('signIn', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
    });
    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:signIn').reply(200, {
      data: { id: 1, name: 'John Smith', token: '123' },
    });
    const response = await api.auth.signIn({});
    expect(response.status).toBe(200);
    expect(api.auth.getToken()).toBe('123');
    const local = JSON.parse(localStorage.getItem('NOCOBASE_AUTH'));
    expect(local.token).toBe('123');
  });

  test('resource action', async () => {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
    });
    const mock = new MockAdapter(api.axios);
    mock.onPost('users:test').reply(200, {
      data: { id: 1, name: 'John Smith', token: '123' },
    });
    const response = await api.resource('users').test();
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      data: { id: 1, name: 'John Smith', token: '123' },
    });
  });

  test('custom storage', async () => {
    const items = new Map();

    class TestStorage extends Storage {
      clear() {
        items.clear();
      }
      getItem(key: string) {
        return items.get(key);
      }
      setItem(key: string, value: string) {
        return items.set(key, value);
      }
      removeItem(key: string) {
        return items.delete(key);
      }
    }

    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      storageClass: TestStorage,
    });

    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:signIn').reply(200, {
      data: { id: 1, name: 'John Smith', token: '123' },
    });

    const response = await api.auth.signIn({});
    expect(response.status).toBe(200);
    expect(api.auth.getToken()).toBe('123');
    console.log(items.get('NOCOBASE_AUTH'));
    const local = JSON.parse(items.get('NOCOBASE_AUTH'));
    expect(local.token).toBe('123');
  });

  test('custom auth', async () => {
    class TestAuth extends Auth {
      async signIn(values: any): Promise<AxiosResponse<any, any>> {
        const response = await this.api.request({
          method: 'post',
          url: 'auth:test',
          data: values,
        });
        const data = response?.data?.data;
        this.setAuth({ authenticator: 'test', token: data?.token });
        return response;
      }
    }

    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
      authClass: TestAuth,
    });

    expect(api.auth).toBeInstanceOf(TestAuth);

    const mock = new MockAdapter(api.axios);
    mock.onPost('auth:test').reply(200, {
      data: { id: 1, name: 'John Smith', token: '123' },
    });

    const response = await api.auth.signIn({});
    expect(response.status).toBe(200);
    expect(api.auth.getToken()).toBe('123');
    const local = JSON.parse(localStorage.getItem('NOCOBASE_AUTH'));
    expect(local.token).toBe('123');
  });
});
