import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  providerDescription: '此頁面使用由同一客戶端外掛貢獻的提供程式。',
  loadError: '無法載入伺服器路由。',
  clientExample: '客戶端路由範例',
  title: '路線範例',
  pageDescription: '它是延遲載入的，並從同一外掛的伺服器路由讀取回應。',
  loading: '正在載入伺服器資料...',
  retry: '重試請求',
  plugin: '外掛',
  scope: '範圍',
  message: '留言',
};

export default zhTW;
