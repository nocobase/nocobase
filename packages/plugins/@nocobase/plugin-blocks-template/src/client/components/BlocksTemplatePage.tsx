/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest, RemoteSchemaComponent, usePlugin } from '@nocobase/client';
import React from 'react';
import { useT } from '../locale';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { Breadcrumb, Spin } from 'antd';
import PluginBlocksTemplateClient from '..';

export const BlocksTemplatePage = () => {
  const params = useParams();
  const t = useT();
  const plugin = usePlugin(PluginBlocksTemplateClient);
  const { data, loading, refresh } = useRequest<any>({
    url: `blocksTemplates:get/${params.key}`,
  });
  const { title } = data?.data || {};

  if (loading) {
    return <Spin />;
  }

  const schemaUid = data?.data?.uid;

  const refreshTemplateSchemaCache = ({ data }) => {
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
    const uids = getUids(data);
    uids.forEach((uid) => {
      delete plugin.templateschemacache[uid];
    });
  };

  return (
    <div>
      <div
        style={{
          margin: '-24px',
          padding: '10px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Breadcrumb
          items={[
            {
              title: <Link to={`/admin/settings/blocks-templates`}>{t('Blocks template')}</Link>,
            },
            {
              title: title,
            },
          ]}
        />
      </div>
      <div style={{ margin: '100px auto' }}>
        <RemoteSchemaComponent onSuccess={refreshTemplateSchemaCache} onlyRenderProperties={true} uid={schemaUid} />
      </div>
    </div>
  );
};
