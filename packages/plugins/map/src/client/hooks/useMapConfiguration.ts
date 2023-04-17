import { useRequest } from '@nocobase/client';

export const MapConfigurationResourceKey = 'map-configuration';
export const getSSKey = (type) => {
  return `NOCOBASE_PLUGIN_MAP_CONFIGURATION_${type}`;
};

export const useMapConfiguration = (type: string) => {
  // cache
  const config = sessionStorage.getItem(getSSKey(type));
  if (config) {
    return JSON.parse(config);
  }
  return useRequest(
    {
      resource: MapConfigurationResourceKey,
      action: 'get',
      params: {
        type,
      },
    },
    {
      onSuccess(data) {
        sessionStorage.setItem(getSSKey(type), JSON.stringify(data?.data));
      },
      refreshOnWindowFocus: false,
      refreshDeps: [],
      manual: config ? true : false,
    },
  ).data?.data;
};
