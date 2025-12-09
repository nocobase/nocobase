/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockOutlined, QuestionCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import type { CollectionField, PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  Collection,
  createRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  DisplayItemModel,
  DragHandler,
  Droppable,
  tExpr,
  FieldModelRenderer,
  FlowErrorFallback,
  FlowModelContext,
  FlowModelProvider,
  FlowsFloatContextMenu,
  FormItem,
  ModelRenderMode,
  useFlowModel,
} from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';
import { TableColumnProps, Tooltip } from 'antd';
import { get, omit } from 'lodash';
import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getRowKey } from './utils';

function FieldDeletePlaceholder() {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const blockModel = model.context.blockModel;
  const dataSource = blockModel.collection.dataSource;
  const collection = blockModel.collection;
  const name = model.fieldPath;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);
  const content = t(`The {{type}} "{{name}}" may have been deleted. Please remove this {{blockType}}.`, {
    type: t('Field'),
    name: nameValue,
    blockType: t('Field'),
  }).replaceAll('&gt;', '>');
  return (
    <Tooltip title={content}>
      <ExclamationCircleOutlined style={{ opacity: '0.45' }} />
    </Tooltip>
  );
}

export class TableColumnModel extends DisplayItemModel {
  // 标记：该类的 render 返回函数， 避免错误的reactive封装
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  renderHiddenInConfig() {
    if (this.fieldDeleted) {
      return <FieldDeletePlaceholder />;
    }
    return (
      <Tooltip
        title={this.context.t(
          'This field has been hidden and you cannot view it (this content is only visible when the UI Editor is activated).',
        )}
      >
        <LockOutlined style={{ opacity: '0.45' }} />
      </Tooltip>
    );
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    await this.dispatchEvent('beforeRender');
  }

  static defineChildren(ctx: FlowModelContext) {
    const collection = (ctx.model as any).collection || (ctx.collection as Collection);
    return collection
      .getFields()
      .map((field: CollectionField) => {
        const binding = this.getDefaultBindingByField(ctx, field, { fallbackToTargetTitleField: true });
        if (!binding || field.options?.treeChildren) return null;
        const fieldModel = binding.modelName;
        const fieldPath = ctx.fieldPath ? `${ctx.fieldPath}.${field.name}` : field.name;
        return {
          key: fieldPath,
          label: field.title,
          refreshTargets: ['TableCustomColumnModel/TableJSFieldItemModel'],
          toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === fieldPath,
          useModel: this.name,
          createModelOptions: () => ({
            use: this.name,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: ctx.model.context.blockModel.collection.name,
                  fieldPath,
                },
              },
            },
            subModels: {
              field: {
                use: fieldModel,
                props:
                  typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps,
              },
            },
          }),
        };
      })
      .filter(Boolean);
  }

  getColumnProps(): TableColumnProps {
    if (!this.props.width) {
      return;
    }
    const titleContent = (
      <Droppable model={this}>
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 7px', margin: '-11px -7px' }}
          showBorder={false}
          settingsMenuLevel={2}
          extraToolbarItems={[
            {
              key: 'drag-handler',
              component: DragHandler,
              sort: 1,
            },
          ]}
        >
          <div
            className={css`
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: calc(${this.props.width}px - 16px);
            `}
          >
            {this.props.title}
          </div>
        </FlowsFloatContextMenu>
      </Droppable>
    );
    const cellRenderer = this.render();

    return {
      ...this.props,
      ellipsis: true,
      title: this.props.tooltip ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {titleContent}
          <Tooltip title={this.props.tooltip}>
            <QuestionCircleOutlined style={{ cursor: 'pointer' }} />
          </Tooltip>
        </span>
      ) : (
        titleContent
      ),
      onCell: (record, recordIndex) => ({
        record,
        recordIndex: record.__index || recordIndex,
        width: this.props.width - 16,
        editable: this.props.editable,
        dataIndex: this.props.dataIndex,
        title: this.props.title,
        overflowMode: this.props.overflowMode,
        model: this,
        // handleSave,
      }),
      render: (value, record, index) => {
        return (
          <FlowModelProvider model={this}>
            <ErrorBoundary FallbackComponent={FlowErrorFallback}>
              {(() => {
                const err = this['__autoFlowError'];
                if (err) throw err;
                return cellRenderer(value, record, record.__index || index);
              })()}
            </ErrorBoundary>
          </FlowModelProvider>
        );
      },
      hidden: this.hidden && !this.flowEngine.flowSettings?.enabled,
    };
  }
  onInit(options: any): void {
    super.onInit(options);
  }

  render(): any {
    return (value, record, index) => (
      <>
        {this.mapSubModels('field', (field) => {
          const rowKey = getRowKey(record, this.context.collection.filterTargetKey);
          const fork = field.createFork({}, `${record.__index || index}_${rowKey}`);
          const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
            () => fork.context.collection,
            fork.context.t('Current record'),
            (c) => {
              try {
                const coll = (c as any).collection;
                const rec = (c as any).record;
                const name = coll?.name;
                const dataSourceKey = coll?.dataSourceKey;
                const filterByTk = coll?.getFilterByTK?.(rec);
                if (!name || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
                return { collection: name, dataSourceKey, filterByTk };
              } catch (e) {
                void e;
                return undefined;
              }
            },
          );
          fork.context.defineProperty('record', {
            get: () => record,
            resolveOnServer: createRecordResolveOnServerWithLocal(
              () => fork.context.collection,
              () => record,
            ),
            meta: recordMeta,
            cache: false,
          });
          fork.context.defineProperty('recordIndex', {
            get: () => record.__index || index,
          });
          const namePath = this.context.prefixFieldPath ? this.fieldPath.split('.').pop() : this.fieldPath;
          const value = get(record, namePath);
          return (
            <FormItem key={field.uid} {...omit(this.props, 'title')} value={value} noStyle={true}>
              <FieldModelRenderer model={fork} />
            </FormItem>
          );
        })}
      </>
    );
  }
}

TableColumnModel.define({
  label: tExpr('Display collection fields'),
});

TableColumnModel.registerFlow({
  key: 'tableColumnSettings',
  sort: 500,
  title: tExpr('Table column settings'),
  steps: {
    init: {
      async handler(ctx, params) {
        const collectionField = ctx.model.context.collectionField;
        if (!collectionField) {
          return;
        }
        ctx.model.setProps('title', collectionField.title);
        ctx.model.setProps('dataIndex', collectionField.name);
        // for quick edit
        await ctx.model.applySubModelsBeforeRenderFlows('field');
        ctx.model.setProps({
          ...collectionField.getComponentProps(),
        });
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    title: {
      title: tExpr('Column title'),
      uiSchema: (ctx) => {
        return {
          title: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const model = ctx.model;
              const originTitle = model.collectionField?.title;
              field.decoratorProps = {
                ...field.decoratorProps,
                extra: model.context.t('Original field title: ') + (model.context.t(originTitle) ?? ''),
              };
            },
          },
        };
      },
      defaultParams: (ctx) => ({
        title: ctx.model.collectionField?.title,
      }),
      handler(ctx, params) {
        const title = ctx.t(params.title || ctx.model.collectionField?.title);
        ctx.model.setProps('title', title);
      },
    },
    tooltip: {
      title: tExpr('Tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('tooltip', params.tooltip);
      },
    },
    width: {
      title: tExpr('Column width'),
      uiSchema: {
        width: {
          'x-component': 'NumberPicker',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        width: 150,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
    quickEdit: {
      title: tExpr('Enable quick edit'),
      uiSchema: (ctx) => {
        if (!ctx.model.collectionField) {
          return;
        }
        const blockCollectionName = ctx.model.context.blockModel.collection.name;
        const fieldCollectionName = ctx.model.collectionField.collectionName;
        if (blockCollectionName !== fieldCollectionName) {
          return;
        }
        return {
          editable: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
            'x-disabled': ctx.model.collectionField.readonly || ctx.model.associationPathName,
          },
        };
      },
      defaultParams(ctx) {
        if (ctx.model.collectionField.readonly || ctx.model.associationPathName) {
          return {
            editable: false,
          };
        }
        return {
          editable: ctx.model.parent.props.editable || false,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('editable', params.editable);
      },
    },
    model: {
      title: tExpr('Field component'),
      use: 'displayFieldComponent',
    },
    sorter: {
      title: tExpr('Sortable'),
      uiSchema(ctx) {
        const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
          ctx.model.collectionField.interface,
        );
        if (!targetInterface.sortable) {
          return;
        }
        return {
          sorter: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
          },
        };
      },
      defaultParams: {
        sorter: false,
      },
      handler(ctx, params) {
        ctx.model.setProps({
          sorter: params.sorter,
        });
      },
    },
    fieldNames: {
      use: 'titleField',
      title: tExpr('Label field'),

      beforeParamsSave: async (ctx, params, previousParams) => {
        if (!ctx.collectionField || !ctx.collectionField.isAssociationField()) {
          return null;
        }
        if (params.label !== previousParams.label) {
          const targetCollection = ctx.collectionField.targetCollection;
          const targetCollectionField = targetCollection.getField(params.label);
          const binding = (ctx.model.constructor as typeof TableColumnModel).getDefaultBindingByField(
            ctx,
            targetCollectionField,
          );
          if (binding.modelName !== (ctx.model.subModels.field as any).use) {
            const fieldUid = ctx.model.subModels['field']['uid'];
            await ctx.engine.destroyModel(fieldUid);
            const model = ctx.model.setSubModel('field', {
              use: binding.modelName,
              stepParams: {
                fieldSettings: {
                  init: {
                    dataSourceKey: ctx.model.collectionField.dataSourceKey,
                    collectionName: targetCollection.name,
                    fieldPath: params.label,
                  },
                },
              },
            });
            await model.save();
          }
          ctx.model.setProps(ctx.collectionField.targetCollection.getField(params.label).getComponentProps());
        }
      },
      handler(ctx, params) {
        if (!ctx.collectionField || !ctx.collectionField.isAssociationField()) {
          return null;
        }
        ctx.model.setProps({
          titleField: params.label,
          ...ctx.collectionField.targetCollection?.getField(params.label)?.getComponentProps(),
        });
      },
    },
    fixed: {
      title: tExpr('Fixed'),
      use: 'fixed',
    },
  },
});
