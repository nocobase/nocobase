/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import {
  Collection,
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
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import { createRecordMetaFactory } from '@nocobase/flow-engine';
import { TableColumnProps, Tooltip } from 'antd';
import { get } from 'lodash';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { CollectionFieldModel } from '../../base/CollectionFieldModel';
import { ReadPrettyFieldModel } from '../../fields/ReadPrettyField/ReadPrettyFieldModel';

export class TableColumnModel extends CollectionFieldModel {
  // 标记：该类的 render 返回函数， 避免错误的reactive封装
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  // 设置态隐藏时：返回单元格渲染函数，显示“ No permission ”并降低不透明度
  renderHiddenInConfig(): React.ReactNode | undefined {
    return <span style={{ opacity: 0.5 }}>{this.context.t('Permission denied')}</span>;
  }

  async afterAddAsSubModel() {
    await this.applyAutoFlows();
  }

  static defineChildren(ctx: FlowModelContext) {
    const collection = (ctx.model as any).collection || (ctx.collection as Collection);
    return collection.getFields().map((field) => {
      const fieldModel = field.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
      const fieldPath = field.name;
      return {
        key: field.name,
        label: field.title,
        toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === field.name,
        useModel: 'TableColumnModel',
        createModelOptions: () => ({
          use: 'TableColumnModel',
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
            },
          },
        }),
      };
    });
  }

  getColumnProps(): TableColumnProps {
    const titleContent = (
      <Droppable model={this}>
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 7px', margin: '-11px -7px' }}
          showBorder={false}
          settingsMenuLevel={3}
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
        {this.mapSubModels('field', (field: ReadPrettyFieldModel) => {
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
            meta: { type: 'number', title: fork.context.t('Current row') },
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
  label: escapeT('Table column'),
  icon: 'TableColumn',
  createModelOptions: {
    use: 'TableColumnModel',
  },
  sort: 0,
});

TableColumnModel.registerFlow({
  key: 'tableColumnSettings',
  sort: 500,
  title: escapeT('Table column settings'),
  steps: {
    init: {
      async handler(ctx, params) {
        const collectionField = ctx.model.collectionField;
        if (!collectionField) {
          return;
        }
        ctx.model.setProps('title', collectionField.title);
        ctx.model.setProps('dataIndex', collectionField.name);
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
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: escapeT('Column title'),
          },
        },
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
      use: 'fieldComponent',
    },
  },
});
