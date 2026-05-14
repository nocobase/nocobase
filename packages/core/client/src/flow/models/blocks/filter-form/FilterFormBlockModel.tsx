/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SettingOutlined } from '@ant-design/icons';
import { FormButtonGroup } from '@formily/antd-v5';
import type { CollectionField, PropertyMeta, PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  AddSubModelButton,
  DndProvider,
  DragHandler,
  Droppable,
  isRunJSValue,
  normalizeRunJSValue,
  runjsWithSafeGlobals,
  tExpr,
  FlowModelRenderer,
  FlowSettingsButton,
} from '@nocobase/flow-engine';
import { Form } from 'antd';
import { isEqual } from 'lodash';
import React from 'react';
import { commonConditionHandler, ConditionBuilder } from '../../../components/ConditionBuilder';
import {
  markSaveStepParamsWithSubModels,
  saveStepParamsWithSubModelsIfNeeded,
} from '../../../internal/utils/saveStepParamsWithSubModels';
import { BlockSceneEnum, FilterBlockModel } from '../../base';
import { FormComponent } from '../../blocks/form/FormBlockModel';
import { evaluateCondition } from '../form/value-runtime/conditions';
import { isEmptyValue } from '../form/value-runtime/utils';
import { FilterManager, type RefreshTargetsByFilterOptions } from '../filter-manager/FilterManager';
import { FilterFormItemModel } from './FilterFormItemModel';
import { clearLegacyDefaultValuesFromFilterFormModel } from './legacyDefaultValueMigration';
import { findFormItemModelByFieldPath } from '../../../internal/utils/modelUtils';
import { FormItemModel } from '../form';
import { getDefaultOperator } from '../filter-manager/utils';
import { normalizeFilterValueByOperator } from './valueNormalization';

const RELATION_FIELD_TYPES = ['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'belongsToArray'];
const NUMERIC_FIELD_TYPES = ['integer', 'float', 'double', 'decimal'];

function getFilterFormFieldMetaType(field: CollectionField) {
  if (RELATION_FIELD_TYPES.includes(field.type)) {
    return 'object';
  }

  if (NUMERIC_FIELD_TYPES.includes(field.type)) {
    return 'number';
  }

  switch (field.type) {
    case 'boolean':
      return 'boolean';
    case 'json':
      return 'object';
    case 'array':
      return 'array';
    default:
      return 'string';
  }
}

function shouldShowFilterFormFieldMeta(field: CollectionField) {
  return Boolean(field?.interface);
}

function createFilterFormFieldMeta(field: CollectionField): PropertyMeta {
  const baseMeta = {
    title: field.title || field.name,
    interface: field.interface,
    options: field.options,
    uiSchema: field.uiSchema || {},
  };

  if (!field.isAssociationField?.()) {
    return {
      type: getFilterFormFieldMetaType(field),
      ...baseMeta,
    };
  }

  const targetCollection = field.targetCollection;
  if (!targetCollection) {
    return {
      type: 'object',
      ...baseMeta,
    };
  }

  return {
    type: 'object',
    ...baseMeta,
    properties: async () => {
      const properties: Record<string, PropertyMeta> = {};
      targetCollection.fields.forEach((subField) => {
        if (shouldShowFilterFormFieldMeta(subField)) {
          properties[subField.name] = createFilterFormFieldMeta(subField);
        }
      });
      return properties;
    },
  };
}

function getFilterFormItemFieldName(itemModel: any) {
  const name = itemModel?.props?.name;
  if (typeof name === 'string' && name) {
    return name;
  }

  return itemModel?.fieldPath && itemModel?.uid ? `${itemModel.fieldPath}_${itemModel.uid}` : undefined;
}

function toFilterByTk(value: any, primaryKey: string | string[] | undefined) {
  if (value == null) return undefined;
  if (Array.isArray(primaryKey)) {
    if (typeof value !== 'object') return undefined;
    const filterByTk: Record<string, any> = {};
    for (const key of primaryKey) {
      const item = value?.[key];
      if (item == null) return undefined;
      filterByTk[key] = item;
    }
    return filterByTk;
  }
  if (typeof value !== 'object') return value;
  const key = Array.isArray(primaryKey) ? primaryKey[0] : primaryKey;
  return key ? value?.[key] : value?.id;
}

function setValueByPath(target: Record<string, any>, path: string, value: any) {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length) return;

  let cursor = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = value;
      return;
    }

    if (!cursor[segment] || typeof cursor[segment] !== 'object' || Array.isArray(cursor[segment])) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  });
}

function setMetaByPath(target: Record<string, PropertyMeta>, path: string, meta: PropertyMeta) {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length) return;

  let cursor = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      cursor[segment] = meta;
      return;
    }

    const current = cursor[segment];
    if (!current || typeof current !== 'object') {
      cursor[segment] = {
        type: 'object',
        title: segment,
        properties: {},
      };
    }
    const properties = cursor[segment].properties;
    if (!properties || typeof properties === 'function') {
      cursor[segment].properties = {};
    }
    cursor = cursor[segment].properties as Record<string, PropertyMeta>;
  });
}

function getFilterFormValues(form: any, items: any[]) {
  const formValues = form?.getFieldsValue?.() || {};
  const values = { ...formValues };

  for (const itemModel of items) {
    const fieldName = getFilterFormItemFieldName(itemModel);
    if (!fieldName || !fieldName.includes('.') || !(fieldName in formValues)) {
      continue;
    }
    setValueByPath(values, fieldName, formValues[fieldName]);
  }

  return values;
}

function isFilterFormFieldSubPath(fieldName: string, subPath: string) {
  return subPath === fieldName || subPath.startsWith(`${fieldName}.`) || subPath.startsWith(`${fieldName}[`);
}

function isFilterFormFieldDeepSubPath(fieldName: string, subPath: string) {
  return subPath.startsWith(`${fieldName}.`) || subPath.startsWith(`${fieldName}[`);
}

function findFilterFormItemByVariableSubPath(items: any[], subPath: string) {
  if (!subPath) return null;

  return (
    items.find((itemModel) => {
      const fieldName = getFilterFormItemFieldName(itemModel);
      return fieldName && isFilterFormFieldSubPath(fieldName, subPath);
    }) || null
  );
}

export class FilterFormBlockModel extends FilterBlockModel<{
  subModels: {
    grid: any; // Replace with actual type if available
    actions?: any[]; // Replace with actual type if available
  };
}> {
  static scene = BlockSceneEnum.filter;

  /**
   * 是否需要自动触发筛选，当字段值变更时自动执行筛选
   */
  autoTriggerFilter = true;

  private removeTargetBlockListener?: () => void;
  private initialDefaultsPromise?: Promise<void>;
  private initialRefreshHandledTargetIds = new Set<string>();
  private lastDefaultValueByFieldName = new Map<string, any>();
  private defaultValuesRefreshSeq = 0;

  get form() {
    return this.context.form;
  }

  get title() {
    return 'Filter form';
  }

  protected createFormValuesMetaFactory(): PropertyMetaFactory {
    const factory: PropertyMetaFactory = async () => ({
      type: 'object',
      title: this.translate('Current form'),
      properties: async () => {
        const properties: Record<string, PropertyMeta> = {};
        const items = this.subModels?.grid?.subModels?.items || [];

        for (const itemModel of items) {
          const fieldName = getFilterFormItemFieldName(itemModel);
          const collectionField = itemModel?.subModels?.field?.context?.collectionField || itemModel?.collectionField;
          if (!fieldName || !collectionField || !shouldShowFilterFormFieldMeta(collectionField)) {
            continue;
          }
          setMetaByPath(properties, fieldName, createFilterFormFieldMeta(collectionField));
        }

        return properties;
      },
      buildVariablesParams: () => {
        const formValues = this.form?.getFieldsValue?.() || {};
        const items = this.subModels?.grid?.subModels?.items || [];
        const params: Record<string, any> = {};

        for (const itemModel of items) {
          const fieldName = getFilterFormItemFieldName(itemModel);
          const collectionField = itemModel?.subModels?.field?.context?.collectionField || itemModel?.collectionField;
          if (!fieldName || !collectionField?.isAssociationField?.()) {
            continue;
          }

          const targetCollection = collectionField.targetCollection;
          const target = collectionField.target;
          if (!targetCollection || !target) {
            continue;
          }

          const fieldValue = formValues[fieldName];
          const primaryKey = targetCollection.filterTargetKey;
          if (Array.isArray(fieldValue)) {
            const filterByTk = fieldValue.map((item) => toFilterByTk(item, primaryKey)).filter((item) => item != null);
            if (filterByTk.length) {
              setValueByPath(params, fieldName, {
                collection: target,
                dataSourceKey: targetCollection.dataSourceKey,
                filterByTk,
              });
            }
            continue;
          }

          const filterByTk = toFilterByTk(fieldValue, primaryKey);
          if (filterByTk != null) {
            setValueByPath(params, fieldName, {
              collection: target,
              dataSourceKey: targetCollection.dataSourceKey,
              filterByTk,
            });
          }
        }

        return params;
      },
    });
    factory.title = this.translate('Current form');
    return factory;
  }

  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [form] = Form.useForm();
    this.context.defineProperty('form', { get: () => form, cache: false });
    this.context.defineProperty('formValues', {
      get: () => getFilterFormValues(this.form, this.subModels?.grid?.subModels?.items || []),
      cache: false,
      meta: this.createFormValuesMetaFactory(),
      resolveOnServer: (subPath: string) => {
        const items = this.subModels?.grid?.subModels?.items || [];
        const itemModel = findFilterFormItemByVariableSubPath(items, subPath);
        if (!itemModel) return false;

        const fieldName = getFilterFormItemFieldName(itemModel);
        const collectionField = itemModel?.subModels?.field?.context?.collectionField || itemModel?.collectionField;
        return Boolean(
          fieldName &&
            isFilterFormFieldDeepSubPath(fieldName, subPath) &&
            collectionField?.isAssociationField?.() &&
            collectionField?.targetCollection,
        );
      },
      serverOnlyWhenContextParams: true,
    });
  }

  async saveStepParams() {
    return await saveStepParamsWithSubModelsIfNeeded(this, async () => {
      return await super.saveStepParams();
    });
  }

  addAppends() {}

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
    this.context.defineMethod('refreshTargets', async (options?: RefreshTargetsByFilterOptions) => {
      const gridModel = this.subModels.grid;
      const fieldModels: FilterFormItemModel[] = gridModel.subModels.items;
      const filterIds = fieldModels?.map((fieldModel) => fieldModel?.uid).filter(Boolean);
      if (filterIds?.length) {
        const filterManager: FilterManager = this.context.filterManager;
        await filterManager.refreshTargetsByFilter(filterIds, options);
      }
    });
  }

  onMount() {
    super.onMount();
    this.context.defineProperty('filterFormGridModel', {
      value: this.subModels.grid,
    });

    // 首次进入页面：等待子模型 beforeRender 完成（例如 name 初始化），再应用表单级默认值并触发筛选
    void this.applyDefaultsAndInitialFilter();

    // 监听页面区块删除，自动清理已失效的筛选字段。
    // 这里使用 onSubModelDestroyed 而不是 onSubModelRemoved，避免弹窗关闭时
    // 的临时模型卸载被误判成“用户删除了目标区块”。
    const blockGridModel = this.context.blockGridModel;
    if (blockGridModel?.emitter) {
      const handleTargetDestroyed = (model) => {
        if (!model?.uid || model.uid === this.uid) return;
        void this.handleTargetBlockRemoved(model.uid).catch((error) => {
          console.error('Failed to handle destroyed target block in FilterFormBlockModel:', error);
        });
      };
      blockGridModel.emitter.on('onSubModelDestroyed', handleTargetDestroyed);
      this.removeTargetBlockListener = () => blockGridModel.emitter.off('onSubModelDestroyed', handleTargetDestroyed);
    }
  }

  onUnmount() {
    this.removeTargetBlockListener?.();
    super.onUnmount();
  }

  private async applyDefaultsAndInitialFilter() {
    const prepared = await this.prepareInitialFilterValues();
    if (prepared) {
      await this.context.refreshTargets?.({ excludeTargetIds: this.initialRefreshHandledTargetIds });
    }
  }

  async prepareInitialFilterValues() {
    if (!this.form) {
      return false;
    }

    if (!this.initialDefaultsPromise) {
      this.initialDefaultsPromise = (async () => {
        await this.ensureFilterItemsBeforeRender();
        await this.applyFormDefaultValues();
      })();
    }

    await this.initialDefaultsPromise;
    return true;
  }

  markInitialTargetRefreshHandled(targetId: string) {
    if (!targetId) return;
    this.initialRefreshHandledTargetIds.add(targetId);
  }

  private async ensureFilterItemsBeforeRender() {
    const gridModel = this.subModels?.grid;
    const items = (gridModel as any)?.subModels?.items || [];
    if (!Array.isArray(items) || items.length === 0) return;

    for (const itemModel of items) {
      if (typeof itemModel?.dispatchEvent === 'function') {
        await itemModel.dispatchEvent('beforeRender');
      }
    }
  }

  private canApplyFormDefaultValue(name: string, current: any, force?: boolean) {
    if (force) return true;
    if (isEmptyValue(current)) return true;
    if (!this.lastDefaultValueByFieldName.has(name)) return false;
    return isEqual(current, this.lastDefaultValueByFieldName.get(name));
  }

  private async matchDefaultValueCondition(condition: any) {
    if (!condition) return true;

    let resolvedCondition = condition;
    try {
      const nextCondition = await (this.context as any).resolveJsonTemplate?.(condition);
      if (typeof nextCondition !== 'undefined') {
        resolvedCondition = nextCondition;
      }
    } catch {
      resolvedCondition = condition;
    }

    return evaluateCondition(this.context, resolvedCondition);
  }

  async applyFormDefaultValues(options?: { force?: boolean; refreshSeq?: number }) {
    const appliedValues: Record<string, any> = {};
    const form = this.form;
    if (!form) return appliedValues;

    const force = options?.force === true;
    const params = this.getStepParams?.('formFilterBlockModelSettings', 'defaultValues');
    const rules = (params?.value || []) as any[];
    if (!Array.isArray(rules) || rules.length === 0) return appliedValues;

    const resolveValue = async (raw: any) => {
      // RunJS support
      if (isRunJSValue(raw)) {
        const { code, version } = normalizeRunJSValue(raw);
        const ret = await runjsWithSafeGlobals(this.context, code, { version });
        return ret?.success ? ret.value : undefined;
      }

      return await (this.context as any).resolveJsonTemplate?.(raw);
    };

    for (const rule of rules) {
      if (!rule || typeof rule !== 'object') continue;
      if (rule.enable === false) continue;
      if (!(await this.matchDefaultValueCondition(rule.condition))) continue;
      if (options?.refreshSeq && options.refreshSeq !== this.defaultValuesRefreshSeq) return appliedValues;

      const targetPath = rule.targetPath ? String(rule.targetPath).trim() : '';
      const fieldUid = rule.field ? String(rule.field).trim() : '';

      const itemModel: FormItemModel =
        (targetPath ? findFormItemModelByFieldPath(this, targetPath) : null) ??
        (fieldUid ? this.context?.engine?.getModel?.(fieldUid) : null);
      if (!itemModel) continue;

      const props = typeof itemModel.getProps === 'function' ? itemModel.getProps() : itemModel.props;
      const name = props?.name ?? (itemModel.fieldPath ? `${itemModel.fieldPath}_${itemModel.uid}` : undefined);
      if (!name) continue;

      const current = (form as any).getFieldValue?.(name);

      const resolved = await resolveValue(rule.value);
      if (options?.refreshSeq && options.refreshSeq !== this.defaultValuesRefreshSeq) return appliedValues;
      if (typeof resolved === 'undefined') continue;

      const operator = getDefaultOperator(itemModel as any);
      const normalized = normalizeFilterValueByOperator(operator, resolved);
      const mode = String(rule.mode || 'default') === 'assign' ? 'assign' : 'default';
      if (mode === 'default' && !this.canApplyFormDefaultValue(String(name), current, force)) continue;
      if (isEqual(current, normalized)) {
        if (mode === 'default') {
          this.lastDefaultValueByFieldName.set(String(name), normalized);
        } else {
          this.lastDefaultValueByFieldName.delete(String(name));
        }
        continue;
      }

      if (typeof (form as any).setFieldValue === 'function') {
        (form as any).setFieldValue(name, normalized);
      } else {
        (form as any).setFieldsValue?.({ [String(name)]: normalized });
      }
      if (mode === 'default') {
        this.lastDefaultValueByFieldName.set(String(name), normalized);
      } else {
        this.lastDefaultValueByFieldName.delete(String(name));
      }
      appliedValues[String(name)] = normalized;
    }

    return appliedValues;
  }

  private handleFilterFormValuesChange(changedValues: any, allValues: any) {
    const refreshSeq = ++this.defaultValuesRefreshSeq;
    void (async () => {
      const appliedValues = await this.applyFormDefaultValues({ refreshSeq });
      if (refreshSeq !== this.defaultValuesRefreshSeq) return;

      const finalChangedValues = { ...(changedValues || {}), ...(appliedValues || {}) };
      const finalAllValues = this.form?.getFieldsValue?.() || allValues;
      const payload = { changedValues: finalChangedValues, allValues: finalAllValues };
      this.dispatchEvent('formValuesChange', payload, { debounce: true });
      this.emitter.emit('formValuesChange', payload);
    })().catch((error) => {
      console.error('Failed to refresh filter form default values:', error);
    });
  }

  private async handleTargetBlockRemoved(targetUid: string) {
    const filterManager: FilterManager = this.context.filterManager;
    const gridModel = this.subModels.grid;
    const fieldModels: FilterFormItemModel[] = gridModel.subModels.items || [];

    for (const fieldModel of [...fieldModels]) {
      const connectConfig = filterManager.getConnectFieldsConfig(fieldModel.uid);
      const targets = connectConfig?.targets || [];
      const hasTarget = targets.some((target) => target.targetId === targetUid);
      const defaultMatches = fieldModel.defaultTargetUid === targetUid;

      if (!hasTarget && !defaultMatches) continue;

      const remainingTargets = targets.filter((target) => target.targetId !== targetUid);

      if (remainingTargets.length > 0) {
        await filterManager.saveConnectFieldsConfig(fieldModel.uid, { targets: remainingTargets });
        continue;
      }

      await filterManager.removeFilterConfig({ filterId: fieldModel.uid });
      await fieldModel.destroy();
    }
  }

  async destroy(): Promise<boolean> {
    // 清理所有子模型的筛选配置
    const filterManager: FilterManager = this.context.filterManager;
    this.subModels.grid.subModels.items?.map((item) => {
      filterManager.removeFilterConfig({ filterId: item.uid, persist: false });
    });

    return await super.destroy();
  }

  renderComponent() {
    const { colon, labelAlign, labelWidth, labelWrap, layout } = this.props;
    const isConfigMode = !!this.context.flowSettingsEnabled;

    return (
      <FormComponent
        model={this}
        onFinish={() => {
          this.context.refreshTargets();
        }}
        onValuesChange={(changedValues, allValues) => this.handleFilterFormValuesChange(changedValues, allValues)}
        layoutProps={{ colon, labelAlign, labelWidth, labelWrap, layout }}
      >
        <FlowModelRenderer model={this.subModels.grid} showFlowSettings={false} />
        <DndProvider>
          <FormButtonGroup align="right">
            {this.mapSubModels('actions', (action) => {
              if (action.hidden && !isConfigMode) {
                return;
              }
              return (
                <Droppable model={action} key={action.uid}>
                  <FlowModelRenderer
                    key={action.uid}
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
            })}
            <AddSubModelButton
              key="filter-form-actions-add"
              model={this}
              subModelKey="actions"
              subModelBaseClass={'FilterFormActionGroupModel'}
            >
              <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
            </AddSubModelButton>
          </FormButtonGroup>
        </DndProvider>
      </FormComponent>
    );
  }
}

FilterFormBlockModel.define({
  label: tExpr('Form'),
  createModelOptions: {
    use: 'FilterFormBlockModel',
    subModels: {
      grid: {
        use: 'FilterFormGridModel',
      },
    },
  },
});

FilterFormBlockModel.registerFlow({
  key: 'formFilterBlockModelSettings',
  title: tExpr('Form settings'),
  steps: {
    layout: {
      use: 'layout',
      title: tExpr('Layout'),
    },
    defaultValues: {
      use: 'filterFormDefaultValues',
      title: tExpr('Field values'),
      beforeParamsSave(ctx) {
        // 迁移：保存表单级默认值后，移除字段级默认值配置（filterFormItemSettings.initialValue）
        const cleared = clearLegacyDefaultValuesFromFilterFormModel(ctx.model);
        if (Array.isArray(cleared) && cleared.length) {
          // FlowModelRepository({ onlyStepParams: true }) 不会写入 subModels，
          // 此处标记后在 saveStepParams 中触发一次全量保存以持久化清理结果。
          markSaveStepParamsWithSubModels(ctx.model);
        }
      },
      afterParamsSave(ctx) {
        // 保存后立即回填默认值（用于配置态预览），并触发一次筛选刷新
        void ctx.model?.applyFormDefaultValues?.({ force: true }).then(() => ctx.model?.context?.refreshTargets?.());
      },
    },
  },
});

FilterFormBlockModel.registerEvents({
  formValuesChange: {
    title: tExpr('Form values change'),
    name: 'formValuesChange',
    uiSchema: {
      condition: {
        type: 'object',
        title: tExpr('Trigger condition'),
        'x-decorator': 'FormItem',
        'x-component': ConditionBuilder,
      },
    },
    handler: commonConditionHandler,
  },
});
