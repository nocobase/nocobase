/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { connect, useExpressionScope, useField, useFieldSchema } from '@formily/react';
import { Upload as AntdUpload } from 'antd';
import cls from 'classnames';
import { differenceBy, unionBy } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AttachmentList,
  FormProvider,
  RecordPickerContext,
  RecordPickerProvider,
  SchemaComponentOptions,
  Uploader,
  useActionContext,
  useDesignable,
} from '../..';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';
import {
  CollectionProvider_deprecated,
  useCollection_deprecated,
  useCollectionManager_deprecated,
} from '../../../collection-manager';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { useCompile } from '../../hooks';
import { ActionContextProvider } from '../action';
import { EllipsisWithTooltip } from '../input';
import { Upload } from '../upload';
import { useStyles } from '../upload/style';
import { useFieldNames, useInsertSchema } from './hooks';
import schema from './schema';
import { flatData, getLabelFormatValue, useLabelUiSchema } from './util';

const useTableSelectorProps = () => {
  const field: any = useField();
  const {
    multiple,
    options = [],
    setSelectedRows,
    selectedRows: rcSelectRows = [],
    onChange,
  } = useContext(RecordPickerContext);
  const { onRowSelectionChange, rowKey = 'id', ...others } = useTsp();
  const { setVisible } = useActionContext();
  return {
    ...others,
    rowKey,
    rowSelection: {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys: rcSelectRows
        ?.filter((item) => options.every((row) => row[rowKey] !== item[rowKey]))
        .map((item) => item[rowKey]),
    },
    onRowSelectionChange(selectedRowKeys, selectedRows) {
      if (multiple) {
        const scopeRows = flatData(field.value) || [];
        const allSelectedRows = rcSelectRows || [];
        const otherRows = differenceBy(allSelectedRows, scopeRows, rowKey);
        const unionSelectedRows = unionBy(otherRows, selectedRows, rowKey);
        const unionSelectedRowKeys = unionSelectedRows.map((item) => item[rowKey]);
        setSelectedRows?.(unionSelectedRows);
        onRowSelectionChange?.(unionSelectedRowKeys, unionSelectedRows);
      } else {
        setSelectedRows?.(selectedRows);
        onRowSelectionChange?.(selectedRowKeys, selectedRows);
        onChange(selectedRows?.[0] || null);
        setVisible(false);
      }
    },
  };
};

function FileSelector(props) {
  const { disabled, multiple, value, onChange, action, onSelect, quickUpload, selectFile, ...other } = props;
  const { wrapSSR, hashId, componentCls: prefixCls } = useStyles();
  const { useFileCollectionStorageRules, useAttachmentFieldProps } = useExpressionScope();
  const { t } = useTranslation();
  const rules = useFileCollectionStorageRules();
  const attachmentFieldProps = useAttachmentFieldProps();
  // 兼容旧版本
  const showSelectButton = selectFile === undefined && quickUpload === undefined;
  return wrapSSR(
    <div className={cls(`${prefixCls}-wrapper`, `${prefixCls}-picture-card-wrapper`, 'nb-upload', hashId)}>
      <div className={cls(`${prefixCls}-list`, `${prefixCls}-list-picture-card`)}>
        <AttachmentList disabled={disabled} multiple={multiple} value={value} onChange={onChange} {...other} />
        {showSelectButton ? (
          <div className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}>
            <AntdUpload disabled={disabled} multiple={multiple} listType={'picture-card'} showUploadList={false}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={onSelect}
              >
                <PlusOutlined />
                {t('Select')}
              </div>
            </AntdUpload>
          </div>
        ) : null}
        {quickUpload ? (
          <Uploader
            {...attachmentFieldProps}
            value={value}
            multiple={multiple}
            // onRemove={handleRemove}
            onChange={onChange}
            action={action}
            rules={rules}
            disabled={disabled}
            {...other}
          />
        ) : null}
        {selectFile && (multiple || !value) ? (
          <div className={cls(`${prefixCls}-list-picture-card-container`, `${prefixCls}-list-item-container`)}>
            <AntdUpload disabled={disabled} multiple={multiple} listType={'picture-card'} showUploadList={false}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={onSelect}
              >
                <PlusOutlined />
                {t('Select')}
              </div>
            </AntdUpload>
          </div>
        ) : null}
      </div>
    </div>,
  );
}

const InternalFileManager = (props) => {
  const { value, multiple, onChange, ...others } = props;
  const fieldSchema = useFieldSchema();
  const [visibleSelector, setVisibleSelector] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const insertSelector = useInsertSchema('Selector');
  const fieldNames = useFieldNames(props);
  const { designable } = useDesignable();
  const field: any = useField();
  const [options, setOptions] = useState([]);
  const { getField } = useCollection_deprecated();
  const collectionField = getField(field.props.name);
  const labelUiSchema = useLabelUiSchema(collectionField?.target, fieldNames?.label || 'label');
  const compile = useCompile();
  const { modalProps } = useActionContext();
  const handleSelect = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    if (designable) {
      insertSelector(schema.Selector);
    } else {
      const selectSchema = fieldSchema.reduceProperties((buf, s) => {
        if (s['x-component'] === 'AssociationField.Selector') {
          return s;
        }
        return buf;
      }, null);
      if (!selectSchema) {
        fieldSchema.addProperty('selector', schema.Selector);
      }
    }
    setVisibleSelector(true);
    setSelectedRows([]);
  };
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      const opts = (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean).map((option) => {
        const label = option[fieldNames.label];
        return {
          ...option,
          [fieldNames.label]: getLabelFormatValue(compile(labelUiSchema), compile(label)),
        };
      });
      setOptions(opts);
    } else {
      setOptions([]);
    }
  }, [value, fieldNames?.label]);

  const pickerProps = {
    size: 'small',
    fieldNames,
    multiple: ['o2m', 'm2m', 'mbm'].includes(collectionField?.interface) && multiple,
    association: {
      target: collectionField?.target,
    },
    options,
    onChange: props?.onChange,
    selectedRows,
    setSelectedRows,
    collectionField,
  };
  const usePickActionProps = () => {
    const { setVisible } = useActionContext();
    const { multiple, selectedRows, onChange, options, collectionField } = useContext(RecordPickerContext);
    return {
      onClick() {
        if (multiple) {
          onChange(unionBy(selectedRows, options, collectionField?.targetKey || 'id'));
        } else {
          onChange(selectedRows?.[0] || null);
        }
        setVisible(false);
      },
    };
  };
  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <FileSelector
        {...others}
        value={multiple ? options : options?.[0]}
        multiple={multiple}
        quickUpload={fieldSchema['x-component-props']?.quickUpload !== false}
        selectFile={fieldSchema['x-component-props']?.selectFile !== false}
        action={`${collectionField?.target}:create`}
        onSelect={handleSelect}
        onChange={onChange}
      />
      <ActionContextProvider
        value={{
          openMode: 'drawer',
          visible: visibleSelector,
          setVisible: setVisibleSelector,
          modalProps: {
            getContainer: others?.getContainer || modalProps?.getContainer,
          },
          formValueChanged: false,
        }}
      >
        <RecordPickerProvider {...pickerProps}>
          <CollectionProvider_deprecated name={collectionField?.target}>
            <FormProvider>
              <TableSelectorParamsProvider params={{}}>
                <SchemaComponentOptions scope={{ usePickActionProps, useTableSelectorProps }}>
                  <NocoBaseRecursionField
                    onlyRenderProperties
                    basePath={field.address}
                    schema={fieldSchema}
                    filterProperties={(s) => {
                      return s['x-component'] === 'AssociationField.Selector';
                    }}
                  />
                </SchemaComponentOptions>
              </TableSelectorParamsProvider>
            </FormProvider>
          </CollectionProvider_deprecated>
        </RecordPickerProvider>
      </ActionContextProvider>
    </div>
  );
};

const FileManageReadPretty = connect((props) => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection_deprecated();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema['x-collection-field']);
  return (
    <EllipsisWithTooltip ellipsis>{collectionField ? <Upload.ReadPretty {...props} /> : null}</EllipsisWithTooltip>
  );
});

export { FileManageReadPretty, FileSelector, InternalFileManager };
