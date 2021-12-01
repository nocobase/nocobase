import { URL } from 'url';

const {
  API_ORIGIN_DEV = 'http://localhost:13002',
  LOCAL_STORAGE_USE_STATIC_SERVER,
  LOCAL_STORAGE_BASE_URL
} = process.env;

export function getLocalStorageProxy() {
  if (!LOCAL_STORAGE_USE_STATIC_SERVER) {
    return {};
  }

  const baseUrl = LOCAL_STORAGE_BASE_URL || '/uploads';
  let url;
  try {
    url = new URL(baseUrl);
  } catch(e) {
    url = {
      href: `${API_ORIGIN_DEV}${baseUrl}`
    };
  }

  // if local storage url is some network address,
  // such as ip or domain name rather than API_ORIGIN,
  // do not proxy.
  if (!API_ORIGIN_DEV || !url.href.startsWith(API_ORIGIN_DEV)) {
    return {};
  }

  const config = {
    [baseUrl]: {
      target: API_ORIGIN_DEV,
      changeOrigin: true,
    }
  }

  return config;
}
