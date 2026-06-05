/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Application } from '@nocobase/client';
import qs from 'qs';
import { interceptor } from '../interceptor';

describe('filter-operator-multiple-keywords > client interceptor', () => {
  let mock: MockAdapter;
  let mockApp: Application;

  beforeEach(() => {
    mockApp = new Application({
      apiClient: {
        baseURL: 'http://localhost:8000/api',
      },
    });
    mockApp.apiClient.axios = axios.create();

    mock = new MockAdapter(mockApp.apiClient.axios, { onNoMatch: 'throwException' });

    mockApp.apiClient.axios.interceptors.request.use(interceptor);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should not convert non-list GET requests', async () => {
    let requestMethod;

    mock.onAny(new RegExp('^/api/test/1(\\?.*)?$')).reply(function (config) {
      requestMethod = config.method;
      return [200, { success: true }];
    });

    await mockApp.apiClient.axios.get('/api/test/1');

    expect(requestMethod).toBe('get');
  });

  it('should merge query params with data in POST requests', async () => {
    let requestData;
    let requestMethod;
    let requestParams;

    // Use regular expression to match any query parameters
    mock.onAny(new RegExp('^/api/test:list(\\?.*)?$')).reply(function (config) {
      requestData = config.data;
      requestMethod = config.method;
      requestParams = config.params;
      return [200, { success: true }];
    });

    await mockApp.apiClient.axios.post(
      '/api/test:list?param1=value1',
      {
        data: { field: 'value' },
      },
      {
        params: {
          param2: 'value2',
        },
      },
    );

    // Verify original POST request is not affected
    expect(requestMethod).toBe('post');
    expect(requestParams).toMatchObject({ param2: 'value2' });
  });

  it('should not convert GET requests to POST if URL length is less than 2000', async () => {
    let requestMethod;
    let requestParams;

    mock.onAny(new RegExp('^/api/test:list(\\?.*)?$')).reply(function (config) {
      requestMethod = config.method;
      requestParams = config.params;
      return [200, { success: true }];
    });

    // Create a request with small parameters that won't exceed 2000 characters
    await mockApp.apiClient.axios.get('/api/test:list', {
      params: {
        filter: { name: 'short' },
      },
    });

    // Verify the request remains GET
    expect(requestMethod).toBe('get');
    expect(requestParams).toMatchInlineSnapshot(`
      {
        "filter": {
          "name": "short",
        },
      }
    `);
  });

  it('should convert GET requests to POST when URL exceeds 2000 characters', async () => {
    let requestMethod;
    let requestParams;
    let requestData;

    mock.onAny(new RegExp('^/api/test:list(\\?.*)?$')).reply(function (config) {
      requestMethod = config.method;
      requestParams = config.params;
      requestData = config.data;
      return [200, { success: true }];
    });

    // Generate a long string that will make the URL exceed 2000 characters
    const generateLongString = (length: number) => {
      return Array(length).fill('a').join('');
    };

    const longParams = {
      filter: {
        name: generateLongString(2000),
      },
      sort: ['id'],
    };

    await mockApp.apiClient.axios.get('/api/test:list', {
      params: longParams,
    });

    // Verify the request has been converted to POST due to URL length
    expect(requestMethod).toBe('post');
    expect(requestParams).toEqual({});

    // Check if data contains the original params and method
    const parsedData = JSON.parse(requestData);
    expect(parsedData.__params__.filter.name).toEqual(longParams.filter.name);
    expect(parsedData.__params__.sort).toEqual(longParams.sort);
    expect(parsedData.__method__).toEqual('get');
  });

  it('should correctly calculate URL length with stringified params', async () => {
    // Spy on the stringification process
    const stringifySpy = vi.spyOn(qs, 'stringify');

    let requestMethod;

    mock.onAny(new RegExp('^/api/test:list(\\?.*)?$')).reply(function (config) {
      requestMethod = config.method;
      return [200, { success: true }];
    });

    // Create parameters right at the threshold
    const thresholdParams = {
      filter: {
        // This will create a parameter string close to but under 2000 chars when combined with URL
        field1: Array(1900).fill('x').join(''),
      },
    };

    await mockApp.apiClient.axios.get('/api/test:list', {
      params: thresholdParams,
    });

    expect(stringifySpy).toHaveBeenCalled();
    // Add 15 for '/api/test:list?' which gives us the base URL length
    const urlLength = stringifySpy.mock.results[0].value.length + 15;

    // Based on the interceptor logic, if URL <= 2000 it should remain GET, otherwise POST
    if (urlLength <= 2000) {
      expect(requestMethod).toBe('get');
    } else {
      expect(requestMethod).toBe('post');
    }

    stringifySpy.mockRestore();
  });
});
