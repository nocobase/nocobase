/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RemoteSelect, useCollection } from '@nocobase/client';
import React, { FC, useRef, useState } from 'react';
import { Button, Space, Modal, message, Select, Alert } from 'antd';
import { useFieldSchema } from '@formily/react';
import * as XLSX from 'xlsx';
import { useT } from './locale';

export const MultipleKeywordsInput: FC<any> = (props) => {
  const collection = useCollection();
  const fieldSchema = useFieldSchema();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [columnModal, setColumnModal] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const t = useT();

  const handleImportButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setImportLoading(true);

        // 读取 Excel 文件
        const data = await readExcel(file);
        if (data.length === 0) {
          message.error('Excel 文件为空');
          setImportLoading(false);
          return;
        }

        // 提取所有列名
        const extractedColumns = Object.keys(data[0]);
        setColumns(extractedColumns);
        setExcelData(data);

        // 如果只有一列，直接导入
        if (extractedColumns.length === 1) {
          const keywords = extractKeywordsFromColumn(data, extractedColumns[0]);
          handleImportKeywords(keywords);
        } else {
          // 如果有多列，打开选择对话框
          setColumnModal(true);
        }
      } catch (error) {
        console.error('解析 Excel 文件出错:', error);
        message.error('解析 Excel 文件失败');
      } finally {
        setImportLoading(false);
        // 清空文件输入，以便下次选择同一文件时仍能触发 change 事件
        event.target.value = '';
      }
    }
  };

  // 读取 Excel 文件内容
  const readExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  // 从指定列提取关键词
  const extractKeywordsFromColumn = (data: any[], columnName: string): string => {
    return data
      .map((row) => row[columnName])
      .filter((value) => value !== undefined && value !== null && value !== '')
      .join(',');
  };

  // 从多个列提取关键词
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

    return Array.from(keywordSet).join(',');
  };

  // 处理导入关键词到输入框
  const handleImportKeywords = (keywords: string) => {
    if (!keywords) {
      message.warning('未找到有效关键词');
      return;
    }

    // 将关键词设置到输入框
    if (props.onChange) {
      const keywordArray = keywords.split(',').filter(Boolean);
      props.onChange(keywordArray);
      message.success(`成功导入 ${keywordArray.length} 个关键词`);
    }
  };

  // 处理列选择确认
  const handleColumnSelectConfirm = () => {
    if (selectedColumns.length === 0) {
      message.warning('请至少选择一列');
      return;
    }

    const keywords = extractKeywordsFromColumns(excelData, selectedColumns);
    handleImportKeywords(keywords);
    setColumnModal(false);
  };

  return (
    <>
      <Space.Compact block>
        <RemoteSelect
          mode="tags"
          placeholder="支持输入多个关键词，通过逗号或者换行符分割"
          tokenSeparators={[',', '\n', '，']}
          fieldNames={{
            label: fieldSchema.name as string,
            value: fieldSchema.name as string,
          }}
          service={{
            resource: collection.name,
            action: 'list',
          }}
          {...props}
        />
        <Button onClick={handleImportButtonClick} loading={importLoading}>
          导入 Excel
        </Button>
      </Space.Compact>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".xlsx,.xls"
        onChange={handleFileChange}
      />

      {/* 列选择对话框 */}
      <Modal
        title="选择要导入的 Excel 列"
        open={columnModal}
        onOk={handleColumnSelectConfirm}
        onCancel={() => setColumnModal(false)}
        okText="确认"
        cancelText="取消"
      >
        <Alert
          type="info"
          style={{ marginBottom: '10px', whiteSpace: 'pre-line', padding: '4px 8px' }}
          description={t('tips')}
        />
        <Select
          mode="multiple"
          value={selectedColumns}
          onChange={(values) => setSelectedColumns(values)}
          style={{ width: '100%' }}
          placeholder="请选择要导入的列"
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
