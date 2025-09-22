/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import type { CollectionField, PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  Collection,
  createRecordMetaFactory,
  DisplayItemModel,
  DragHandler,
  Droppable,
  escapeT,
  FieldModelRenderer,
  FlowErrorFallback,
  FlowModel,
  FlowModelContext,
  FlowModelProvider,
  FlowsFloatContextMenu,
  FormItem,
  ModelRenderMode,
} from '@nocobase/flow-engine';
import { TableColumnProps, Tooltip } from 'antd';
import { get } from 'lodash';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

export class TableColumnModel extends DisplayItemModel {
  // 标记：该类的 render 返回函数， 避免错误的reactive封装
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  renderHiddenInConfig() {
    return (
      <Tooltip title={this.context.t('该字段已被隐藏，你无法查看（该内容仅在激活 UI Editor 时显示）。')}>
        <LockOutlined style={{ opacity: '0.45' }} />
      </Tooltip>
    );
  }

  async afterAddAsSubModel() {
    await this.applyAutoFlows();
  }

  static defineChildren(ctx: FlowModelContext) {
    const collection = (ctx.model as any).collection || (ctx.collection as Collection);
    return collection
      .getFields()
      .map((field: CollectionField) => {
        const binding = this.getDefaultBindingByField(ctx, field, { fallbackToTargetTitleField: true });
        if (!binding) return null;
        const fieldModel = binding.modelName;
        const fieldPath = field.name;
        return {
          key: field.name,
          label: field.title,
          refreshTargets: ['TableCustomColumnModel/TableJSFieldItemModel'],
          toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === field.name,
          useModel: this.name,
          createModelOptions: () => ({
            use: this.name,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: collection.name,
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
        recordIndex,
        width: this.props.width,
        editable: this.props.editable,
        dataIndex: this.props.dataIndex,
        title: this.props.title,
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
                return cellRenderer(value, record, index);
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
          const fork = field.createFork({}, `${index}`);
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
            resolveOnServer: true,
            meta: recordMeta,
          });
          fork.context.defineProperty('recordIndex', {
            get: () => index,
          });
          const value = get(record, this.fieldPath);
          return (
            <FormItem key={field.uid} {...this.props} value={value} noStyle={true}>
              <FieldModelRenderer model={fork} />
            </FormItem>
          );
        })}
      </>
    );
  }
}

TableColumnModel.define({
  label: escapeT('Display collection fields'),
});

TableColumnModel.registerFlow({
  key: 'tableColumnSettings',
  sort: 500,
  title: escapeT('Table column settings'),
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
        await ctx.model.applySubModelsAutoFlows('field');
        ctx.model.setProps({
          ...collectionField.getComponentProps(),
        });
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    title: {
      title: escapeT('Column title'),
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
      title: escapeT('Tooltip'),
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
      title: escapeT('Column width'),
      uiSchema: {
        width: {
          'x-component': 'NumberPicker',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        width: 100,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
    quickEdit: {
      title: escapeT('Enable quick edit'),
      uiSchema: (ctx) => {
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
      title: escapeT('Field component'),
      use: 'displayFieldComponent',
    },
    fieldNames: {
      use: 'titleField',
      title: escapeT('Label field'),

      beforeParamsSave: async (ctx, params, previousParams) => {
        if (!ctx.collectionField.isAssociationField()) {
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
        ctx.model.setProps({ titleField: params.label });
      },
    },
  },
});
