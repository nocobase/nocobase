/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useMemo } from 'react';
import { Select, Space, Button, Divider, Tooltip, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { tExpr, useFlowModel } from '@nocobase/flow-engine';

import { RecordSelectFieldModel } from '../../../fields/AssociationFieldModel/RecordSelectFieldModel';
import {
  LabelByField,
  resolveOptions,
  toSelectValue,
  type AssociationOption,
  type LazySelectProps,
} from '../../../fields/AssociationFieldModel/recordSelectShared';
import { MobileLazySelect } from '../../../fields/mobile-components/MobileLazySelect';
import { BlockSceneEnum } from '../../../base';
import { ActionWithoutPermission } from '../../../base/ActionModel';

const FILTER_FORM_VALUE_OPTIONS_GROUP = '__filter_form_value_options__';

const isValidPrimaryKeyValue = (value: any, fieldType?: string) => {
  if (value === undefined || value === null || value === '') return false;
  if (typeof value === 'number' || typeof value === 'bigint') return true;
  if (typeof value !== 'string') return false;
  if (!fieldType) return true;
  return /(int|big)/i.test(fieldType) ? /^-?\d+$/.test(value) : true;
};

const resolveAsPrimaryKey = (value: any, fieldType?: string) => {
  if (typeof value === 'number' || typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'string' && /(int|big)/i.test(fieldType || '') && /^-?\d+$/.test(value)) {
    return value;
  }
  return undefined;
};

const normalizePrimaryKeys = (
  value: any,
  options: AssociationOption[],
  primaryKey: string,
  valueKey: string,
  isMultiple: boolean,
  primaryFieldType?: string,
) => {
  const optionValueToPrimaryKey = new Map<any, any>();
  options.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const optionValue = item?.[valueKey];
    const optionPrimaryKey = item?.[primaryKey];
    if (
      optionValue !== undefined &&
      optionValue !== null &&
      optionPrimaryKey !== undefined &&
      optionPrimaryKey !== null
    ) {
      optionValueToPrimaryKey.set(optionValue, optionPrimaryKey);
    }
  });

  const toPrimaryKey = (item: any) => {
    if (item == null) return undefined;
    if (typeof item === 'object') {
      const objectPrimaryKey = item?.[primaryKey];
      if (objectPrimaryKey !== undefined && objectPrimaryKey !== null) {
        return objectPrimaryKey;
      }
      const fallbackValue = item?.[valueKey] ?? item?.value;
      if (valueKey === primaryKey) {
        return fallbackValue;
      }
      const mappedPrimaryKey = optionValueToPrimaryKey.get(fallbackValue);
      if (mappedPrimaryKey !== undefined && mappedPrimaryKey !== null) {
        return mappedPrimaryKey;
      }
      return resolveAsPrimaryKey(fallbackValue, primaryFieldType);
    }
    if (valueKey === primaryKey) {
      return item;
    }
    const mappedPrimaryKey = optionValueToPrimaryKey.get(item);
    if (mappedPrimaryKey !== undefined && mappedPrimaryKey !== null) {
      return mappedPrimaryKey;
    }
    return resolveAsPrimaryKey(item, primaryFieldType);
  };

  const list = isMultiple ? (Array.isArray(value) ? value : [value]) : [value];
  return list
    .map((item) => toPrimaryKey(item))
    .filter((item): item is string | number => isValidPrimaryKeyValue(item, primaryFieldType));
};

const mergeOptionsByValue = (
  current: AssociationOption[] = [],
  incoming: AssociationOption[] = [],
  valueKey: string,
) => {
  const optionMap = new Map<any, AssociationOption>();
  [...current, ...incoming].forEach((item) => {
    const key = item?.[valueKey];
    if (key !== undefined && key !== null) {
      optionMap.set(key, item);
    }
  });
  return Array.from(optionMap.values());
};

const useFieldPermissionMessage = (model, allowEdit) => {
  const collectionField = model?.context?.collectionField;
  const collection = collectionField?.collection;
  const dataSource = collection?.dataSource;
  const t = model?.context?.t;
  const name = collectionField?.name || model.fieldPath;

  const nameValue = useMemo(() => {
    if (!t || !dataSource) return '';
    const dataSourcePrefix = `${t(dataSource.displayName || dataSource.key)} > `;
    const collectionPrefix = collection ? `${t(collection.title) || collection.name || collection.tableName} > ` : '';
    return `${dataSourcePrefix}${collectionPrefix}${name}`;
  }, [t, dataSource, collection, name]);

  // Return null if editing is allowed or if required dependencies are missing
  // (can't show permission message without translation function and data source info)
  if (allowEdit || !t || !dataSource) {
    return null;
  }
  const messageValue = t(
    `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for field "{{name}}"`,
    {
      name: nameValue,
      actionName: 'Update',
    },
  ).replaceAll('&gt;', '>');
  return messageValue;
};

const FilterFormLazySelect = (props: Readonly<LazySelectProps>) => {
  const {
    fieldNames = { label: 'label', value: 'value' },
    value,
    multiple,
    allowMultiple,
    options,
    quickCreate,
    onChange,
    allowCreate = true,
    allowEdit = true,
    valueMode = 'record',
    ...others
  } = props;
  const isMultiple = Boolean(multiple && allowMultiple);
  const realOptions = resolveOptions(options, value, isMultiple);
  const model: any = useFlowModel();
  const isConfigMode = !!model.context.flowSettingsEnabled;
  const { t } = useTranslation();
  const QuickAddContent = ({ searchText }) => {
    return (
      <div
        onClick={() => others.onDropdownAddClick(searchText)}
        style={{ cursor: 'pointer', padding: '5px 12px', color: '#0d0c0c' }}
      >
        <PlusOutlined />
        <span style={{ paddingLeft: 5 }}>{t('Add') + ` “${searchText}” `}</span>
      </div>
    );
  };
  const fieldAclMessage = useFieldPermissionMessage(model, allowEdit);

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select
        style={{ width: '100%' }}
        {...others}
        allowClear
        showSearch
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
        filterOption={false}
        labelInValue
        //@ts-ignore
        onCompositionEnd={(e) => others.onCompositionEnd(e, false)}
        fieldNames={fieldNames}
        options={realOptions}
        value={toSelectValue(value, fieldNames, isMultiple, valueMode, realOptions)}
        mode={isMultiple ? 'multiple' : undefined}
        onChange={(value, option) => {
          if (valueMode === 'value') {
            if (Array.isArray(option)) {
              onChange(
                option
                  .map((item) => item?.[fieldNames.value] ?? item?.value)
                  .filter((item) => item !== undefined) as any,
              );
              return;
            }
            onChange((option as AssociationOption)?.[fieldNames.value] ?? (option as any)?.value);
            return;
          }
          onChange(option as AssociationOption | AssociationOption[]);
        }}
        optionRender={({ data }) => {
          return <LabelByField option={data} fieldNames={fieldNames} />;
        }}
        popupMatchSelectWidth
        labelRender={(data) => {
          return (
            <div
              className={css`
                div {
                  white-space: nowrap !important;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
              `}
            >
              {data.label}
            </div>
          );
        }}
        dropdownRender={(menu) => {
          const isFullMatch = realOptions.some((v) => v[fieldNames.label] === others.searchText);
          return (
            <>
              {quickCreate === 'quickAdd' && allowCreate && allowEdit && others.searchText ? (
                <>
                  {!(realOptions.length === 0 && others.searchText) && menu}
                  {realOptions.length > 0 && others.searchText && !isFullMatch && <Divider style={{ margin: 0 }} />}
                  {!isFullMatch && <QuickAddContent searchText={others.searchText} />}
                </>
              ) : (
                menu
              )}
            </>
          );
        }}
      />
      {quickCreate === 'modalAdd' &&
        ((allowCreate && allowEdit) || isConfigMode) &&
        (allowCreate && allowEdit ? (
          <Button onClick={others.onModalAddClick}>{t('Add new')}</Button>
        ) : (
          <ActionWithoutPermission
            forbidden={{ actionName: 'create' }}
            collection={model?.collectionField?.targetCollection}
            message={fieldAclMessage}
          >
            <Button onClick={others.onModalAddClick} disabled={!allowEdit} style={{ opacity: '0.3' }}>
              {t('Add new')}
            </Button>
          </ActionWithoutPermission>
        ))}
    </Space.Compact>
  );
};

export class FilterFormCustomRecordSelectFieldModel extends RecordSelectFieldModel {
  private valueOptionsSyncKey: string | null = null;
  private valueOptionsSyncedKey: string | null = null;
  private valueOptionsSyncTask: Promise<void> | null = null;

  private buildValueOptionsSyncKey() {
    const valueMode = this.props?.valueMode || 'record';
    if (valueMode !== 'value') return null;
    const fieldNames = this.props?.fieldNames || {};
    const primaryKey = this.context.collectionField?.targetCollection?.filterTargetKey || 'id';
    const valueKey = fieldNames?.value || 'id';
    const isMultiple = Boolean(this.props?.multiple && this.props?.allowMultiple);
    const currentOptions = resolveOptions(this.props?.options, this.props?.value, isMultiple);
    const primaryFieldType = this.context.collectionField?.targetCollection?.getField?.(primaryKey)?.type;
    const selectedValueKeys = normalizePrimaryKeys(
      this.props?.value,
      currentOptions,
      primaryKey,
      valueKey,
      isMultiple,
      primaryFieldType,
    );
    if (!selectedValueKeys.length) return null;
    const existingKeys = new Set(currentOptions.map((item) => item?.[primaryKey]).filter((item) => item != null));
    const unresolvedKeys = selectedValueKeys.filter((item) => !existingKeys.has(item));
    if (!unresolvedKeys.length) return null;
    return `${primaryKey}::${unresolvedKeys.slice().sort().join(',')}`;
  }

  private ensureValueOptionsSynced() {
    const syncKey = this.buildValueOptionsSyncKey();
    if (!syncKey) return;
    if (syncKey === this.valueOptionsSyncedKey) return;
    if (this.valueOptionsSyncTask && this.valueOptionsSyncKey === syncKey) return;

    this.valueOptionsSyncKey = syncKey;
    this.valueOptionsSyncTask = this.applyFlow('syncValueOptions')
      .then(() => {
        this.valueOptionsSyncedKey = syncKey;
      })
      .finally(() => {
        if (this.valueOptionsSyncKey === syncKey) {
          this.valueOptionsSyncTask = null;
        }
      });
  }

  async onDispatchEventStart(eventName: string) {
    if (eventName !== 'beforeRender') return;
    this.ensureValueOptionsSynced();
  }

  getFilterValue() {
    const valueMode = this.props.valueMode || 'record';
    if (valueMode === 'value') {
      const valueKey = this.props?.fieldNames?.value || 'id';
      const normalize = (item: any) => {
        if (item == null) return item;
        if (typeof item === 'object') {
          return item?.[valueKey] ?? item?.value;
        }
        return item;
      };
      if (Array.isArray(this.props.value)) {
        return this.props.value
          .map((item) => normalize(item))
          .filter((item) => item !== undefined && item !== null && item !== '');
      }
      return normalize(this.props.value);
    }
    return super.getFilterValue();
  }

  render() {
    if (this.context.isMobileLayout) {
      return <MobileLazySelect {...(this.props as LazySelectProps)} loading={this.resource.loading} />;
    }

    return <FilterFormLazySelect {...(this.props as LazySelectProps)} />;
  }
}

FilterFormCustomRecordSelectFieldModel.registerFlow({
  key: 'syncValueOptions',
  sort: 780,
  steps: {
    syncByValue: {
      async handler(ctx) {
        const valueMode = ctx.model.props?.valueMode || 'record';
        if (valueMode !== 'value') return;
        const fieldNames = ctx.model.props?.fieldNames || {};
        const primaryKey = ctx.model.context.collectionField?.targetCollection?.filterTargetKey || 'id';
        const valueKey = fieldNames?.value || 'id';
        const isMultiple = Boolean(ctx.model.props?.multiple && ctx.model.props?.allowMultiple);
        const currentOptions = resolveOptions(ctx.model.props?.options, ctx.model.props?.value, isMultiple);
        const primaryFieldType = ctx.model.context.collectionField?.targetCollection?.getField?.(primaryKey)?.type;
        const selectedValueKeys = normalizePrimaryKeys(
          ctx.model.props?.value,
          currentOptions,
          primaryKey,
          valueKey,
          isMultiple,
          primaryFieldType,
        );
        if (!selectedValueKeys.length) return;
        const existingKeys = new Set(currentOptions.map((item) => item?.[primaryKey]).filter((item) => item != null));
        const unresolvedKeys = selectedValueKeys.filter((item) => !existingKeys.has(item));
        if (!unresolvedKeys.length) return;

        const resource = ctx.model.resource;
        if (!resource || typeof resource?.addFilterGroup !== 'function' || typeof resource?.refresh !== 'function') {
          return;
        }

        const filter =
          unresolvedKeys.length === 1
            ? { [`${primaryKey}.$eq`]: unresolvedKeys[0] }
            : { [`${primaryKey}.$in`]: unresolvedKeys };

        try {
          resource.addFilterGroup(FILTER_FORM_VALUE_OPTIONS_GROUP, filter);
          await resource.refresh();
          const fetched = resource.getData?.() || [];
          if (!Array.isArray(fetched) || !fetched.length) return;
          const mergedOptions = mergeOptionsByValue(currentOptions, fetched, primaryKey);
          const hasChanged =
            mergedOptions.length !== currentOptions.length ||
            mergedOptions.some((item, index) => item?.[primaryKey] !== currentOptions?.[index]?.[primaryKey]);
          if (!hasChanged) return;
          ctx.model.setDataSource(mergedOptions);
        } finally {
          resource.removeFilterGroup?.(FILTER_FORM_VALUE_OPTIONS_GROUP);
        }
      },
    },
  },
});

FilterFormCustomRecordSelectFieldModel.registerFlow({
  key: 'selectSettings',
  title: tExpr('Association select settings'),
  sort: 800,
  steps: {
    fieldNames: {
      use: 'titleField',
    },
    valueFieldOverride: {
      handler(ctx) {
        const valueField = ctx.model.props.recordSelectValueField;
        if (!valueField) return;
        const nextFieldNames = {
          ...(ctx.model.props.fieldNames || {}),
          value: valueField,
        };
        ctx.model.setProps({
          fieldNames: nextFieldNames,
        });
      },
    },
    dataScope: {
      use: 'dataScope',
    },
    sortingRule: {
      use: 'sortingRule',
    },
    allowMultiple: {
      title: tExpr('Multiple'),
      uiMode: { type: 'switch', key: 'allowMultiple' },
      hideInSettings(ctx) {
        return (
          !ctx.collectionField || !['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.collectionField.type)
        );
      },
      defaultParams(ctx) {
        if (typeof ctx.model.props.allowMultiple === 'boolean') {
          return {
            allowMultiple: ctx.model.props.allowMultiple,
          };
        }
        return {
          allowMultiple:
            ctx.collectionField &&
            ['belongsToMany', 'hasMany', 'belongsToArray'].includes(ctx.model.context.collectionField.type),
        };
      },
      handler(ctx, params) {
        const isFilterScene = ctx?.blockModel?.constructor?.scene === BlockSceneEnum.filter;
        const allowMultipleValue =
          typeof ctx.model.props.allowMultiple === 'boolean' ? ctx.model.props.allowMultiple : params?.allowMultiple;
        if (isFilterScene && typeof allowMultipleValue === 'boolean') {
          ctx.model.setProps({
            allowMultiple: allowMultipleValue,
            multiple: allowMultipleValue,
          });
          return;
        }
        ctx.model.setProps({
          allowMultiple: params?.allowMultiple,
          multiple: params?.allowMultiple,
        });
      },
    },
    quickCreate: {
      title: tExpr('Quick create'),
      uiMode(ctx) {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'quickCreate',
          props: {
            options: [
              { label: t('None'), value: 'none' },
              { label: t('Dropdown'), value: 'quickAdd' },
              { label: t('Pop-up'), value: 'modalAdd' },
            ],
          },
        };
      },
      hideInSettings(ctx) {
        if (ctx?.blockModel?.constructor?.scene === BlockSceneEnum.filter) {
          return true;
        }
        return false;
      },
      defaultParams: {
        quickCreate: 'none',
      },
      handler(ctx, params) {
        ctx.model.setProps({
          quickCreate: params.quickCreate,
        });
      },
    },
  },
});
