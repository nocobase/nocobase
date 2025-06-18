/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useMemo } from 'react';
import { isValid, toArr } from '@formily/shared';
import { Select } from 'antd';
import { connect, mapReadPretty, mapProps } from '@formily/react';
import { FormFieldModel } from '../../../FormFieldModel';

function toValue(record: any | any[], fieldNames, multiple = false) {
  if (!record) return multiple ? [] : undefined;

  const { label: labelKey, value: valueKey } = fieldNames;

  const convert = (item: any) => {
    if (typeof item !== 'object' || item === null) return undefined;
    return {
      label: item[labelKey],
      value: item[valueKey],
    };
  };

  if (multiple) {
    if (!Array.isArray(record)) return [];
    return record.map(convert).filter(Boolean);
  }

  return convert(record);
}

function LazySelect(props) {
  const { fieldNames, value, multiple } = props;
  return (
    <Select
      showSearch
      labelInValue
      {...props}
      value={toValue(value, fieldNames, multiple)}
      mode={multiple && 'multiple'}
      onChange={(value, option) => {
        props.onChange(option);
      }}
    />
  );
}

export const AssociationSelect = connect(
  (props: any) => {
    return <LazySelect {...props} />;
  },
  mapProps(
    {
      dataSource: 'options',
    },
    (props, field) => {
      return {
        ...props,
      };
    },
  ),
  mapReadPretty((props) => {
    return props.value;
  }),
);

export class AssociationSelectFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy'];
  dataSource;
  fieldNames: { label: string; value: string; color?: string; icon?: any };

  set onPopupScroll(fn) {
    this.field.setComponentProps({ onPopupScroll: fn });
  }
  set onDropdownVisibleChange(fn) {
    this.field.setComponentProps({ onDropdownVisibleChange: fn });
  }
  set onSearch(fn) {
    this.field.setComponentProps({ onSearch: fn });
  }
  setDataSource(dataSource) {
    this.field.dataSource = dataSource;
  }
  getDataSource() {
    return this.field.dataSource;
  }
  setFieldNames(fieldNames) {
    this.fieldNames = fieldNames;
  }
  get component() {
    return [AssociationSelect, {}];
  }
}

AssociationSelectFieldModel.registerFlow({
  key: 'init',
  auto: true,
  sort: 100,
  steps: {
    step1: {
      handler(ctx, params) {
        let initialized = false;
        ctx.model.onDropdownVisibleChange = (open) => {
          if (open && !initialized) {
            initialized = true;

            ctx.model.dispatchEvent('dropdownOpen', {
              apiClient: ctx.app.apiClient,
              field: ctx.model.field,
              form: ctx.model.form,
            });
          }
        };
        ctx.model.onPopupScroll = (e) => {
          ctx.model.dispatchEvent('popupScroll', {
            event: e,
            apiClient: ctx.app.apiClient,
            field: ctx.model.field,
          });
        };
        ctx.model.onSearch = (searchText) => {
          ctx.model.dispatchEvent('search', {
            searchText,
            apiClient: ctx.app.apiClient,
            field: ctx.model.field,
          });
        };
      },
    },
  },
});

AssociationSelectFieldModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'dropdownOpen',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const apiClient = ctx.app.apiClient;
        const response = await apiClient.request({
          url: `/${target}:list`,
          params: {
            pageSize: 20,
          },
        });
        const { data } = response.data;
        ctx.model.setDataSource(data);
      },
    },
  },
});

const paginationState = {
  page: 1,
  pageSize: 20,
  loading: false,
  hasMore: true,
};

AssociationSelectFieldModel.registerFlow({
  key: 'event2',
  on: {
    eventName: 'popupScroll',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (paginationState.loading || !paginationState.hasMore) {
          return;
        }
        paginationState.loading = true;

        try {
          const { target } = ctx.model.collectionField.options;
          const apiClient = ctx.app.apiClient;

          const response = await apiClient.request({
            url: `/${target}:list`,
            params: {
              page: paginationState.page,
              pageSize: paginationState.pageSize,
            },
          });

          const { data } = response.data;

          const currentDataSource = ctx.model.getDataSource() || [];
          ctx.model.setDataSource([...currentDataSource, ...data]);

          if (data.length < paginationState.pageSize) {
            paginationState.hasMore = false;
          } else {
            paginationState.page++;
          }
        } catch (error) {
          console.error('滚动分页请求失败:', error);
        } finally {
          paginationState.loading = false;
        }
      },
    },
  },
});

AssociationSelectFieldModel.registerFlow({
  key: 'event3',
  on: {
    eventName: 'search',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        try {
          const collectionField = ctx.model.collectionField;
          const collectionManager = collectionField.collection.collectionManager;
          const targetCollection = collectionManager.getCollection(collectionField.options.target);

          const labelFieldName = ctx.model.field.componentProps.fieldNames.label;
          const targetLabelField = targetCollection.getField(labelFieldName);

          const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
            targetLabelField.options.interface,
          );
          const operator = targetInterface?.filterable?.operators?.[0]?.value || '$includes';

          const searchText = ctx.extra.searchText?.trim();

          const apiClient = ctx.app.apiClient;
          const response = await apiClient.request({
            url: `/${collectionField.options.target}:list`,
            params: {
              filter: {
                [labelFieldName]: {
                  [operator]: searchText,
                },
              },
            },
          });

          const { data } = response.data;
          ctx.model.setDataSource(data);
        } catch (error) {
          console.error('AssociationSelectField search flow error:', error);
          // 出错时也可以选择清空数据源或者显示错误提示
          ctx.model.setDataSource([]);
        }
      },
    },
  },
});
