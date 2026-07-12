/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import { APIClient } from './APIClient';
import { hasHeaderValue } from './headers';

export interface CreateTemporaryUrlOptions {
  url: string;
  params?: Record<string, unknown>;
}

const RESERVED_TEMPORARY_URL_PARAMS = ['accessCode', '__appName', 'token'];

const stringifyQuery = (params: Record<string, unknown>) =>
  qs.stringify(params, {
    strictNullHandling: true,
    arrayFormat: 'brackets',
  });

const buildTemporaryUrlTarget = ({ url, params = {} }: CreateTemporaryUrlOptions, baseURL?: string) => {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(url) || url.startsWith('//')) {
    throw new TypeError('Temporary URLs must target an app-local URL');
  }
  if (url.includes('#')) {
    throw new TypeError('Temporary URL targets cannot contain a fragment');
  }

  if (
    url
      .split('?', 1)[0]
      .split('/')
      .some((segment) => /^\.{1,2}$/.test(decodeURIComponent(segment)))
  ) {
    throw new TypeError('Temporary URL targets cannot contain dot path segments');
  }

  const parsedUrl = new URL(`/${url.replace(/^\/+/, '')}`, 'http://localhost');
  const pathname = parsedUrl.pathname.replace(/^\/+/, '');
  const baseUrlPathname = baseURL ? new URL(baseURL, 'http://localhost').pathname.replace(/^\/+|\/+$/g, '') : '';
  if (baseUrlPathname && (pathname === baseUrlPathname || pathname.startsWith(`${baseUrlPathname}/`))) {
    throw new TypeError('Temporary URL targets must not include the API baseURL pathname');
  }

  const queryParams = {
    ...(qs.parse(parsedUrl.search.slice(1), { strictNullHandling: true }) as Record<string, unknown>),
    ...params,
  };
  const queryString = stringifyQuery(queryParams);
  const searchParams = new URLSearchParams(queryString);

  for (const name of RESERVED_TEMPORARY_URL_PARAMS) {
    if (searchParams.has(name)) {
      throw new TypeError(`Temporary URL targets cannot contain the ${name} parameter`);
    }
  }

  return queryString ? `${pathname}?${queryString}` : pathname;
};

export class Auth {
  protected api: APIClient;

  get storagePrefix() {
    return this.api.storagePrefix;
  }

  protected options = {
    locale: null,
    role: null,
    authenticator: null,
    token: null,
  };

  constructor(api: APIClient) {
    this.api = api;
    this.api.axios.interceptors.request.use(this.middleware.bind(this));
  }

  get locale() {
    return this.getLocale();
  }

  set locale(value: string) {
    this.setLocale(value);
  }

  get role() {
    return this.getRole();
  }

  set role(value: string) {
    this.setRole(value);
  }

  get token() {
    return this.getToken();
  }

  set token(value: string) {
    this.setToken(value);
  }

  get authenticator() {
    return this.getAuthenticator();
  }

  set authenticator(value: string) {
    this.setAuthenticator(value);
  }

  /**
   * @internal
   */
  getOption(key: string) {
    return this.api.storage.getItem(key);
  }

  /**
   * @internal
   */
  setOption(key: string, value?: string) {
    this.options[key] = value;
    return this.api.storage.setItem(key, value || '');
  }

  /**
   * @internal
   * use {@link Auth#locale} instead
   */
  getLocale() {
    return this.getOption('locale');
  }

  /**
   * @internal
   * use {@link Auth#locale} instead
   */
  setLocale(locale: string) {
    this.setOption('locale', locale);
  }

  /**
   * @internal
   * use {@link Auth#role} instead
   */
  getRole() {
    return this.getOption('role');
  }

  /**
   * @internal
   * use {@link Auth#role} instead
   */
  setRole(role: string) {
    this.setOption('role', role);
  }

  /**
   * @internal
   * use {@link Auth#token} instead
   */
  getToken() {
    return this.getOption('token');
  }

  /**
   * @internal
   * use {@link Auth#token} instead
   */
  setToken(token: string) {
    this.setOption('token', token);

    if (this.api['app']) {
      this.api['app'].eventBus.dispatchEvent(
        new CustomEvent('auth:tokenChanged', { detail: { token, authenticator: this.authenticator } }),
      );
    }
  }

  /**
   * @internal
   * use {@link Auth#authenticator} instead
   */
  getAuthenticator() {
    return this.getOption('auth');
  }

  /**
   * @internal
   * use {@link Auth#authenticator} instead
   */
  setAuthenticator(authenticator: string) {
    this.setOption('auth', authenticator);
  }

  middleware(config: AxiosRequestConfig) {
    if (this.locale && config.headers) {
      config.headers['X-Locale'] = this.locale;
    }
    if (this.role && config.headers) {
      config.headers['X-Role'] = this.role;
    }
    if (this.authenticator && !hasHeaderValue(config.headers, 'X-Authenticator') && config.headers) {
      config.headers['X-Authenticator'] = this.authenticator;
    }
    if (this.token && !hasHeaderValue(config.headers, 'Authorization') && config.headers) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }
    return config;
  }

  async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>> {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:signIn',
      data: values,
      headers: {
        'X-Authenticator': authenticator,
      },
    });
    const data = response?.data?.data;
    this.setAuthenticator(authenticator);
    this.setToken(data?.token);
    return response;
  }

  async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>> {
    return await this.api.request({
      method: 'post',
      url: 'auth:signUp',
      data: values,
      headers: {
        'X-Authenticator': authenticator,
      },
    });
  }

  async signOut() {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:signOut',
    });
    this.setToken(null);
    this.setRole(null);
    this.setAuthenticator(null);
    return response;
  }

  async lostPassword(values: any): Promise<AxiosResponse<any>> {
    // 获取当前 URL 的查询参数
    const searchParams = new URLSearchParams(window.location.search);

    // 转换为对象
    const paramsObject = Object.fromEntries(searchParams.entries());

    const response = await this.api.request({
      method: 'post',
      url: 'auth:lostPassword',
      data: {
        ...values,
        baseURL: window.location.href.split('/forgot-password')[0],
      },
      headers: {
        'X-Authenticator': paramsObject.name,
      },
    });
    return response;
  }

  async resetPassword(values: any): Promise<AxiosResponse<any>> {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:resetPassword',
      data: values,
    });
    return response;
  }

  async checkResetToken(values: any): Promise<AxiosResponse<any>> {
    const response = await this.api.request({
      method: 'post',
      url: 'auth:checkResetToken',
      data: values,
    });
    return response;
  }

  /**
   * Creates an app-local URL authenticated by a short-lived access code.
   * The server limits the URL to GET/HEAD and keeps the current app, authenticator, role, and ACL context.
   */
  async createTemporaryUrl(options: CreateTemporaryUrlOptions): Promise<string> {
    const target = buildTemporaryUrlTarget(options, this.api.axios.defaults.baseURL);
    const response = await this.api.request<{ data: { code: string } }>({
      method: 'post',
      url: 'auth:createAccessCode',
      data: { target },
    });
    const query = new URLSearchParams({ accessCode: response.data.data.code });

    const headers = this.api.getHeaders() as Record<string, unknown>;
    const headerAppName = headers['X-App'];
    const apiOptions = this.api.options;
    const configuredAppName = apiOptions && typeof apiOptions !== 'function' ? apiOptions.appName : undefined;
    const appName = typeof headerAppName === 'string' && headerAppName ? headerAppName : configuredAppName;
    if (appName && appName !== 'main') {
      query.set('__appName', appName);
    }

    const path = `${target}${target.includes('?') ? '&' : '?'}${query}`;
    const baseURL = this.api.axios.defaults.baseURL?.replace(/\/+$/, '') || '';
    const combinedUrl = baseURL ? `${baseURL}/${path}` : `/${path}`;
    const url =
      /^[a-z][a-z\d+.-]*:\/\//i.test(combinedUrl) || typeof window === 'undefined'
        ? combinedUrl
        : new URL(combinedUrl, window.location.origin).toString();

    return url;
  }
}
