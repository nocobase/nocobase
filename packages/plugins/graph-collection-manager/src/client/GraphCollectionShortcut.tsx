import { PartitionOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { ActionContext, PluginManager, SchemaComponent,useRequest } from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { graphCollections } from './schemas/graphCollection';
import { GraphCollectionLink } from './GraphCollectionLink';
import {Editor,GraphDrawerProver} from './GraphDrawPage' 

export const GraphCollectionPane = () => {
  const { t } = useTranslation();
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={
          {
            type: 'void',
            properties:{
              editor:{
                type: 'void',
                'x-decorator':'GraphDrawerProver',
                'x-component':'Editor',
              }
            }
          }
        }
        components={{
          Editor,
          GraphDrawerProver
        }}
      />
    </Card>
  );
};

export const GraphCollectionShortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      icon={<PartitionOutlined />}
      title={t('graph collection')}
      onClick={() => {
        history.push('/admin/settings/graph/collections');
      }}
    />
  );
};





