/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { Select } from 'antd';
import { connect, mapReadPretty, mapProps } from '@formily/react';
import { isTitleField } from '../../../../../data-source';
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
  (props: any) => <LazySelect {...props} />,
  mapProps({ dataSource: 'options' }),
  mapReadPretty((props) => props.value),
);

export class AssociationSelectFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy'];
  dataSource;
  fieldNames: { label: string; value: string; color?: string; icon?: any };
  optionsLoadState?: {
    page: number;
    pageSize: number;
    loading: boolean;
    hasMore: boolean;
    searchText?: string;
  };
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

export const DEFAULT_ASSOCIATION_PAGE_SIZE = 40;

async function fetchAssociationItems({ ctx, page = 1, searchText = '' }) {
  const { target } = ctx.model.collectionField.options;
  const fieldNames = ctx.model.field.componentProps.fieldNames;
  const labelField = fieldNames?.label;

  const apiClient = ctx.app.apiClient;
  const collectionManager = ctx.model.collectionField.collection.collectionManager;
  const targetCollection = collectionManager.getCollection(target);
  const targetLabelField = targetCollection.getField(labelField);
  const targetInterface = ctx.app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
    targetLabelField.options.interface,
  );
  const operator = targetInterface?.filterable?.operators?.[0]?.value || '$includes';

  const filter = searchText
    ? {
        [labelField]: {
          [operator]: searchText,
        },
      }
    : undefined;

  const response = await apiClient.request({
    url: `/${target}:list`,
    params: {
      page,
      pageSize: DEFAULT_ASSOCIATION_PAGE_SIZE,
      filter,
    },
  });

  return response.data?.data || [];
}

//初始化
AssociationSelectFieldModel.registerFlow({
  key: 'init',
  auto: true,
  sort: 100,
  steps: {
    step1: {
      handler(ctx) {
        ctx.model.onDropdownVisibleChange = (open) => {
          ctx.model.dispatchEvent('dropdownOpen', {
            apiClient: ctx.app.apiClient,
            field: ctx.model.field,
            form: ctx.model.form,
          });
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
// 下拉打开加载第一页数据
AssociationSelectFieldModel.registerFlow({
  key: 'dropdownOpen',
  on: { eventName: 'dropdownOpen' },
  steps: {
    step1: {
      async handler(ctx) {
        ctx.model.optionsLoadState = {
          page: 1,
          pageSize: DEFAULT_ASSOCIATION_PAGE_SIZE,
          hasMore: true,
          loading: false,
        };

        const data = await fetchAssociationItems({ ctx, page: 1 });
        ctx.model.setDataSource(data);
      },
    },
  },
});

// 滚动分页追加
AssociationSelectFieldModel.registerFlow({
  key: 'popupScroll',
  on: { eventName: 'popupScroll' },
  steps: {
    step1: {
      async handler(ctx) {
        const event = ctx.extra?.event;
        if (!event?.target) return;

        const { scrollTop, scrollHeight, clientHeight } = event.target;
        // 只在接近底部时才触发加载
        if (scrollTop + clientHeight < scrollHeight - 20) {
          return;
        }
        const state = (ctx.model.optionsLoadState ||= {
          page: 1,
          pageSize: DEFAULT_ASSOCIATION_PAGE_SIZE,
          hasMore: true,
          loading: false,
        });
        if (state.loading || !state.hasMore) return;
        state.loading = true;
        try {
          const nextPage = state.page + 1;
          const data = await fetchAssociationItems({ ctx, page: nextPage, searchText: state.searchText || '' });
          ctx.model.setDataSource([...ctx.model.getDataSource(), ...data]);
          state.hasMore = data.length === state.pageSize;
          if (state.hasMore) state.page = nextPage;
        } finally {
          state.loading = false;
        }
      },
    },
  },
});

//搜索数据
AssociationSelectFieldModel.registerFlow({
  key: 'search',
  on: { eventName: 'search' },
  steps: {
    step1: {
      async handler(ctx) {
        const searchText = ctx.extra.searchText?.trim();
        ctx.model.optionsLoadState = {
          page: 1,
          pageSize: DEFAULT_ASSOCIATION_PAGE_SIZE,
          hasMore: true,
          loading: false,
          searchText,
        };

        const data = await fetchAssociationItems({ ctx, page: 1, searchText });
        ctx.model.setDataSource(data);
      },
    },
  },
});

const loadTitleFieldOptions = (collectionField, dataSourceManager) => {
  return async (field) => {
    const form = field.form;
    const compile = form?.designable?.compile || ((v) => v);

    const collectionManager = collectionField?.collection?.collectionManager;
    const target = collectionField?.options?.target;
    if (!collectionManager || !target) return;

    const targetCollection = collectionManager.getCollection(target);
    const targetFields = targetCollection?.getFields?.() ?? [];

    field.loading = true;

    const options = targetFields
      .filter((field) => isTitleField(dataSourceManager, field.options))
      .map((field) => ({
        value: field.name,
        label: compile(field.uiSchema?.title) || field.name,
      }));

    field.dataSource = options;
    field.loading = false;
  };
};

// 标题字段设置
AssociationSelectFieldModel.registerFlow({
  key: 'fieldNames',
  auto: true,
  sort: 200,
  steps: {
    fieldNames: {
      title: 'Title field',
      uiSchema: {
        label: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          'x-reactions': ['{{loadTitleFieldOptions(collectionField, dataSourceManager)}}'],
        },
      },
      defaultParams: (ctx) => ({
        label: ctx.model.field.componentProps.fieldNames?.label,
      }),
      handler(ctx, params) {
        ctx.model.flowEngine.flowSettings.registerScopes({
          loadTitleFieldOptions,
          collectionField: ctx.model.collectionField,
          dataSourceManager: ctx.app.dataSourceManager,
        });

        const newFieldNames = {
          ...ctx.model.field.componentProps.fieldNames,
          label: params.label,
        };

        ctx.model.field.setComponentProps({ fieldNames: newFieldNames });
      },
    },
  },
});
