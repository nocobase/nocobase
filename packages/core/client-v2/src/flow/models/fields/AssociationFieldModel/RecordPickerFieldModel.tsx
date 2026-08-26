/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionField,
  EditableItemModel,
  tExpr,
  FlowModel,
  FlowModelRenderer,
  observable,
  useFlowContext,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Select, Tooltip, Tag } from 'antd';
import React, { useEffect } from 'react';
import { SkeletonFallback } from '../../../components/SkeletonFallback';
import { FieldModel } from '../../base/FieldModel';
import {
  buildCurrentItemTitle,
  createAssociationItemChainContextPropertyOptions,
  createItemChainGetter,
  createItemChainMetaAndResolver,
  createParentItemAccessorsFromInputArgs,
  createRootItemChain,
  type ItemChain,
} from './itemChain';
import { buildOpenerUids, LabelByField, type AssociationFieldNames } from './recordSelectShared';

const MULTIPLE_ASSOCIATION_TYPES = ['belongsToMany', 'hasMany', 'belongsToArray'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function canRecordPickerSelectMultiple(
  collectionField: { type?: string } | null | undefined,
  allowMultiple?: boolean,
) {
  return (
    !!collectionField?.type && MULTIPLE_ASSOCIATION_TYPES.includes(collectionField.type) && allowMultiple !== false
  );
}

export function shouldClearRecordPickerValueOnMultipleChange(
  collectionField: { type?: string } | null | undefined,
  previousAllowMultiple?: boolean,
  nextAllowMultiple?: boolean,
) {
  return (
    canRecordPickerSelectMultiple(collectionField, previousAllowMultiple) !==
    canRecordPickerSelectMultiple(collectionField, nextAllowMultiple)
  );
}

export function normalizeRecordPickerSelectedRows(value: unknown, allowMultiple: boolean) {
  if (!value) {
    return [];
  }
  if (allowMultiple) {
    return Array.isArray(value) ? value : [value];
  }
  return Array.isArray(value) ? value.slice(0, 1) : [value];
}

export function getRecordPickerEmptyValue(allowMultiple: boolean) {
  return allowMultiple ? [] : undefined;
}

export function getRecordPickerClearedValue() {
  return undefined;
}

export function normalizeRecordPickerValue(value: unknown, fieldNames: AssociationFieldNames, allowMultiple: boolean) {
  if (!value) {
    return getRecordPickerEmptyValue(allowMultiple);
  }
  const toSelectItem = (item: Record<string, unknown>) => ({
    ...item,
    label: item[fieldNames.label],
    value: item[fieldNames.value],
  });
  if (!allowMultiple) {
    const item = Array.isArray(value) ? value[0] : value;
    return isRecord(item) ? toSelectItem(item) : undefined;
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isRecord).map(toSelectItem);
}

function applyRecordPickerAllowMultiple(ctx: any, params: any, previousParams?: any) {
  const shouldClearValue =
    previousParams &&
    shouldClearRecordPickerValueOnMultipleChange(
      ctx.collectionField,
      previousParams?.allowMultiple,
      params?.allowMultiple,
    );
  const emptyValue = getRecordPickerClearedValue();

  ctx.model.setProps({
    allowMultiple: params?.allowMultiple,
    ...(shouldClearValue ? { value: emptyValue } : {}),
  });
  if (shouldClearValue) {
    ctx.model.selectedRows.value = emptyValue;
    ctx.model.props.onChange?.(emptyValue);
  }
}

export function buildRecordPickerParentItemContext(ctx: any): {
  parentItem: ItemChain;
  parentItemMeta: any;
  parentItemResolver: ((subPath: string) => boolean) | undefined;
} {
  const formValues =
    (typeof ctx?.getFormValues === 'function' ? ctx.getFormValues() : undefined) ??
    ctx?.formValues ??
    ctx?.record ??
    {};
  const parentItem = (ctx?.item as ItemChain | undefined) ?? createRootItemChain(formValues);
  const t = typeof ctx?.t === 'function' ? ctx.t : (value: string) => value;
  const collectionAccessor = () => ctx?.collectionField?.collection ?? ctx?.collection ?? null;
  const propertiesAccessor = () => parentItem?.value;
  const parentPropertiesAccessor = () => parentItem?.parentItem?.value;

  const fallback = createItemChainMetaAndResolver({
    metaFactoryOptions: {
      t,
      title: t('Current item'),
      collectionAccessor,
      propertiesAccessor,
      parentCollectionAccessor: collectionAccessor,
      parentPropertiesAccessor,
      showParentIndex: false,
    },
    resolverOptions: {
      collectionAccessor,
      propertiesAccessor,
      parentCollectionAccessor: collectionAccessor,
      parentPropertiesAccessor,
    },
  });
  const { meta: parentItemMeta = fallback.meta, resolveOnServer: parentItemResolver = fallback.resolveOnServer } =
    ctx?.getPropertyOptions?.('item') || {};

  return {
    parentItem,
    parentItemMeta,
    parentItemResolver,
  };
}

export function injectRecordPickerPopupContext(model: FlowModel, viewCtx: any, fieldModel?: any) {
  if (model && fieldModel) {
    model.context.defineProperty('flowSettingsEnabled', {
      get: () => fieldModel.context.flowSettingsEnabled,
      cache: false,
    });
  }

  const inputArgs = viewCtx?.view?.inputArgs || {};
  const collectionField = inputArgs.collectionField;
  const t = typeof viewCtx?.t === 'function' ? viewCtx.t : (value: string) => value;
  const currentCollection = collectionField?.targetCollection ?? collectionField?.collection ?? null;
  const parentAccessors = createParentItemAccessorsFromInputArgs(() => inputArgs);
  const currentItemValueAccessor = () => inputArgs.currentItemValue ?? {};
  const itemPropertyOptions = createAssociationItemChainContextPropertyOptions({
    t,
    title: buildCurrentItemTitle(t, collectionField),
    disableValueBranch: true,
    valueBranchDisabledReason: t('Attributes are unavailable before selecting a record'),
    collectionAccessor: () => currentCollection,
    propertiesAccessor: currentItemValueAccessor,
    resolverPropertiesAccessor: currentItemValueAccessor,
    parentCollectionAccessor: () => collectionField?.collection ?? null,
    parentAccessors,
    useParentItemMeta: false,
  });
  const getPopupItem = createItemChainGetter({
    valueAccessor: currentItemValueAccessor,
    parentItemAccessor: () => inputArgs.parentItem,
    isNewAccessor: () => true,
    isStoredAccessor: () => false,
  });

  model.context.defineProperty('item', {
    get: getPopupItem,
    ...itemPropertyOptions,
  });
}

export function buildRecordPickerPopupContextInputArgs(
  ctx: any,
  options: {
    currentItemValue?: any;
    extraInputArgs?: Record<string, any>;
  } = {},
) {
  const { parentItem, parentItemMeta, parentItemResolver } = buildRecordPickerParentItemContext(ctx);
  const openerUids = buildOpenerUids(ctx, ctx.inputArgs);

  return {
    ...(options.extraInputArgs || {}),
    parentItem,
    parentItemMeta,
    parentItemResolver,
    currentItemValue: options.currentItemValue,
    openerUids,
  };
}

function RemoteModelRenderer({ options, fieldModel }) {
  const ctx = useFlowViewContext();
  const { data, loading } = useRequest(
    async () => {
      const model: FlowModel = await ctx.engine.loadOrCreateModel(options, {
        delegateToParent: false,
        delegate: ctx,
        skipSave: !ctx.flowSettingsEnabled,
      });
      injectRecordPickerPopupContext(model, ctx, fieldModel);
      return model;
    },
    {
      refreshDeps: [ctx, options],
    },
  );
  useEffect(() => {
    if (!data) {
      return;
    }
    if (fieldModel) {
      fieldModel.selectBlockModel = data;
    }
    return () => {
      if (data?.uid) {
        ctx?.engine?.removeModelWithSubModels?.(data.uid);
      }
      if (fieldModel?.selectBlockModel === data) {
        fieldModel.selectBlockModel = undefined;
      }
    };
  }, [ctx?.engine, data, fieldModel]);
  if (loading || !data?.uid) {
    return <SkeletonFallback style={{ margin: 16 }} />;
  }
  return <FlowModelRenderer model={data} fallback={<SkeletonFallback style={{ margin: 16 }} />} />;
}

export function RecordPickerContent({ model, toOne = false }) {
  const ctx = useFlowContext();
  const { Header, Footer, type } = ctx.view;
  model._closeView = ctx.view.close;
  return (
    <div>
      <Header
        title={
          type === 'dialog' ? (
            <div
              style={{
                padding: `${ctx.themeToken.paddingLG}px ${ctx.themeToken.paddingLG}px 0`,
                marginBottom: -ctx.themeToken.marginSM,
                backgroundColor: 'var(--colorBgLayout)',
              }}
            >
              {ctx.t('Select record')}
            </div>
          ) : (
            ctx.t('Select record')
          )
        }
      />
      <RemoteModelRenderer
        options={{
          parentId: ctx.view.inputArgs.parentId,
          subKey: 'grid-block',
          async: true,
          delegateToParent: false,
          subType: 'object',
          use: 'BlockGridModel',
        }}
        fieldModel={model}
      />
      {!toOne && (
        <Footer>
          {type === 'dialog' ? (
            <div style={{ padding: `0 ${ctx.themeToken.paddingLG}px ${ctx.themeToken.paddingLG}px` }}>
              <Button
                type="primary"
                onClick={() => {
                  model.change();
                  ctx.view.close();
                }}
              >
                {ctx.t('Submit')}
              </Button>
            </div>
          ) : (
            <Button
              type="primary"
              onClick={() => {
                model.change();
                ctx.view.close();
              }}
            >
              {ctx.t('Submit')}
            </Button>
          )}
        </Footer>
      )}
    </div>
  );
}

function RecordPickerField(props) {
  const { fieldNames, onClick, disabled } = props;
  const ctx = useFlowContext();
  const allowMultiple = canRecordPickerSelectMultiple(ctx.collectionField, props.allowMultiple);
  useEffect(() => {
    ctx.model.selectedRows.value = props.value;
  }, [ctx.model.selectedRows, props.value]);

  return (
    <Select
      {...props}
      open={false}
      onClick={(e) => {
        if (!disabled) {
          onClick(e);
        }
      }}
      value={normalizeRecordPickerValue(props.value, fieldNames, allowMultiple)}
      labelRender={(item) => {
        return <LabelByField option={item} fieldNames={fieldNames} />;
      }}
      labelInValue
      mode={allowMultiple ? 'multiple' : undefined}
      options={props.value}
      allowClear
      onChange={(newValue, option) => {
        ctx.model.selectedRows.value = option;
        ctx.model.change();
      }}
      showSearch={false}
      maxTagCount="responsive"
      maxTagPlaceholder={(omittedValues) => (
        <Tooltip
          title={
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                maxWidth: '100%',
              }}
            >
              {omittedValues.map((item) => (
                <Tag
                  key={item.value}
                  style={{
                    margin: 0,
                    background: '#fafafa',
                    border: '1px solid #d9d9d9',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                  }}
                >
                  {item.label}
                </Tag>
              ))}
            </div>
          }
          overlayInnerStyle={{
            background: '#fff',
            color: '#000',
            padding: 8,
            maxWidth: '100%',
          }}
          color="#fff"
          overlayStyle={{
            pointerEvents: 'auto',
            maxWidth: 300,
          }}
        >
          +{omittedValues.length}...
        </Tooltip>
      )}
    />
  );
}

export class RecordPickerFieldModel extends FieldModel {
  selectedRows = observable.ref([]);
  _closeView;
  selectBlockModel;
  get collectionField(): CollectionField {
    return this.context.collectionField;
  }

  render() {
    return <RecordPickerField {...this.props} />;
  }
  onInit(option) {
    super.onInit(option);
    // For association fields, expose target collection to variable selectors
    this.context.defineProperty('collection', {
      get: () => this.context.collectionField?.targetCollection,
    });
  }
  protected onMount(): void {
    this.onClick = (e) => {
      this.dispatchEvent('openView', {
        event: e,
        onChange: this.props.onChange,
      });
    };
  }
  set onClick(fn) {
    this.setProps({ onClick: fn });
  }

  change() {
    this.props.onChange(this.selectedRows.value);
  }
}

RecordPickerFieldModel.registerFlow({
  key: 'popupSettings',
  title: tExpr('Selector setting'),
  on: {
    eventName: 'openView',
  },
  sort: 300,
  steps: {
    openView: {
      title: tExpr('Edit popup'),
      uiSchema: {
        mode: {
          type: 'string',
          title: tExpr('Open mode'),
          enum: [
            { label: tExpr('Drawer'), value: 'drawer' },
            { label: tExpr('Dialog'), value: 'dialog' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
        size: {
          type: 'string',
          title: tExpr('Popup size'),
          enum: [
            { label: tExpr('Small'), value: 'small' },
            { label: tExpr('Medium'), value: 'medium' },
            { label: tExpr('Large'), value: 'large' },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
        },
      },
      defaultParams: {
        mode: 'drawer',
        size: 'medium',
      },
      handler(ctx, params) {
        const { onChange } = ctx.inputArgs;
        const allowMultiple = canRecordPickerSelectMultiple(ctx.collectionField, ctx.model.props.allowMultiple);
        const sizeToWidthMap: Record<string, any> = {
          drawer: {
            small: '30%',
            medium: '50%',
            large: '70%',
          },
          dialog: {
            small: '40%',
            medium: '50%',
            large: '80%',
          },
          embed: {},
        };
        const openMode = ctx.inputArgs.mode || params.mode || 'drawer';
        const size = ctx.inputArgs.size || params.size || 'medium';
        const sourceCollection = ctx.collectionField?.collection;
        const sourceRecord = ctx.item?.value ?? ctx.record;
        const sourceId = sourceRecord ? sourceCollection?.getFilterByTK?.(sourceRecord) : undefined;
        const associationName = ctx.collectionField?.resourceName;
        ctx.viewer.open({
          type: openMode,
          width: sizeToWidthMap[openMode][size],
          inheritContext: false,
          target: ctx.layoutContentElement,
          inputArgs: {
            parentId: ctx.model.uid,
            scene: 'select',
            dataSourceKey: ctx.collection.dataSourceKey,
            collectionName: ctx.collectionField?.target,
            ...(associationName && sourceId != null ? { associationName, sourceId } : {}),
            collectionField: ctx.collectionField,
            ...buildRecordPickerPopupContextInputArgs(ctx, {
              currentItemValue: ctx.inputArgs.currentItemValue ?? {},
            }),
            rowSelectionProps: {
              type: allowMultiple ? 'checkbox' : 'radio',
              defaultSelectedRows: () => {
                return normalizeRecordPickerSelectedRows(ctx.model.props.value, allowMultiple);
              },
              renderCell: undefined,
              selectedRowKeys: undefined,
              onChange: (_, selectedRows) => {
                const selectBlockModel = ctx.model.selectBlockModel;
                const selectTable = selectBlockModel.findSubModel('items', (m) => {
                  return m;
                });
                if (!allowMultiple) {
                  ctx.model.selectedRows.value = selectedRows?.[0];
                  onChange(ctx.model.selectedRows.value);
                  ctx.model._closeView?.();
                } else {
                  selectTable.resource.setSelectedRows(selectedRows);
                  // 多选：追加
                  const prev = ctx.model.props.value || [];
                  const merged = [...prev, ...selectedRows];

                  // 去重，防止同一个值重复
                  const unique = merged.filter(
                    (row, index, self) =>
                      index ===
                      self.findIndex((r) => r[ctx.collection.filterTargetKey] === row[ctx.collection.filterTargetKey]),
                  );

                  ctx.model.selectedRows.value = unique;
                }
              },
            },
          },
          content: () => <RecordPickerContent model={ctx.model} toOne={!allowMultiple} />,
          styles: {
            content: {
              padding: 0,
              backgroundColor: ctx.model.flowEngine.context.themeToken.colorBgLayout,
              ...(openMode === 'embed' ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } : {}),
            },
            body: {
              padding: 0,
            },
          },
        });
      },
    },
  },
});
//专有配置项
RecordPickerFieldModel.registerFlow({
  key: 'recordPickerSettings',
  title: tExpr('RecordPicker settings'),
  sort: 200,
  steps: {
    fieldNames: {
      use: 'titleField',
    },
    allowMultiple: {
      title: tExpr('Multiple'),
      uiMode: { type: 'switch', key: 'allowMultiple' },
      hideInSettings(ctx) {
        return !canRecordPickerSelectMultiple(ctx.collectionField, true);
      },
      defaultParams(ctx) {
        return {
          allowMultiple: canRecordPickerSelectMultiple(ctx.collectionField, true),
        };
      },
      afterParamsSave(ctx, params, previousParams) {
        applyRecordPickerAllowMultiple(ctx, params, previousParams);
      },
      handler(ctx, params) {
        applyRecordPickerAllowMultiple(ctx, params);
      },
    },
  },
});

RecordPickerFieldModel.define({
  label: tExpr('Popup select'),
});

EditableItemModel.bindModelToInterface(
  'RecordPickerFieldModel',
  ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
  { order: 20 },
);
