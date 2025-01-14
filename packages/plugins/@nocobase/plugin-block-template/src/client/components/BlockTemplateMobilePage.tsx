import React, { useEffect } from 'react';
import { MobilePage } from '@nocobase/plugin-mobile/client';
import { useParams } from 'react-router-dom';
import { useRequest, usePlugin } from '@nocobase/client';
import { PluginBlockTemplateClient } from '..';
import { Spin } from 'antd';
import { BlockTemplateInfoContext } from './BlockTemplateInfoContext';

export const BlockTemplateMobilePage = () => {
  const { key } = useParams<{ key: string }>();
  const plugin = usePlugin(PluginBlockTemplateClient);
  const { data, loading } = useRequest<any>({
    url: `blockTemplates:get/${key}`,
  });

  useEffect(() => {
    if (!data?.data) {
      return;
    }
    const getUids = (schema) => {
      const uids = [];
      if (schema['x-uid']) {
        uids.push(schema['x-uid']);
      }
      if (schema.properties) {
        for (const key in schema.properties) {
          uids.push(...getUids(schema.properties[key]));
        }
      }
      return uids;
    };
    const uids = getUids(data?.data);
    uids.forEach((uid) => {
      plugin.clearTemplateCache(uid);
    });
    plugin.loadingPromises.clear();
  }, [data, plugin]);

  if (loading) {
    return <Spin />;
  }

  return (
    <BlockTemplateInfoContext.Provider value={data?.data}>
      <MobilePage />
    </BlockTemplateInfoContext.Provider>
  );
};
