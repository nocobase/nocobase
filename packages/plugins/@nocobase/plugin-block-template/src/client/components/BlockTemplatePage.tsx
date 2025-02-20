/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest, RemoteSchemaComponent } from '@nocobase/client';
import React from 'react';
import { useT } from '../locale';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { Breadcrumb, Spin, theme } from 'antd';
import { BlockTemplateInfoContext } from './BlockTemplateInfoContext';

export const BlockTemplatePage = () => {
  const params = useParams();
  const { token } = theme.useToken();
  const t = useT();
  const { data, loading } = useRequest<any>({
    url: `blockTemplates:get/${params.key}`,
  });
  const { title } = data?.data || {};

  if (loading) {
    return <Spin />;
  }

  const schemaUid = data?.data?.uid;

  return (
    <div>
      <div
        style={{
          margin: -token.margin,
          padding: token.paddingSM,
          background: token.colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Breadcrumb
          items={[
            {
              title: <Link to={`/admin/settings/block-templates`}>{t('Block template')}</Link>,
            },
            {
              title: title,
            },
          ]}
        />
      </div>
      <div style={{ marginTop: token.marginXL, position: 'relative', zIndex: 0 /** create a new z-index context */ }}>
        <BlockTemplateInfoContext.Provider value={data?.data}>
          <RemoteSchemaComponent uid={schemaUid} />
        </BlockTemplateInfoContext.Provider>
      </div>
    </div>
  );
};
