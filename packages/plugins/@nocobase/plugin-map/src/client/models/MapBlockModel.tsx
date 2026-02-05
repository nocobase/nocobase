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
import { Space, InputNumber } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { CollectionBlockModel, BlockSceneEnum, openViewFlow } from '@nocobase/client';
import React from 'react';
import { MapBlockComponent } from './MapBlockComponent';
import { NAMESPACE } from '../locale';

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
  onInit(options: any): void {
    super.onInit(options);
    this.setStepParams('popupSettings', 'openView', {
      disablePopupTemplateMenu: true,
    });
    this.resource.on('refresh', async () => {
      this.resource.setSelectedRows([]);
      this.selectedRecordKeys = [];
    });
  }
  createResource(ctx, params) {
    return this.context.createResource(MultiRecordResource);
  }
  renderConfigureAction() {
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

  getInputArgs() {
    const inputArgs = {};
    if (this.context.resource) {
      const sourceId = this.context.resource.getSourceId();
      if (sourceId) {
        inputArgs['sourceId'] = sourceId;
      }
    }
    if (this.context.collection && this.context.record) {
      const filterByTk = this.context.collection.getFilterByTK(this.context.record);
      if (filterByTk) {
        inputArgs['filterByTk'] = filterByTk;
      }
    }
    return inputArgs;
  }

  protected onMount(): void {
    super.onMount();
    this.onOpenView = (record) => {
      const filterByTk = this.context.collection.getFilterByTK(record);
      this.dispatchEvent('click', {
        onChange: this.props.onChange,
        record: record,
        filterByTk,
      });
    };
  }

  set onOpenView(fn) {
    this.setProps({ onOpenView: fn });
  }

  renderComponent() {
    const isConfigMode = !!this.context.flowSettingsEnabled;

    return (
      <div>
        <DndProvider>
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
                if (action.hidden && !isConfigMode) {
                  return;
                }
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
              {this.renderConfigureAction()}
            </Space>
          </div>
        </DndProvider>
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
  title: tExpr('Map block settings', { ns: NAMESPACE }),
  steps: {
    init: {
      title: tExpr('Map Field & Marker field', { ns: NAMESPACE }),
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
            title: t('Map field', { ns: NAMESPACE }),
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
            title: t('Marker field', { ns: NAMESPACE }),
            enum: markerFieldOptions.map((v) => {
              return {
                label: v.label,
                value: v.value,
              };
            }),
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const value = field.form.values.mapField;
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
          let collectionField;
          let associationCollectionField;
          if (params.mapField.length > 1) {
            collectionField = ctx.collection.getFieldByPath(params.mapField.join('.'));
            associationCollectionField = ctx.collection.getFieldByPath(params.mapField[0]);
          } else {
            collectionField = ctx.collection.getField(params.mapField[0]);
          }
          ctx.model.setProps('mapField', params.mapField);
          ctx.model.setProps('marker', params.marker);
          ctx.model.setProps('mapFieldCollectionField', collectionField);
          ctx.model.setProps('markerFieldCollectionField', ctx.collection.getField(params.marker));
          ctx.model.setProps('associationCollectionField', associationCollectionField);
        }
      },
    },
    addAppends: {
      handler(ctx, params) {
        ctx.resource.setRequestParameters({
          paginate: false,
        });
        const { associationCollectionField } = ctx.model.props;
        if (associationCollectionField) {
          ctx.resource.addAppends(associationCollectionField.name);
        }
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    lineSort: {
      use: 'sortingRule',
      title: tExpr('Concatenation order field', { ns: NAMESPACE }),
      async handler(ctx, params) {
        const sortArr = params.sort.map((item) => {
          return item.direction === 'desc' ? `-${item.field}` : item.field;
        });
        // @ts-ignore
        const resource = ctx.model?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }
        ctx.model.setProps({
          lineSort: sortArr,
        });
      },
    },
    mapZoom: {
      title: tExpr('The default zoom level of the map', { ns: NAMESPACE }),
      uiSchema(ctx) {
        const t = ctx.t;
        return {
          zoom: {
            title: t('Zoom'),
            'x-component': InputNumber,
            'x-decorator': 'FormItem',
            'x-component-props': {
              precision: 0,
            },
          },
        };
      },
      defaultParams: {
        zoom: 13,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          zoom: params.zoom,
        });
      },
    },
  },
});

MapBlockModel.registerFlow(openViewFlow);

// MapBlockModel.registerFlow({
//   key: 'popupSettings',
//   title: tExpr('Selector setting'),
//   on: {
//     eventName: 'openView',
//   },
//   steps: {
//     openView: {
//       title: tExpr('Edit popup'),
//       uiSchema: {
//         mode: {
//           type: 'string',
//           title: tExpr('Open mode'),
//           enum: [
//             { label: tExpr('Drawer'), value: 'drawer' },
//             { label: tExpr('Dialog'), value: 'dialog' },
//           ],
//           'x-decorator': 'FormItem',
//           'x-component': 'Radio.Group',
//         },
//         size: {
//           type: 'string',
//           title: tExpr('Popup size'),
//           enum: [
//             { label: tExpr('Small'), value: 'small' },
//             { label: tExpr('Medium'), value: 'medium' },
//             { label: tExpr('Large'), value: 'large' },
//           ],
//           'x-decorator': 'FormItem',
//           'x-component': 'Radio.Group',
//         },
//       },
//       defaultParams: {
//         mode: 'drawer',
//         size: 'medium',
//       },
//       handler(ctx, params) {
//         const { onChange } = ctx.inputArgs;
//         const toOne = ['belongsTo', 'hasOne'].includes(ctx.collectionField.type);
//         const sizeToWidthMap: Record<string, any> = {
//           drawer: {
//             small: '30%',
//             medium: '50%',
//             large: '70%',
//           },
//           dialog: {
//             small: '40%',
//             medium: '50%',
//             large: '80%',
//           },
//           embed: {},
//         };
//         const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
//         const size = ctx.inputArgs.size || params.size || 'medium';
//         ctx.viewer.open({
//           type: openMode,
//           width: sizeToWidthMap[openMode][size],
//           inheritContext: false,
//           target: ctx.layoutContentElement,
//           inputArgs: {
//             parentId: ctx.model.uid,
//             scene: 'view',
//             dataSourceKey: ctx.collection.dataSourceKey,
//             collectionName: ctx.collectionField?.target,
//             collectionField: ctx.collectionField,
//             rowSelectionProps: {
//               type: toOne ? 'radio' : 'checkbox',
//               defaultSelectedRows: () => {
//                 return ctx.model.props.value;
//               },
//               renderCell: undefined,
//               selectedRowKeys: undefined,
//             },
//           },
//           content: () => <RecordPickerContent model={ctx.model} toOne={toOne} />,
//           styles: {
//             content: {
//               padding: 0,
//               backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
//               ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
//             },
//             body: {
//               padding: 0,
//             },
//           },
//         });
//       },
//     },
//   },
// });

MapBlockModel.define({
  label: tExpr('Map', { ns: NAMESPACE }),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  sort: 600,
});
