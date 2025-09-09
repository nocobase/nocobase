/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Flex, Layout } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { DatasourceList } from './DatasourceList';
import {
  Collection,
  FlowModel,
  FlowModelContext,
  FlowModelRenderer,
  MultiRecordResource,
  observer,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { CollectionContext, CurrentCollection } from '../admin/datasource/context';
import { Preview } from '../admin/datasource/components/form-steps';
import { DEFAULT_DATA_SOURCE_KEY, useApp } from '@nocobase/client';
import { namespace } from '../../locale';
import { ContextItem } from '../types';

const { Footer, Sider, Content } = Layout;

export type DatasourceSelectorProps = {
  onAdd: (item: Omit<ContextItem, 'type'>) => void;
  onRemove: (uid: string) => void;
};

export const InnerDatasourceSelector: React.FC<DatasourceSelectorProps> = observer(({ onAdd, onRemove }) => {
  const ctx = useFlowViewContext<FlowModelContext>();
  const { Header, Footer } = ctx.view;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState<Record<string, any> | null>(null);

  const onSelect = useCallback(
    (item) => {
      const { datasource, collectionName } = item;
      setCollection(ctx.dataSourceManager.getCollection(datasource, collectionName));
      setFormData(item);
    },
    [ctx],
  );

  return (
    <>
      <Header title={ctx.t('Select datasource')} />
      <Layout style={{ height: '80vh' }}>
        <Sider width={300} style={{ backgroundColor: '#f5f5f5' }}>
          <Flex align="center" vertical>
            <DatasourceList onSelect={onSelect} onAdd={onAdd} onRemove={onRemove} />
          </Flex>
        </Sider>
        <Content style={{ backgroundColor: '#f5f5f5' }}>
          <CollectionContext.Provider value={new CurrentCollection(collection)}>
            {formData && <Preview formData={formData} show={true} />}
          </CollectionContext.Provider>
        </Content>
      </Layout>
      <Footer>
        <Flex justify="flex-end" align="end">
          <Button
            onClick={() => {
              ctx.view.close();
            }}
          >
            {ctx.t('Cancel')}
          </Button>
        </Flex>
      </Footer>
    </>
  );
});

class DatasourceSelectorModel extends FlowModel {
  declare resource: MultiRecordResource;
  declare props: DatasourceSelectorProps;

  onInit(options) {
    super.onInit(options);
    this.context.defineMethod('t', (key, options) => {
      return this.context.i18n.t(key, {
        ...options,
        ns: namespace,
      });
    });
  }

  render() {
    return <InnerDatasourceSelector {...this.props} />;
  }
}

DatasourceSelectorModel.registerFlow({
  key: 'resourceSettings',
  steps: {
    initResource: {
      handler: async (ctx) => {
        ctx.useResource('MultiRecordResource');
        const resource = ctx.resource as MultiRecordResource;
        resource.setDataSourceKey(DEFAULT_DATA_SOURCE_KEY);
        resource.setResourceName('aiContextDatasources');
        resource.setPageSize(10);
        await resource.refresh();
      },
    },
  },
});

export const DatasourceSelector: React.FC<DatasourceSelectorProps> = (props) => {
  const app = useApp();
  const model = useMemo(
    () =>
      app.flowEngine.createModel({
        use: DatasourceSelectorModel,
        props,
      }),
    [app, props],
  );

  return <FlowModelRenderer model={model} />;
};
