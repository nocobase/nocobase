/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockOutlined, QuestionCircleOutlined, EditOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { capitalize, debounce } from 'lodash';
import {
  DisplayItemModel,
  DragHandler,
  Droppable,
  EditableItemModel,
  tExpr,
  FieldModelRenderer,
  FlowModelContext,
  FlowModelRenderer,
  FlowsFloatContextMenu,
  FormItem,
  ModelRenderMode,
  useFlowEngine,
  observer,
  FlowModelProvider,
  FlowErrorFallback,
} from '@nocobase/flow-engine';
import { TableColumnProps, Tooltip, Input, Space, Divider } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import React, { useRef, useMemo, useEffect } from 'react';
import { SubTableFieldModel } from '.';
import { FieldModel } from '../../../base/FieldModel';
import { FieldDeletePlaceholder, CustomWidth } from '../../../blocks/table/TableColumnModel';
import { buildDynamicNamePath } from '../../../blocks/form/dynamicNamePath';

const SubTableRowRuleBinder: React.FC<{ model: any }> = ({ model }) => {
  React.useEffect(() => {
    const emitter = model?.flowEngine?.emitter;
    if (!emitter) return;
    void emitter.emitAsync('model:mounted', { uid: model?.uid, model });
    return () => {
      void emitter.emitAsync('model:unmounted', { uid: model?.uid, model });
      model?.dispose?.();
    };
  }, [model]);
  return null;
};

export function FieldWithoutPermissionPlaceholder({ targetModel }) {
  const t = targetModel.context.t;
  const fieldModel = targetModel;
  const collection = fieldModel.context.collectionField.collection;
  const dataSource = collection.dataSource;
  const name = fieldModel.context.collectionField.name;
  const nameValue = useMemo(() => {
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, []);
  const { actionName } = fieldModel.forbidden || {};
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

const LargeFieldEdit = observer(({ model, params: { fieldPath, index }, defaultValue, disabled, ...others }: any) => {
  const flowEngine = useFlowEngine();
  const ref = useRef(null);
  const field = model.subModels.readPrettyField as FieldModel;
  const fieldModel = field?.createFork({}, `${index}`);
  fieldModel?.setProps({
    value: defaultValue,
  });

  const FieldModelRendererCom = (props) => {
    const { model, onChange, ...rest } = props;

    const handleChange = useMemo(
      () =>
        debounce((val) => {
          if (props.onChange) props.onChange(val);
          if (onChange) onChange(val);
        }, 200),
      [props.onChange, onChange],
    );

    return <FieldModelRenderer model={model} {...rest} onChange={handleChange} />;
  };
  const handleClick = async (e) => {
    if (disabled) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    try {
      await flowEngine.context.viewer.open({
        type: 'popover',
        target: e.target,
        placement: 'rightTop',
        styles: {
          body: {
            minWidth: 400,
          },
        },
        content: (popover) => {
          return <FieldModelRendererCom model={model} value={defaultValue} {...others} />;
        },
      });
    } catch (error) {
      console.log(error);
    }
  };
  const collectionField = model.context.collectionField;

  const content = useMemo(() => {
    if (['textarea', 'richText', 'json', 'markdown', 'vditor'].includes(collectionField.interface)) {
      const inputValue =
        collectionField.interface === 'json' && defaultValue
          ? JSON.stringify(defaultValue, null, 2)
          : defaultValue ?? '';

      return <Input value={inputValue} disabled={disabled} style={{ width: '100%' }} />;
    } else {
      return (
        <Space>
          <FlowModelRenderer model={fieldModel} uid={fieldModel?.uid} /> <EditOutlined className="edit-icon" />
        </Space>
      );
    }
  }, [collectionField.interface, defaultValue, fieldModel]);
  return (
    <div
      ref={ref}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        minHeight: 25,
        width: '100%',
        maxHeight: 300,
        overflowY: 'auto',
        cursor: 'pointer',
      }}
    >
      <span
        style={{ pointerEvents: 'none', display: 'block', width: '100%' }} // 不拦截点击
      >
        {content}
      </span>
    </div>
  );
});

const handleModelName = (modelName) => {
  if (['RadioGroupFieldModel', 'CheckboxGroupFieldModel'].includes(modelName)) {
    return 'SelectFieldModel';
  }
  return modelName;
};

const MemoFieldRenderer = React.memo(FieldModelRenderer, (prev, next) => {
  return prev.value === next.value && prev.model === next.model;
});

const FieldModelRendererOptimize = React.memo((props: any) => {
  const { model, onChange, value, ...rest } = props;
  const pendingValueRef = React.useRef<any>(props?.value);

  useEffect(() => {
    pendingValueRef.current = value;
  }, [value]);

  const handleChange = React.useCallback(
    (value: any) => {
      pendingValueRef.current = value;
    },
    [model],
  );

  const handleCommit = React.useCallback(() => {
    onChange?.(pendingValueRef.current);
  }, [onChange]);
  return (
    <div onBlur={handleCommit}>
      <MemoFieldRenderer
        {...rest}
        value={value}
        model={model}
        onChange={handleChange}
        onChangeComplete={() => {
          onChange?.(pendingValueRef.current);
        }}
      />
    </div>
  );
});

interface CellProps {
  value: any;
  record: any;
  rowIdx: number;
  id: string | number;
  parent: any;
  parentFieldIndex?: string[];
  parentItem?: any;
  rowFork?: any;
  memoKey?: string;
  width?: number;
}

const MemoCell: React.FC<CellProps> = React.memo(
  ({ value, record, rowIdx, id, parent, parentFieldIndex, rowFork, width }) => {
    const isNew = record?.__is_new__;
    return (
      <div
        style={{
          width,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={value}
        className={css`
          .ant-form-item-explain-error {
            white-space: break-spaces;
          }
          .edit-icon {
            position: absolute;
            display: none;
            color: #1890ff;
            margin-left: 8px;
            cursor: pointer;
            z-index: 100;
            top: 50%;
            right: 8px;
            transform: translateY(-50%);
          }
          &:hover {
            background: rgba(24, 144, 255, 0.1) !important;
          }
          &:hover .edit-icon {
            display: inline-flex;
          }
        `}
      >
        <SubTableRowRuleBinder model={rowFork} />
        {parent.mapSubModels('field', (action: FieldModel) => {
          const fieldPath = action.context.fieldPath.split('.');
          const namePath = fieldPath.pop();

          const fork: any = action.createFork({}, `${id}`);
          fork.context.defineProperty('currentObject', { get: () => record });
          if (rowFork) {
            fork.context.defineProperty('item', {
              get: () => rowFork.context.item,
              cache: false,
            });
            fork.context.defineProperty('fieldIndex', {
              get: () => rowFork.context.fieldIndex,
              cache: false,
            });
          } else {
            fork.context.defineProperty('item', {
              get: () => {
                const list = (parent as any)?.parent?.props?.value;
                const length = Array.isArray(list) ? list.length : undefined;
                return {
                  index: rowIdx,
                  length,
                  __is_new__: isNew,
                  __is_stored__: record?.__is_stored__,
                  value: record,
                };
              },
              cache: false,
            });
          }

          if (parent.props.readPretty) {
            fork.setProps({ value });
            return <React.Fragment key={id}>{fork.render()}</React.Fragment>;
          }

          if (parent.props.aclViewDisabled && !isNew) return null;

          return (
            <FormItem
              {...parent.props}
              key={id}
              name={buildDynamicNamePath([...fieldPath, rowIdx, namePath], parentFieldIndex)}
              style={{ marginBottom: 0 }}
              showLabel={false}
              disabled={
                parent.props.disabled ||
                (!isNew && parent.props.aclDisabled) ||
                (isNew && parent.props.aclCreateDisabled)
              }
            >
              {fork.constructor.isLargeField ? (
                <LargeFieldEdit
                  model={fork}
                  params={{
                    fieldPath: [(parent as any).context.fieldPath, rowIdx, namePath],
                    index: id,
                  }}
                  defaultValue={value}
                  disabled={
                    parent.props.disabled ||
                    (!isNew && parent.props.aclDisabled) ||
                    (isNew && parent.props.aclCreateDisabled)
                  }
                />
              ) : (
                <FieldModelRendererOptimize model={fork} id={[(parent as any).context.fieldPath, rowIdx]} />
              )}
            </FormItem>
          );
        })}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.value === next.value && prev.id === next.id && prev.memoKey === next.memoKey && prev.width === next.width
    );
  },
);

export interface SubTableColumnModelStructure {
  parent: SubTableFieldModel;
  subModels: {
    field: FieldModel;
  };
}

export class SubTableColumnModel<
  T extends SubTableColumnModelStructure = SubTableColumnModelStructure,
> extends EditableItemModel<T> {
  static renderMode = ModelRenderMode.RenderFunction;

  renderHiddenInConfig() {
    return <FieldWithoutPermissionPlaceholder targetModel={this} />;
  }

  static defineChildren(ctx: FlowModelContext) {
    const collection = (ctx.model as any).collection || ctx.collection;
    return collection
      .getFields()
      .map((field) => {
        if (!field.interface) {
          return null;
        }
        const binding = this.getDefaultBindingByField(ctx, field, { fallbackToTargetTitleField: true });
        if (!binding) return null;
        const fieldModel = handleModelName(binding.modelName);
        const fullName = ctx.fieldPath ? `${ctx.fieldPath}.${field.name}` : field.name;

        return {
          key: fullName,
          label: field.title,
          refreshTargets: ['SubTableColumnModel/TableJSFieldItemModel'],
          toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === fullName,
          useModel: this.name,
          createModelOptions: () => ({
            use: this.name,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: ctx.model.context.blockModel.collection.name,
                  fieldPath: fullName,
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
  // 让子表列使用父级关联模型的目标集合
  get collection() {
    return this.parent.collection;
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('resourceName', {
      get: () => {
        return this.context.collectionField.collection.name;
      },
      cache: false,
    });
    this.context.defineProperty('actionName', {
      get: () => 'view',
    });
    this.emitter.on('onSubModelAdded', (subModel: FieldModel) => {
      if (this.collectionField) {
        subModel.setProps(this.collectionField.getComponentProps());
      }
    });
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    await this.dispatchEvent('beforeRender');
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
          enabled={this.context.flowSettingsEnabled}
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
            {this.props.required && (
              <span style={{ color: '#ff4d4f', marginRight: 4, userSelect: 'none', fontFamily: 'SimSun, sans-serif' }}>
                *
              </span>
            )}
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
        key: recordIndex,
        width: this.props.width,
        editable: this.props.editable,
        dataIndex: this.props.dataIndex,
        title: this.props.title,
        model: this,
      }),
      // render: this.renderItem(),
      hidden: this.hidden && !this.context.flowSettingsEnabled,
      render: (value) => {
        const { record, rowIndex: index } = value || {};
        return (
          <FlowModelProvider model={this}>
            <ErrorBoundary FallbackComponent={FlowErrorFallback}>
              {(() => {
                const err = this['__autoFlowError'];
                if (err) throw err;
                if (this.hidden && this.context.flowSettingsEnabled) {
                  if (this.forbidden) {
                    return <FieldWithoutPermissionPlaceholder targetModel={this} />;
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
                  return <FieldDeletePlaceholder collection={this.parent.context.collectionField.targetCollection} />;
                }
                return cellRenderer(value, record, record?.__index || index);
              })()}
            </ErrorBoundary>
          </FlowModelProvider>
        );
      },
    };
  }
  renderItem(): any {
    return (props) => {
      const { value, id, rowIdx, record, parentFieldIndex, parentItem } = props || {};
      // 子表格列模型本身没有行级 fieldIndex，上下文中无法把 `roles.name` 解析成 `roles[0].name`，
      // 导致“默认值/赋值规则”在对多关系字段下无法生效。
      // 这里为每一行创建一个 column fork，并注入 fieldIndex，让规则引擎能够按行解析与写入。
      const baseFieldIndex = parentFieldIndex ?? (this.parent as any)?.context?.fieldIndex ?? this.context?.fieldIndex;
      const baseArr = Array.isArray(baseFieldIndex) ? baseFieldIndex : [];
      const baseIndexKey = baseArr.length ? baseArr.join('|') : 'root';
      const rowForkKey = `row:${baseIndexKey}:${String(rowIdx)}`;
      const rowFork: any = (() => {
        const fork = this.createFork({}, rowForkKey);
        const associationFieldPath =
          (this.parent as any)?.fieldPath ??
          (this.parent as any)?.context?.fieldPath ??
          (this.parent as any)?.props?.name;
        const associationKey =
          (this.parent as any)?.context?.collectionField?.name ||
          String(associationFieldPath || '')
            .split('.')
            .filter(Boolean)
            .pop();
        const rowIndex = Number(rowIdx);
        if (associationKey && Number.isFinite(rowIndex)) {
          fork.context.defineProperty('fieldIndex', {
            value: [...baseArr, `${associationKey}:${rowIndex}`],
          });
        }
        fork.context.defineProperty('item', {
          get: () => {
            const parentItemCtx = (parentItem ?? this.context?.item) as any;
            const isNew = record?.__is_new__;
            const isStored = record?.__is_stored__;
            const list = (this.parent as any)?.props?.value;
            const length = Array.isArray(list) ? list.length : undefined;
            return {
              index: Number.isFinite(rowIndex) ? rowIndex : undefined,
              length,
              __is_new__: isNew,
              __is_stored__: isStored,
              value: record,
              parentItem: parentItemCtx,
            };
          },
          cache: false,
        });
        return fork;
      })();
      return (
        <MemoCell
          value={value}
          record={record}
          rowIdx={rowIdx}
          id={id}
          parent={this}
          parentFieldIndex={baseArr}
          parentItem={parentItem}
          rowFork={rowFork}
          memoKey={rowForkKey}
          width={this.props.width}
        />
      );
    };
  }
}

SubTableColumnModel.define({
  label: tExpr('Table column'),
  icon: 'TableColumn',
  createModelOptions: {
    use: 'SubTableColumnModel',
  },
  sort: 0,
});

SubTableColumnModel.registerFlow({
  key: 'subTableColumnSettings',
  sort: 500,
  title: tExpr('Table column settings'),
  steps: {
    init: {
      async handler(ctx, params) {
        const collectionField = ctx.model.context.collectionField;
        if (!collectionField) {
          return;
        }
        ctx.model.setProps(collectionField.getComponentProps());
        ctx.model.setProps('title', collectionField.title);
        ctx.model.setProps('dataIndex', collectionField.name);
        const currentBlockModel = ctx.model.context.blockModel;
        // 避免强依赖 EditFormModel（减少循环依赖风险）：仅在存在该能力时调用
        currentBlockModel?.addAppends?.(ctx.model.fieldPath);
      },
    },
    title: {
      title: tExpr('Column title'),
      uiSchema: (ctx) => {
        return {
          title: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-component-props': {
              placeholder: tExpr('Column title'),
            },
            'x-reactions': (field) => {
              const { model } = ctx;
              const originTitle = model.collectionField?.title;
              field.decoratorProps = {
                ...field.decoratorProps,
                extra: model.context.t('Original field title: ') + originTitle,
              };
            },
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
      handler(ctx, params) {
        const options = { ns: 'lm-flow-engine', compareWith: ctx.model.collectionField?.title };
        ctx.model.setProps({ title: ctx.t(params.title, options) || ctx.fieldPath.split('.').pop() });
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
        width: 200,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
    aclCheck: {
      use: 'aclCheck',
      async handler(ctx, params) {
        if (!ctx.collectionField) {
          return;
        }
        const blockActionName = ctx.blockModel.context.actionName;

        const updateResult = await ctx.aclCheck({
          dataSourceKey: ctx.dataSource?.key,
          resourceName: ctx.collectionField?.collectionName,
          fields: [ctx.collectionField.name],
          actionName: 'update',
        });
        const createResult = await ctx.aclCheck({
          dataSourceKey: ctx.dataSource?.key,
          resourceName: ctx.collectionField?.collectionName,
          fields: [ctx.collectionField.name],
          actionName: 'create',
        });
        if (blockActionName === 'update') {
          const resultView = await ctx.aclCheck({
            dataSourceKey: ctx.dataSource?.key,
            resourceName: ctx.collectionField?.collectionName,
            fields: [ctx.collectionField.name],
            actionName: 'view',
          });
          if (!resultView) {
            ctx.model.setProps({
              aclViewDisabled: true,
            });
          }
        }
        if (!updateResult) {
          ctx.model.setProps({
            aclDisabled: true,
          });
        }
        if (!createResult) {
          ctx.model.setProps({
            aclCreateDisabled: true,
          });
        }
      },
    },
    subModel: {
      title: tExpr('Preview field component'),
      uiSchema: (ctx) => {
        if (!(ctx.model.subModels.field.constructor as any).isLargeField) {
          return null;
        }
        const classes = DisplayItemModel.getBindingsByField(ctx, ctx.model.collectionField);
        if (classes.length === 1) {
          return null;
        }
        return {
          use: {
            type: 'string',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: classes.map((model) => {
              const m = ctx.engine.getModelClass(model.modelName);
              return {
                label: m.meta?.label || model.modelName,
                value: model.modelName,
                defaultProps: model.defaultProps,
              };
            }),
          },
        };
      },
      defaultParams: (ctx) => {
        const model = DisplayItemModel.getDefaultBindingByField(ctx, ctx.model.collectionField);
        return {
          use: model?.modelName,
        };
      },
      async handler(ctx, params) {
        if (!(ctx.model.subModels.field.constructor as any).isLargeField) {
          return null;
        }
        const field = ctx.model.collectionField;
        const use = params.use;
        const model = (ctx.model.subModels.field as FieldModel).setSubModel('readPrettyField', {
          use,
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: ctx.model.collectionField.dataSourceKey,
                collectionName: field.collection.name,
                fieldPath: ctx.model.fieldPath,
              },
            },
          },
        });
        await model.dispatchEvent('beforeRender');
      },
    },
    initialValue: {
      title: tExpr('Default value'),
      // 子表格子表单内不提供“默认值”配置：返回空对象，避免渲染任何字段
      uiSchema: {},
      // 不提供默认参数
      defaultParams: () => ({}),
      // 禁止写入初始值
      handler() {},
    },
    required: {
      title: tExpr('Required'),
      use: 'required',
    },
    validation: {
      title: tExpr('Validation'),
      use: 'validation',
    },
    model: {
      use: 'fieldComponent',
      title: tExpr('Field component'),
    },
    pattern: {
      use: 'pattern',
    },
    fixed: {
      title: tExpr('Fixed'),
      use: 'fixed',
    },
  },
});

SubTableColumnModel.define({
  hide: true,
  label: tExpr('Table column'),
});
