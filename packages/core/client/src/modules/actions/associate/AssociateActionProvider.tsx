/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useContext, useEffect } from 'react';
import { RecordPickerProvider, RecordPickerContext } from '../../../schema-component/antd/record-picker';
import {
  SchemaComponentOptions,
  useActionContext,
  useBlockRequestContext,
  useCollection,
  ActionContextProvider,
  useOpenModeContext,
} from '../../../';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';

const useTableSelectorProps = () => {
  const { setSelectedRows } = useContext(RecordPickerContext);
  const { onRowSelectionChange, rowKey = 'id', ...others } = useTsp();
  return {
    ...others,
    rowKey,
    rowSelection: {
      type: 'checkbox',
    },
    onRowSelectionChange(selectedRowKeys, selectedRows) {
      setSelectedRows?.(selectedRowKeys);
      onRowSelectionChange?.(selectedRowKeys, selectedRows);
    },
  };
};

export const AssociateActionProvider = (props) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const collection = useCollection();
  const { resource, block, __parent, service } = useBlockRequestContext();
  const actionCtx = useActionContext();
  const { isMobile } = useOpenModeContext() || {};
  const [associationData, setAssociationData] = useState([]);
  const { data } = service || {};
  useEffect(() => {
    resource
      ?.list?.({
        paginate: false,
      })
      .then((res) => {
        setAssociationData(res.data?.data || []);
      });
  }, [resource, data?.meta.count]);

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
    if (associationData) {
      const list = associationData.map((option) => option[targetKey]).filter(Boolean);
      const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
      return filter;
    }
    return {};
  };

  return (
    <ActionContextProvider
      value={{
        ...actionCtx,
        openMode: isMobile ? 'drawer' : actionCtx.openMode,
      }}
    >
      <RecordPickerProvider {...pickerProps}>
        <SchemaComponentOptions scope={{ useTableSelectorProps, usePickActionProps }}>
          <TableSelectorParamsProvider params={{ filter: getFilter() }}>{props.children}</TableSelectorParamsProvider>
        </SchemaComponentOptions>
      </RecordPickerProvider>
    </ActionContextProvider>
  );
};
