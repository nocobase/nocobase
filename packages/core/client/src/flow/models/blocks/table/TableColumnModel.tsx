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
import { TableColumnProps, Tooltip, Space, InputNumber, Button, Divider } from 'antd';
import { get, omit, capitalize } from 'lodash';
import React, { useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { getRowKey } from './utils';
import { getFieldBindingUse, rebuildFieldSubModel } from '../../../internal/utils/rebuildFieldSubModel';

export function FieldDeletePlaceholder(props: any) {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const blockModel = model.context.blockModel;
  const collection = props?.collection || blockModel.collection;
  const dataSource = collection.dataSource;
  const name = model.props.title || model.fieldPath;
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
      <ExclamationCircleOutlined style={{ opacity: '0.3' }} />
    </Tooltip>
  );
}

function FieldWithoutPermissionPlaceholder() {
  const { t } = useTranslation();
  const model: any = useFlowModel();
  const blockModel = model.context.blockModel;
  const collection = model.context.collectionField?.collection || blockModel.collection;
  const dataSource = collection.dataSource;
  const name = model.context.collectionField?.name || model.fieldPath;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);
  const { actionName } = model.forbidden;
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for field "{{name}}"`,
      {
        name: nameValue,
        actionName: t(capitalize(actionName)),
      },
    ).replaceAll('&gt;', '>');
  }, [nameValue, t]);
  return (
    <Tooltip title={messageValue}>
      <LockOutlined style={{ opacity: '0.3' }} />
    </Tooltip>
  );
}

export const CustomWidth = ({ setOpen, t, handleChange, defaultValue }) => {
  const [customWidth, setCustomWidth] = useState(defaultValue);
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(true);
      }}
    >
      <Space.Compact block>
        <InputNumber
          placeholder={t('Custom column width')}
          value={customWidth}
          onChange={(val) => {
            setCustomWidth(val);
          }}
          style={{ width: '100%', minWidth: 200 }}
        />
        <Button type="primary" onClick={() => handleChange(customWidth)}>
          OK
        </Button>
      </Space.Compact>
    </div>
  );
};
export class TableColumnModel extends DisplayItemModel {
  // 标记：该类的 render 返回函数， 避免错误的reactive封装
  static renderMode: ModelRenderMode = ModelRenderMode.RenderFunction;

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    await this.dispatchEvent('beforeRender');
  }
  renderHiddenInConfig(): React.ReactNode | undefined {
    return this.renderOriginal.call(this);
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
          toggleable: (subModel) => {
            return (
              subModel.getStepParams('fieldSettings', 'init')?.fieldPath === fieldPath &&
              subModel.use === 'TableColumnModel'
            );
          },
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
              opacity: ${this.hidden ? '0.3' : '1'};
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
        recordIndex: record?.__index || recordIndex,
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
                if (this.hidden && this.context.flowSettingsEnabled) {
                  if (this.forbidden) {
                    return <FieldWithoutPermissionPlaceholder />;
                  }
                  return (
                    <Tooltip
                      title={this.context.t('The field is hidden and only visible when the UI Editor is active')}
                    >
                      <div style={{ opacity: '0.3' }}> {cellRenderer(value, record, record?.__index || index)}</div>
                    </Tooltip>
                  );
                }
                if (!this.collectionField) {
                  return <FieldDeletePlaceholder />;
                }
                return cellRenderer(value, record, record?.__index || index);
              })()}
            </ErrorBoundary>
          </FlowModelProvider>
        );
      },
      hidden: this.hidden && !this.context.flowSettingsEnabled,
    };
  }
  onInit(options: any): void {
    super.onInit(options);
  }

  renderItem(): any {
    return (value, record, index) => (
      <>
        {this.mapSubModels('field', (field) => {
          const rowKey = getRowKey(record, this.context.collection.filterTargetKey);
          const fork = field.createFork({}, `${record?.__index || index}_${rowKey}`);
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
            get: () => record?.__index || index,
          });
          const namePath = this.context.prefixFieldPath
            ? this.fieldPath.replace(`${this.context.prefixFieldPath}.`, '')
            : this.fieldPath;
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
  label: tExpr('Display fields'),
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
                extra: model.context.t('Original field title: ') + originTitle,
              };
            },
          },
        };
      },
      defaultParams: (ctx) => ({
        title: ctx.model.collectionField?.title,
      }),
      handler(ctx, params) {
        const options = { ns: 'lm-flow-engine', compareWith: ctx.model.collectionField?.title };
        ctx.model.setProps({ title: ctx.t(params.title, options) || ctx.fieldPath });
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
        ctx.model.setProps('tooltip', ctx.t(params.tooltip, { ns: 'lm-flow-engine' }));
      },
    },
    width: {
      title: tExpr('Column width'),
      uiMode(ctx) {
        const columnWidth = ctx.model.props.width;
        return {
          type: 'select',
          key: 'width',
          props: {
            options: [
              { label: 50, value: 50 },
              { label: 100, value: 100 },
              { label: 150, value: 150 },
              { label: 200, value: 200 },
              { label: 250, value: 250 },
              { label: 300, value: 300 },
              { label: 350, value: 350 },
              { label: 400, value: 400 },
              { label: 450, value: 450 },
              { label: 500, value: 500 },
            ],
            dropdownRender: (menu, setOpen, handleChange) => {
              return (
                <>
                  {menu}
                  <Divider style={{ margin: '4px 0' }} />
                  <CustomWidth
                    setOpen={setOpen}
                    handleChange={handleChange}
                    t={ctx.t}
                    defaultValue={
                      [50, 100, 150, 200, 250, 300, 350, 400, 450, 500].includes(columnWidth) ? null : columnWidth
                    }
                  />
                </>
              );
            },
          },
        };
      },
      defaultParams: {
        width: 150,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    quickEdit: {
      title: tExpr('Enable quick edit'),
      uiMode: { type: 'switch', key: 'editable' },
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
      uiMode: { type: 'switch', key: 'sorter' },
      hideInSettings: async (ctx) => {
        const targetInterface = ctx.model.collectionField.getInterfaceOptions();
        return !targetInterface.sortable || ctx.associationModel;
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
    fixed: {
      title: tExpr('Fixed'),
      use: 'fixed',
    },
    fieldNames: {
      use: 'titleField',
      title: tExpr('Title field'),

      beforeParamsSave: async (ctx, params, previousParams) => {
        if (!ctx.collectionField || !ctx.collectionField.isAssociationField()) {
          return null;
        }
        if (params.label === previousParams.label) {
          return null;
        }
        const targetCollection = ctx.collectionField.targetCollection;
        const targetCollectionField = targetCollection.getField(params.label);
        if (!targetCollectionField) {
          return null;
        }
        const binding = (ctx.model.constructor as typeof TableColumnModel).getDefaultBindingByField(
          ctx,
          targetCollectionField,
        );
        const fieldModel: any = ctx.model.subModels.field;
        const currentUse = getFieldBindingUse(fieldModel) || fieldModel?.use;
        const targetUse = binding?.modelName || currentUse;
        const fieldSettingsInit = {
          dataSourceKey: ctx.model.collectionField.dataSourceKey,
          collectionName: targetCollection.name,
          fieldPath: params.label,
        };
        const defaultProps =
          typeof binding?.defaultProps === 'function'
            ? binding.defaultProps(ctx, targetCollectionField)
            : binding?.defaultProps;
        if (targetUse && targetUse !== currentUse) {
          await rebuildFieldSubModel({
            parentModel: ctx.model as any,
            targetUse,
            defaultProps,
            fieldSettingsInit,
          });
        } else if (fieldModel) {
          fieldModel.setStepParams('fieldSettings', 'init', fieldSettingsInit);
          await fieldModel.dispatchEvent('beforeRender', undefined, { useCache: false });
        }
        ctx.model.setProps(targetCollectionField.getComponentProps());
      },
      defaultParams: (ctx: any) => {
        const titleField = ctx.model.context.collectionField.targetCollectionTitleFieldName;
        return {
          label: ctx.model.props.titleField || titleField,
        };
      },
      handler(ctx, params) {
        if (!ctx.collectionField || !ctx.collectionField.isAssociationField()) {
          return null;
        }
        ctx.model.setProps({
          titleField: params.label,
        });
      },
    },
  },
});
