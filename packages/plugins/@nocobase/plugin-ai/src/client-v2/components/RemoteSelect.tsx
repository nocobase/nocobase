/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo, useRef } from 'react';
import { CloseCircleFilled, CloseOutlined } from '@ant-design/icons';
import { Select, Tag, Tooltip, theme, type SelectProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { useRequest } from 'ahooks';
import { useApp } from '@nocobase/client-v2';
import { useT } from '../locale';

type SelectValue = string | number;

type RawOption = Record<string, unknown>;

type ResourceAction = (params?: Record<string, unknown>) => Promise<unknown>;

type Resource = Record<string, unknown>;

type RemoteService = {
  resource?: string;
  action?: string;
  params?: Record<string, unknown>;
  defaultParams?: Record<string, unknown>;
  headers?: Record<string, unknown>;
};

export type RemoteSelectFieldNames = {
  label?: string;
  value?: string;
};

type OptionItem = DefaultOptionType &
  RawOption & {
    label: React.ReactNode;
    value: SelectValue | null;
  };

export type RemoteSelectProps<ValueType = unknown> = Omit<
  SelectProps<ValueType, OptionItem>,
  'loading' | 'mode' | 'options'
> & {
  wait?: number;
  manual?: boolean;
  multiple?: boolean;
  service?: RemoteService;
  request?: (search?: string) => Promise<unknown>;
  fieldNames?: RemoteSelectFieldNames;
  mapOptions?: (option: OptionItem) => OptionItem | null | undefined;
  optionFilter?: (option: RawOption) => boolean;
  toOptionsItem?: (options: OptionItem[]) => OptionItem[];
  onSuccess?: (response: unknown) => void;
  mode?: SelectProps<ValueType, OptionItem>['mode'];
};

const DEFAULT_FIELD_NAMES: Required<RemoteSelectFieldNames> = {
  label: 'label',
  value: 'value',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const readResponseItems = (response: unknown): RawOption[] => {
  if (Array.isArray(response)) {
    return response.filter(isRecord);
  }
  if (!isRecord(response)) {
    return [];
  }
  const data = response.data;
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }
  if (isRecord(data) && Array.isArray(data.data)) {
    return data.data.filter(isRecord);
  }
  return [];
};

const readValueItems = (value: unknown, valueKey: string): RawOption[] => {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values.map((item) => {
    if (isRecord(item)) {
      return item;
    }
    return {
      [valueKey]: item,
      [DEFAULT_FIELD_NAMES.label]: item,
    };
  });
};

const mergeFilter = (searchFilter: Record<string, unknown>, baseFilter: unknown) => {
  if (!baseFilter || (isRecord(baseFilter) && Object.keys(baseFilter).length === 0)) {
    return searchFilter;
  }
  return {
    $and: [searchFilter, baseFilter],
  };
};

const readResourceAction = (resource: Resource, actionName: string): ResourceAction | undefined => {
  const action = resource[actionName];
  return typeof action === 'function' ? (action as ResourceAction) : undefined;
};

const toLabelNode = (label: unknown): React.ReactNode => {
  if (React.isValidElement(label)) {
    return label;
  }
  if (['string', 'number', 'boolean'].includes(typeof label)) {
    return String(label);
  }
  return null;
};

const toOptionValue = (value: unknown): SelectValue | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return null;
};

export function RemoteSelect<ValueType = unknown>(props: RemoteSelectProps<ValueType>) {
  const {
    fieldNames,
    service,
    request,
    wait = 300,
    value,
    defaultValue,
    manual = true,
    multiple,
    mode,
    mapOptions,
    optionFilter,
    toOptionsItem = (options) => options,
    onSuccess,
    popupMatchSelectWidth = false,
    showSearch = true,
    allowClear = true,
    maxTagCount,
    maxTagPlaceholder,
    tagRender,
    onDropdownVisibleChange,
    onSearch,
    style,
    ...selectProps
  } = props;
  const app = useApp();
  const t = useT();
  const { token } = theme.useToken();
  const searchRef = useRef('');
  const firstOpenRef = useRef(false);
  const labelKey = fieldNames?.label ?? DEFAULT_FIELD_NAMES.label;
  const valueKey = fieldNames?.value ?? DEFAULT_FIELD_NAMES.value;
  const selectMode = multiple ? 'multiple' : mode;
  const isMultipleMode = selectMode === 'multiple' || selectMode === 'tags';

  const loadOptions = useCallback(
    async (search?: string) => {
      if (request) {
        const response = await request(search);
        onSuccess?.(response);
        return response;
      }

      if (!service?.resource) {
        return [];
      }

      const actionName = service.action ?? 'list';
      const resource = app.apiClient.resource(service.resource) as Resource;
      const action = readResourceAction(resource, actionName);
      if (!action) {
        return [];
      }

      const searchFilter =
        search && labelKey
          ? {
              [labelKey]: {
                $includes: search,
              },
            }
          : undefined;
      const params: Record<string, unknown> = {
        pageSize: 200,
        ...service.params,
        ...(service.defaultParams ?? {}),
      };
      if (searchFilter) {
        params.filter = mergeFilter(searchFilter, service.params?.filter);
      }

      const response = await action(params);
      onSuccess?.(response);
      return response;
    },
    [app.apiClient, labelKey, onSuccess, request, service],
  );

  const { data, loading, run } = useRequest<unknown, [string | undefined]>(loadOptions, {
    manual,
    debounceWait: wait,
  });

  const options = useMemo(() => {
    const sourceItems = readResponseItems(data);
    const filteredItems = optionFilter ? sourceItems.filter(optionFilter) : sourceItems;
    const valueItems = readValueItems(value ?? defaultValue, valueKey);
    const mergedItems = [...filteredItems];
    for (const valueItem of valueItems) {
      const itemValue = valueItem[valueKey];
      if (itemValue != null && !mergedItems.some((item) => item[valueKey] === itemValue)) {
        mergedItems.push(valueItem);
      }
    }

    const mapped = mergedItems
      .map((item) => {
        const rawLabel = item[labelKey] ?? item[DEFAULT_FIELD_NAMES.label] ?? item[valueKey];
        const label = typeof rawLabel === 'string' ? t(rawLabel) : toLabelNode(rawLabel);
        const option: OptionItem = {
          ...item,
          [labelKey]: label,
          label,
          value: toOptionValue(item[valueKey]),
        };
        return mapOptions ? mapOptions(option) : option;
      })
      .filter((item): item is OptionItem => Boolean(item));

    return toOptionsItem(mapped);
  }, [data, defaultValue, labelKey, mapOptions, optionFilter, t, toOptionsItem, value, valueKey]);

  const handleSearch = (search: string) => {
    searchRef.current = search;
    run(search);
    onSearch?.(search);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      run(searchRef.current || undefined);
      firstOpenRef.current = true;
    }
    onDropdownVisibleChange?.(open);
  };

  return (
    <Select
      {...selectProps}
      mode={selectMode}
      value={value as ValueType}
      defaultValue={defaultValue as ValueType}
      style={{
        width: '100%',
        ...style,
      }}
      popupMatchSelectWidth={popupMatchSelectWidth}
      autoClearSearchValue
      filterOption={false}
      filterSort={null}
      showSearch={showSearch}
      allowClear={
        allowClear === false
          ? false
          : typeof allowClear === 'object'
            ? allowClear
            : {
                clearIcon: <CloseCircleFilled role="button" aria-label="icon-close-select" />,
              }
      }
      optionFilterProp="label"
      onSearch={handleSearch}
      onDropdownVisibleChange={handleOpenChange}
      loading={data === undefined && !firstOpenRef.current ? true : loading}
      options={options}
      maxTagCount={maxTagCount ?? (isMultipleMode ? 'responsive' : undefined)}
      maxTagPlaceholder={
        maxTagPlaceholder ??
        ((omittedValues) => (
          <Tooltip
            title={
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: token.sizeXXS,
                  maxWidth: '100%',
                }}
              >
                {omittedValues.map((item) => (
                  <Tag
                    key={item.value}
                    style={{
                      margin: 0,
                      background: token.colorBgContainer,
                      border: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
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
              background: token.colorBgElevated,
              color: token.colorText,
              padding: token.paddingXS,
              maxWidth: '100%',
            }}
            color={token.colorBgElevated}
            overlayStyle={{
              pointerEvents: 'auto',
              maxWidth: token.screenXS,
            }}
          >
            +{omittedValues.length}...
          </Tooltip>
        ))
      }
      tagRender={
        tagRender ??
        ((tagProps) => (
          <Tag
            role="button"
            aria-label={String(tagProps.label ?? '')}
            closeIcon={<CloseOutlined role="button" aria-label="icon-close-tag" />}
            {...tagProps}
          >
            {tagProps.label}
          </Tag>
        ))
      }
    />
  );
}

export default RemoteSelect;
