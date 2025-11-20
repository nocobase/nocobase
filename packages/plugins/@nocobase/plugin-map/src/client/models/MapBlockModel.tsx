/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DndProvider,
  MultiRecordResource,
  FlowModelRenderer,
  tExpr,
  DragHandler,
  AddSubModelButton,
  FlowSettingsButton,
  Droppable,
} from '@nocobase/flow-engine';
import { Space } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { CollectionBlockModel, BlockSceneEnum, ActionModel, BlockModel } from '@nocobase/client';
import React from 'react';
import { MapBlockComponent } from './MapBlockComponent';

const findNestedOption = (value: string[] | string, options = []) => {
  if (typeof value === 'string') {
    value = [value];
  }
  return value?.reduce((cur, v, index) => {
    const matched = cur?.find((item) => item.value === v);
    return index === value.length - 1 ? matched : matched?.children;
  }, options);
};
export class MapBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;
  selectedRecordKeys = [];
  get resource() {
    return super.resource as MultiRecordResource;
  }

  createResource(ctx, params) {
    return this.context.createResource(MultiRecordResource);
  }
  renderConfiguireActions() {
    return (
      <AddSubModelButton
        key={'map-add-actions'}
        model={this}
        subModelBaseClass={this.getModelClassName('MapActionGroupModel')}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  getSelectedRecordKeys() {
    return this.selectedRecordKeys;
  }

  setSelectedRecordKeys(keys) {
    const data = this.getSelectedRecordKeys();
    this.selectedRecordKeys = data.concat(keys);
    const selectRecords = this.selectedRecordKeys.map((v) => {
      return this.resource.getData().find((item) => item[this.collection.filterTargetKey] === v);
    });
    this.resource.setSelectedRows(selectRecords);
  }

  renderComponent() {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Space>
            {this.mapSubModels('actions', (action) => {
              // @ts-ignore
              if (action.props.position === 'left') {
                return (
                  <FlowModelRenderer
                    key={action.uid}
                    model={action}
                    showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                  />
                );
              }

              return null;
            })}
            {/* 占位 */}
            <span></span>
          </Space>
          <Space wrap>
            {this.mapSubModels('actions', (action) => {
              // @ts-ignore
              if (action.props.position !== 'left') {
                return (
                  <Droppable model={action} key={action.uid}>
                    <FlowModelRenderer
                      model={action}
                      showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                      extraToolbarItems={[
                        {
                          key: 'drag-handler',
                          component: DragHandler,
                          sort: 1,
                        },
                      ]}
                    />
                  </Droppable>
                );
              }

              return null;
            })}
            {this.renderConfiguireActions()}
          </Space>
        </div>
        <MapBlockComponent
          {...this.props}
          fields={this.collection.getFields()}
          name={this.collection.name}
          primaryKey={this.collection.filterTargetKey}
          setSelectedRecordKeys={this.setSelectedRecordKeys.bind(this)}
          dataSource={this.resource.getData()}
        />
      </div>
    );
  }
}
MapBlockModel.registerFlow({
  key: 'createMapBlock',
  steps: {
    init: {
      title: tExpr('Create map block'),
      preset: true,
      uiSchema: (ctx) => {
        const t = ctx.t;
        const dataSourceKey = ctx.dataSource.key;
        const collectionManager = ctx.dataSourceManager.getDataSource(dataSourceKey).collectionManager;
        const mapFieldOptions = collectionManager.getCollectionFieldsOptions(
          ctx.collection.name,
          ['point', 'lineString', 'polygon'],
          null,
          {
            association: ['o2o', 'obo', 'oho', 'o2m', 'm2o', 'm2m'],
          },
        );
        const markerFieldOptions = collectionManager.getCollectionFieldsOptions(ctx.collection.name, 'string', null, {
          dataSource: dataSourceKey,
        });

        return {
          mapField: {
            title: t('Map field'),
            required: true,
            enum: mapFieldOptions,
            'x-component': 'Cascader',
            'x-component-props': {},
            'x-decorator': 'FormItem',
            default: mapFieldOptions.length
              ? [mapFieldOptions[0].value, mapFieldOptions[0].children?.[0].value].filter(
                  (v) => v !== undefined && v !== null,
                )
              : [],
          },
          marker: {
            title: t('Marker field'),
            enum: markerFieldOptions.map((v) => {
              return {
                label: v.label,
                value: v.value,
              };
            }),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const value = field.form.values.field;
              if (!value?.length) {
                return;
              }
              const item = findNestedOption(value, mapFieldOptions);
              if (item) {
                field.hidden = item.options.type !== 'point';
              }
            },
          },
        };
      },
      async handler(ctx, params) {
        if (params.mapField) {
          ctx.model.setProps('mapField', params.mapField[0]);
          ctx.model.setProps('marker', params.marker);
          ctx.model.setProps('mapFieldCollectionField', ctx.collection.getField(params.mapField[0]));
          ctx.model.setProps('markerFieldCollectionField', ctx.collection.getField(params.marker));
        }
      },
    },
  },
});

MapBlockModel.registerFlow({
  key: 'mapSettings',
  sort: 500,
  title: tExpr('Map settings', { ns: 'map' }),
  steps: {
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    defaultSorting: {
      use: 'sortingRule',
      title: tExpr('Default sorting'),
    },
    refreshData: {
      title: tExpr('Refresh data'),
      async handler(ctx, params) {
        ctx.resource.on('refresh', async () => {
          ctx.model.resource.setSelectedRows([]);
        });
      },
    },
  },
});

MapBlockModel.define({
  label: tExpr('Map'),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  sort: 600,
});
