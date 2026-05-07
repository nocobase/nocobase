/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Cascader as AntdCascader } from 'antd';
import { isBoolean, omit } from 'lodash';
import { FieldModel, useAPIClient, useRequest } from '@nocobase/client';
import { EditableItemModel } from '@nocobase/flow-engine';

const ChinaRegionCascader: React.FC<any> = (props) => {
  const {
    value,
    onChange,
    maxLevel = 3,
    changeOnSelectLast,
    labelInValue,
    fieldNames = {
      label: 'name',
      value: 'code',
      children: 'children',
    },
    multiple, // 过滤掉，不支持多选
    ...restProps
  } = props;

  const api = useAPIClient();
  // Load initial provinces data
  const {
    data: initialData,
    loading,
    run,
  } = useRequest(
    {
      resource: 'chinaRegions',
      action: 'list',
      params: {
        sort: 'code',
        paginate: false,
        filter: {
          level: 1,
        },
      },
    },
    {
      manual: true,
    },
  );

  // Manage cascader options state
  const [options, setOptions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if ((initialData as any)?.data) {
      const processed = (initialData as any).data.map((item) => ({
        ...item,
        isLeaf: maxLevel === 1,
      }));
      setOptions(processed);
    }
  }, [initialData, maxLevel]);

  // Load data on dropdown open
  const handleDropdownVisibleChange = React.useCallback(
    (visible: boolean) => {
      if (visible && options.length === 0) {
        run();
      }
    },
    [options.length, run],
  );

  // Load children on expand
  const loadData = React.useCallback(
    (selectedOptions: any[]) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      if (targetOption?.children?.length > 0) {
        return;
      }

      targetOption.loading = true;

      api
        .resource('chinaRegions')
        .list({
          sort: 'code',
          paginate: false,
          filter: {
            parentCode: targetOption.code,
          },
        })
        .then(({ data }) => {
          targetOption.loading = false;
          targetOption.children =
            data?.data?.map((item) => ({
              ...item,
              isLeaf: maxLevel <= item.level,
            })) || [];
          // Use functional update to avoid dependency on options
          setOptions((prevOptions) => [...prevOptions]);
        })
        .catch((e) => {
          console.error(e);
          targetOption.loading = false;
        });
    },
    [api, maxLevel], // Removed options dependency
  );

  // Convert value to array format for Cascader
  const toValue = React.useCallback(() => {
    if (!value) return undefined;
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((item) => {
      if (typeof item === 'object') {
        return item[fieldNames.value];
      }
      return item;
    });
  }, [value, fieldNames.value]);

  // Custom display render to show labels from value when options not loaded
  const displayRender = React.useCallback(
    (labels: string[], selectedOptions: any[]) => {
      if (!value) return labels.join(' / ');

      const valueArr = Array.isArray(value) ? value : [value];

      // Sort value objects by level to match cascader hierarchy
      const sortedValues = valueArr
        .filter((v) => typeof v === 'object')
        .sort((a, b) => (a.level || 0) - (b.level || 0));

      return labels
        .map((label, index) => {
          // If selectedOptions has the item, use it
          if (selectedOptions[index]) {
            return selectedOptions[index][fieldNames.label];
          }

          // Otherwise, get from sorted value objects by index
          if (sortedValues[index] && sortedValues[index][fieldNames.label]) {
            return sortedValues[index][fieldNames.label];
          }

          return label;
        })
        .join(' / ');
    },
    [value, fieldNames.label],
  );

  // Handle onChange
  const handleChange = React.useCallback(
    (newValue: any, selectedOptions: any[]) => {
      if (newValue && labelInValue) {
        onChange?.(selectedOptions.map((option) => omit(option, [fieldNames.children])) || null);
      } else {
        onChange?.(newValue || null);
      }
    },
    [onChange, labelInValue, fieldNames.children],
  );

  return (
    <AntdCascader
      {...restProps}
      loading={loading}
      options={options}
      value={toValue()}
      loadData={loadData}
      fieldNames={fieldNames}
      displayRender={displayRender}
      multiple={false}
      changeOnSelect={isBoolean(changeOnSelectLast) ? !changeOnSelectLast : restProps.changeOnSelect}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      onChange={handleChange}
    />
  );
};

export class ChinaRegionFieldModel extends FieldModel {
  render() {
    return <ChinaRegionCascader {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('ChinaRegionFieldModel', ['chinaRegion'], { isDefault: true });
