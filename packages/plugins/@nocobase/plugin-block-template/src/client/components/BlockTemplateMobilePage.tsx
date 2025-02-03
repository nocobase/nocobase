import React from 'react';
import { MobilePage } from '@nocobase/plugin-mobile/client';
import { useParams } from 'react-router-dom';
import { useRequest } from '@nocobase/client';
import { Spin } from 'antd';
import { BlockTemplateInfoContext } from './BlockTemplateInfoContext';

export const BlockTemplateMobilePage = () => {
  const { key } = useParams<{ key: string }>();
  const { data, loading } = useRequest<any>({
    url: `blockTemplates:get/${key}`,
  });

  if (loading) {
    return <Spin />;
  }

  return (
    <BlockTemplateInfoContext.Provider value={data?.data}>
      <MobilePage />
    </BlockTemplateInfoContext.Provider>
  );
};
