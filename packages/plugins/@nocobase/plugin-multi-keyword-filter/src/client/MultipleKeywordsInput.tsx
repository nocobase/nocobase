/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useLazy } from '@nocobase/client';
import { Alert, Button, message, Modal, Select, Space, Tooltip, Typography } from 'antd';
import React, { FC, useRef, useState } from 'react';
import { useT } from './locale';
import { UploadOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { useField } from '@formily/react';
import Item from 'antd/es/list/Item';

const tokenSeparator = '\n';

const trim = (str: string) => (_.isString(str) ? str.trim() : str);

export const MultipleKeywordsInput: FC<{
  fieldInterface: string;
  value?: string[];
  onChange?: (value: string[], option?: any) => void;
  style?: React.CSSProperties;
}> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [columnModal, setColumnModal] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const t = useT();
  const XLSX = useLazy<typeof import('xlsx')>(
    () => import('xlsx'),
    (module) => module,
  );
  const field = useField<any>();

  // remove validator to prevent error
  if (field?.validator) {
    field.validator = null;
  }

  const onChange = (...arg: [any, any]) => {
    if (['integer', 'number'].includes(props.fieldInterface)) {
      arg[0] = arg[0]
        .map(trim)
        .map((item: string) => parseInt(item, 10))
        .filter((item: number) => !isNaN(item));
    }
    if (['percent'].includes(props.fieldInterface)) {
      arg[0] = arg[0]
        .map(trim)
        .map((item: string) => parseFloat(item))
        .filter((item: number) => !isNaN(item));
    }

    if (props.onChange) {
      arg[0] = arg[0].map(trim).filter((item: string) => item !== '');
      props.onChange(...arg);
    }
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setImportLoading(true);

        // Read Excel file
        const data = await readExcel(file);
        if (data.length === 0) {
          message.error(t('excelFileEmpty'));
          setImportLoading(false);
          return;
        }

        // Extract all column names
        const extractedColumns = Object.keys(data[0]);
        setColumns(extractedColumns);
        setExcelData(data);

        // If there is only one column, import directly
        if (extractedColumns.length === 1) {
          const keywords = extractKeywordsFromColumn(data, extractedColumns[0]);
          handleImportKeywords(keywords);
        } else {
          // If there are multiple columns, open selection dialog
          setColumnModal(true);
        }
      } catch (error) {
        console.error(t('errorParsingExcel'), error);
        message.error(t('failedToParseExcel'));
      } finally {
        setImportLoading(false);
        // Clear file input to enable trigger of change event when selecting the same file again
        event.target.value = '';
      }
    }
  };

  // Read Excel file content
  const readExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Extract keywords from specified column
  const extractKeywordsFromColumn = (data: any[], columnName: string): string => {
    return data
      .map((row) => row[columnName])
      .filter((value) => value !== undefined && value !== null && value !== '')
      .join(tokenSeparator);
  };

  // Extract keywords from multiple columns
  const extractKeywordsFromColumns = (data: any[], columnNames: string[]): string => {
    const keywordSet = new Set<string>();

    data.forEach((row) => {
      columnNames.forEach((column) => {
        const value = row[column];
        if (value !== undefined && value !== null && value !== '') {
          keywordSet.add(value.toString());
        }
      });
    });

    return Array.from(keywordSet).join(tokenSeparator);
  };

  // Handle importing keywords into the input field
  const handleImportKeywords = (keywords: string) => {
    if (!keywords) {
      message.warning(t('noValidKeywords'));
      return;
    }

    // Set keywords to the input field
    if (props.onChange) {
      const keywordArray = keywords.split(tokenSeparator).filter(Boolean);
      props.onChange(keywordArray);
      message.success(t('importSuccess', { count: keywordArray.length }));
    }
  };

  // Handle column selection confirmation
  const handleColumnSelectConfirm = () => {
    if (selectedColumns.length === 0) {
      message.warning(t('selectAtLeastOneColumn'));
      return;
    }

    const keywords = extractKeywordsFromColumns(excelData, selectedColumns);
    handleImportKeywords(keywords);
    setColumnModal(false);
  };

  return (
    <>
      <Space.Compact block>
        <Select
          mode="tags"
          tokenSeparators={[tokenSeparator]}
          placeholder={t('keywordsInputPlaceholder')}
          allowClear
          suffixIcon={null}
          maxTagCount="responsive"
          open={_.isEmpty(props.value) ? false : undefined}
          {...props}
          onChange={onChange}
        />
        <Tooltip title={t('importExcel')}>
          <Button onClick={handleImportButtonClick} loading={importLoading} icon={<UploadOutlined />} />
        </Tooltip>
      </Space.Compact>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleFileChange}
      />

      {/* Column selection dialog */}
      <Modal
        title={t('selectExcelColumns')}
        open={columnModal}
        onOk={handleColumnSelectConfirm}
        onCancel={() => setColumnModal(false)}
        okText={t('confirm')}
        cancelText={t('cancel')}
      >
        <Alert
          type="info"
          style={{ marginBottom: '10px', whiteSpace: 'pre-line', padding: '4px 8px' }}
          description={
            <Typography>
              <ul style={{ marginBottom: 0 }}>
                {t('tips')
                  .split('\n')
                  .map((item) => (
                    <li key={item}>{item}</li>
                  ))}
              </ul>
            </Typography>
          }
        />
        <Select
          mode="multiple"
          value={selectedColumns}
          onChange={(values) => setSelectedColumns(values)}
          style={{ width: '100%' }}
          placeholder={t('selectColumnsPlaceholder')}
        >
          {columns.map((column) => (
            <Select.Option key={column} value={column}>
              {column}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </>
  );
};
