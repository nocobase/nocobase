/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Select } from 'antd';
import React from 'react';
import { useStepSettingContext } from '@nocobase/flow-engine';
import { useCompile } from '../../../../../../schema-component';
import { getUniqueKeyFromCollection } from '../../../../../../collection-manager/interfaces/utils';
import { FormFieldModel } from '../FormFieldModel';
import { isTitleField } from '../../../../../../data-source';

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
  console.log(fieldNames, props);
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

const AssociationSelect = connect(
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

const SelectOptions = (props) => {
  const {
    model: { collectionField },
    app,
  } = useStepSettingContext();
  const compile = useCompile();
  const collectionManager = collectionField?.collection?.collectionManager;
  const dataSourceManager = app.dataSourceManager;
  const target = collectionField?.options?.target;
  if (!collectionManager || !target) return;
  const targetCollection = collectionManager.getCollection(target);
  const targetFields = targetCollection?.getFields?.() ?? [];
  const options = targetFields
    .filter((field) => isTitleField(dataSourceManager, field.options))
    .map((field) => ({
      value: field.name,
      label: compile(field.options.uiSchema?.title) || field.name,
    }));
  return <Select {...props} options={options} />;
};

AssociationSelectFieldModel.registerFlow({
  key: 'fieldNames',
  auto: true,
  sort: 200,
  title: 'Specific properties',
  steps: {
    fieldNames: {
      title: 'Title field',
      uiSchema: {
        label: {
          'x-component': SelectOptions,
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: (ctx) => {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        const targetCollection = collectionManager.getCollection(target);
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        return {
          label: ctx.model.props.fieldNames?.label || targetCollection.options.titleField || filterKey,
        };
      },
      handler(ctx, params) {
        const { target } = ctx.model.collectionField.options;
        const collectionManager = ctx.model.collectionField.collection.collectionManager;
        ctx.model.setStepParams;
        const targetCollection = collectionManager.getCollection(target);
        const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
        const newFieldNames = {
          value: filterKey,
          label: params.label || targetCollection.options.titleField || filterKey,
        };
        ctx.model.setComponentProps({ fieldNames: newFieldNames });
      },
    },
  },
});
