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
  getFilterValue() {
    const valueMode = this.props.valueMode || 'record';
    if (valueMode === 'value') {
      return this.props.value;
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
