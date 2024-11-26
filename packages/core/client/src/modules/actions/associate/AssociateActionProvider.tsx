/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useContext } from 'react';
import { RecordPickerProvider, RecordPickerContext } from '../../../schema-component/antd/record-picker';
import { SchemaComponentOptions, useActionContext, useBlockRequestContext, useCollection } from '../../../';
import { useField } from '@formily/react';
import { differenceBy, unionBy } from 'lodash';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';
import { flatData } from '../../../schema-component/antd/association-field/util';

const useTableSelectorProps = () => {
  const field: any = useField();
  const { setSelectedRows } = useContext(RecordPickerContext);
  const { onRowSelectionChange, rowKey = 'id', ...others } = useTsp();
  return {
    ...others,
    rowKey,
    rowSelection: {
      type: 'checkbox',
    },
    onRowSelectionChange(selectedRowKeys) {
      const scopeRows = flatData(field.value) || [];
      const unionSelectedRows = unionBy(scopeRows, selectedRowKeys);
      const unionSelectedRowKeys = selectedRowKeys.map((item) => item[rowKey]);
      setSelectedRows?.(unionSelectedRows);
      onRowSelectionChange?.(unionSelectedRowKeys, unionSelectedRows);
    },
  };
};

export const AssociateActionProvider = (props) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const collection = useCollection();
  const { resource, service, block, __parent } = useBlockRequestContext();

  const pickerProps = {
    size: 'small',
    onChange: props?.onChange,
    selectedRows,
    setSelectedRows,
  };
  const usePickActionProps = () => {
    const { selectedRows } = useContext(RecordPickerContext);
    const { setVisible, setSubmitted, setFormValueChanged } = useActionContext();

    return {
      async onClick(e?, callBack?) {
        await resource.add({
          values: selectedRows,
        });
        if (callBack) {
          callBack?.();
        }
        setVisible?.(false);
        setSubmitted?.(true);
        if (block && block !== 'TableField') {
          __parent?.service?.refresh?.();
          setVisible?.(false);
          setFormValueChanged?.(false);
        }
      },
    };
  };
  const getFilter = () => {
    const targetKey = collection?.filterTargetKey || 'id';
    if (service.data?.data) {
      const list = service.data?.data.map((option) => option[targetKey]).filter(Boolean);
      const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
      return filter;
    }
    return {};
  };
  return (
    <RecordPickerProvider {...pickerProps}>
      <SchemaComponentOptions scope={{ useTableSelectorProps, usePickActionProps }}>
        <TableSelectorParamsProvider params={{ filter: getFilter() }}>{props.children}</TableSelectorParamsProvider>
      </SchemaComponentOptions>
    </RecordPickerProvider>
  );
};
