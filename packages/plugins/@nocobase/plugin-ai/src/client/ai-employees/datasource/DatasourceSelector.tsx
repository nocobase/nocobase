/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Divider, Empty, Flex, Layout, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import React, { useCallback, useMemo, useState } from 'react';
import { DatasourceList } from './DatasourceList';
import {
  Collection,
  FlowModel,
  FlowModelContext,
  FlowModelRenderer,
  MultiRecordResource,
  observer,
  useFlowContext,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { CollectionContext, CurrentCollection } from '../admin/datasource/context';
import { Preview } from '../admin/datasource/components/form-steps';
import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client';
import { namespace } from '../../locale';
import { ContextItem } from '../types';
import { dialogController } from '../stores/dialog-controller';

const { Sider, Content } = Layout;

export type DatasourceSelectorProps = {
  contextItems?: ContextItem[];
  onAdd: (item: Omit<ContextItem, 'type'>) => void;
  onRemove: (uid: string) => void;
};

export const InnerDatasourceSelector: React.FC<DatasourceSelectorProps> = observer(
  ({ contextItems, onAdd, onRemove }) => {
    const ctx = useFlowViewContext<FlowModelContext>();
    const resourceCtx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();
    const dataSource = resourceCtx.resource.getData();
    const { Header } = ctx.view;
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

    const closeBtn = (
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={() => {
          dialogController.resume();
          ctx.view.close();
        }}
      ></Button>
    );

    return (
      <>
        <div style={{ backgroundColor: '#f5f5f5', borderRadius: 8 }}>
          <Header
            title={
              <>
                <Space>
                  {closeBtn}
                  <span>{resourceCtx.t('Select datasource')}</span>
                </Space>
              </>
            }
          />
          {dataSource.length ? (
            <Layout style={{ height: '80vh', backgroundColor: '#f5f5f5' }}>
              <Sider width={300} style={{ paddingLeft: 20, backgroundColor: 'transparent' }}>
                <Flex align="center" vertical>
                  <DatasourceList onSelect={onSelect} contextItems={contextItems} onAdd={onAdd} onRemove={onRemove} />
                </Flex>
              </Sider>
              <Divider type="vertical" variant="dashed" style={{ height: '95%', margin: 'auto 0px auto 10px' }} />
              <Content style={{ backgroundColor: 'transparent' }}>
                <CollectionContext.Provider value={new CurrentCollection(collection)}>
                  {formData && <Preview formData={formData} show={true} />}
                </CollectionContext.Provider>
              </Content>
            </Layout>
          ) : (
            <Flex style={{ height: '80vh' }} justify="center" align="center" vertical>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </Flex>
          )}
        </div>
      </>
    );
  },
);

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
        resource.setRequestParameters({
          filter: {
            enabled: true,
          },
          sort: ['-createdAt'],
        });
        resource.setPageSize(10);
        await resource.refresh();
      },
    },
  },
});

export const DatasourceSelector: React.FC<DatasourceSelectorProps> = observer((props) => {
  const ctx = useFlowContext();
  const model = useMemo(() => {
    return ctx.engine.createModel({
      use: DatasourceSelectorModel,
      props,
    });
  }, [ctx, props]);

  return <FlowModelRenderer model={model} />;
});
