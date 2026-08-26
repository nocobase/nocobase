/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cascader as AntdCascader } from 'antd';
import { useRequest } from 'ahooks';
import { isBoolean, omit } from 'lodash';
import React from 'react';
import { FieldModel } from '@nocobase/client-v2';
import { EditableItemModel, useFlowContext } from '@nocobase/flow-engine';
import { error } from '@nocobase/utils/client';
import { tExpr } from '../locale';
import { CHINA_REGION_FIELD_NAMES, CHINA_REGION_TARGET } from '../chinaRegionConstants';

const ChinaRegionCascader: React.FC<any> = (props) => {
  const {
    value,
    onChange,
    maxLevel = 3,
    changeOnSelectLast,
    labelInValue,
    fieldNames = CHINA_REGION_FIELD_NAMES,
    multiple,
    ...restProps
  } = props;
  const { api } = useFlowContext();
  const [options, setOptions] = React.useState<any[]>([]);

  const {
    data: initialData,
    loading,
    run,
  } = useRequest(
    async () => {
      const response = await api.resource(CHINA_REGION_TARGET).list({
        sort: 'code',
        paginate: false,
        filter: {
          level: 1,
        },
      });
      return response?.data?.data || [];
    },
    {
      manual: true,
      onSuccess(data) {
        setOptions(
          data.map((item) => ({
            ...item,
            isLeaf: maxLevel === 1,
          })),
        );
      },
    },
  );

  React.useEffect(() => {
    if (!initialData) {
      return;
    }
    setOptions(
      initialData.map((item) => ({
        ...item,
        isLeaf: maxLevel === 1,
      })),
    );
  }, [initialData, maxLevel]);

  const handleDropdownVisibleChange = React.useCallback(
    (visible: boolean) => {
      if (visible && options.length === 0) {
        run();
      }
    },
    [options.length, run],
  );

  const loadData = React.useCallback(
    async (selectedOptions: any[]) => {
      const targetOption = selectedOptions[selectedOptions.length - 1];
      if (!targetOption || targetOption?.children?.length > 0) {
        return;
      }

      targetOption.loading = true;

      try {
        const response = await api.resource(CHINA_REGION_TARGET).list({
          sort: 'code',
          paginate: false,
          filter: {
            parentCode: targetOption.code,
          },
        });

        targetOption.children =
          response?.data?.data?.map((item) => ({
            ...item,
            isLeaf: maxLevel <= item.level,
          })) || [];
      } catch (err) {
        error(err);
      } finally {
        targetOption.loading = false;
        setOptions((prevOptions) => [...prevOptions]);
      }
    },
    [api, maxLevel],
  );

  const toValue = React.useMemo(() => {
    if (!value) {
      return undefined;
    }
    const arr = Array.isArray(value) ? value : [value];
    return arr.map((item) => {
      if (typeof item === 'object') {
        return item[fieldNames.value];
      }
      return item;
    });
  }, [fieldNames.value, value]);

  const displayRender = React.useCallback(
    (labels: string[], selectedOptions: any[]) => {
      if (!value) {
        return labels.join(' / ');
      }

      const valueArr = Array.isArray(value) ? value : [value];
      const sortedValues = valueArr
        .filter((item) => typeof item === 'object')
        .sort((left, right) => (left.level || 0) - (right.level || 0));

      return labels
        .map((label, index) => {
          if (selectedOptions[index]) {
            return selectedOptions[index][fieldNames.label];
          }
          if (sortedValues[index]?.[fieldNames.label]) {
            return sortedValues[index][fieldNames.label];
          }
          return label;
        })
        .join(' / ');
    },
    [fieldNames.label, value],
  );

  const handleChange = React.useCallback(
    (newValue: any, selectedOptions: any[]) => {
      if (newValue && labelInValue) {
        onChange?.(selectedOptions.map((option) => omit(option, [fieldNames.children])) || null);
        return;
      }
      onChange?.(newValue || null);
    },
    [fieldNames.children, labelInValue, onChange],
  );

  return (
    <AntdCascader
      {...restProps}
      loading={loading}
      options={options}
      value={toValue}
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

ChinaRegionFieldModel.define({
  label: tExpr('China region'),
});

EditableItemModel.bindModelToInterface('ChinaRegionFieldModel', ['chinaRegion'], { isDefault: true });
