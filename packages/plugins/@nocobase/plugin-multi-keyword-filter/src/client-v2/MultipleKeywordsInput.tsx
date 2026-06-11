/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import { Alert, Button, message, Modal, Select, Space, Tooltip, Typography } from 'antd';
import React, { FC, useRef, useState } from 'react';
import { normalizeKeywords, type KeywordValue } from '../shared/normalizeKeywords';
import { useT } from './locale';

const tokenSeparator = '\n';

type ExcelRow = Record<string, unknown>;
type XlsxModule = typeof import('xlsx');

export { normalizeKeywords };

export const MultipleKeywordsInput: FC<{
  fieldInterface: string;
  value?: KeywordValue[];
  onChange?: (value: KeywordValue[], option?: unknown) => void;
  style?: React.CSSProperties;
}> = (props) => {
  const { fieldInterface, ...selectProps } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [columnModal, setColumnModal] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const t = useT();

  const emitChange = (values: KeywordValue[], option?: unknown) => {
    props.onChange?.(normalizeKeywords(values, fieldInterface), option);
  };

  const onChange = (values: KeywordValue[], option?: unknown) => {
    emitChange(values, option);
  };

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportLoading(true);
      const XLSX = await import('xlsx');
      const data = await readExcel(file, XLSX);
      if (data.length === 0) {
        message.error(t('excelFileEmpty'));
        return;
      }

      const extractedColumns = Object.keys(data[0]);
      setColumns(extractedColumns);
      setExcelData(data);

      if (extractedColumns.length === 1) {
        const keywords = extractKeywordsFromColumn(data, extractedColumns[0]);
        handleImportKeywords(keywords);
      } else {
        setColumnModal(true);
      }
    } catch (error) {
      console.error(t('errorParsingExcel'), error);
      message.error(t('failedToParseExcel'));
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };

  const readExcel = (file: File, XLSX: XlsxModule): Promise<ExcelRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: '' });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const extractKeywordsFromColumn = (data: ExcelRow[], columnName: string): string => {
    return data
      .map((row) => row[columnName])
      .filter((value) => value !== undefined && value !== null && value !== '')
      .join(tokenSeparator);
  };

  const extractKeywordsFromColumns = (data: ExcelRow[], columnNames: string[]): string => {
    const keywordSet = new Set<string>();

    data.forEach((row) => {
      columnNames.forEach((column) => {
        const value = row[column];
        if (value !== undefined && value !== null && value !== '') {
          keywordSet.add(String(value));
        }
      });
    });

    return Array.from(keywordSet).join(tokenSeparator);
  };

  const handleImportKeywords = (keywords: string) => {
    if (!keywords) {
      message.warning(t('noValidKeywords'));
      return;
    }

    const keywordArray = keywords.split(tokenSeparator).filter(Boolean);
    emitChange(keywordArray);
    message.success(t('importSuccess', { count: keywordArray.length }));
  };

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
          open={!selectProps.value?.length ? false : undefined}
          {...selectProps}
          onChange={onChange}
        />
        <Tooltip title={t('importExcel')}>
          <Button onClick={handleImportButtonClick} loading={importLoading} icon={<UploadOutlined />} />
        </Tooltip>
      </Space.Compact>
      <input type="file" ref={fileInputRef} hidden accept=".xlsx,.xls" onChange={handleFileChange} />

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
          description={
            <Typography>
              <ul>
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
          onChange={(values: string[]) => setSelectedColumns(values)}
          placeholder={t('selectColumnsPlaceholder')}
          options={columns.map((column) => ({ label: column, value: column }))}
        />
      </Modal>
    </>
  );
};
