import { useRequest } from "@nocobase/client";

export const MapConfigurationResourceKey = 'map-configuration';

export const useMapConfiguration = (type: string) => {
  return useRequest({
    resource: MapConfigurationResourceKey,
    action: 'get',
    params: {
      type,
    },
  }).data?.data;
}


