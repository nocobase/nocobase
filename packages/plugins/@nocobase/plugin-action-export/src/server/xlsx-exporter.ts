/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Field, FindOptions, Model } from '@nocobase/database';
import XLSX from 'xlsx';
import { deepGet } from './utils/deep-get';

type ExportColumn = {
  dataIndex: Array<string>;
  defaultTitle: string;
};

type ExportOptions = {
  collection: Collection;
  columns: Array<ExportColumn>;
  findOptions?: FindOptions;
  chunkSize?: number;
};

class XlsxExporter {
  constructor(private options: ExportOptions) {}

  private getAppendOptionsFromColumns() {
    return this.options.columns.filter((col) => col.dataIndex.length > 1).map((col) => col.dataIndex.join('.'));
  }

  private getFindOptions() {
    const { findOptions = {} } = this.options;
    const appendOptions = this.getAppendOptionsFromColumns();

    if (appendOptions.length) {
      return {
        ...findOptions,
        appends: appendOptions,
      };
    }

    return findOptions;
  }

  async run(): Promise<XLSX.WorkBook> {
    const { collection, columns, chunkSize } = this.options;

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.sheet_new();

    // write headers
    XLSX.utils.sheet_add_aoa(worksheet, [this.renderHeaders()], {
      origin: 'A1',
    });

    let startRowNumber = 2;

    await collection.repository.chunk({
      ...this.getFindOptions(),
      chunkSize: chunkSize || 1000,
      callback: async (rows, options) => {
        const chunkData = rows.map((r) => {
          return columns.map((col) => {
            return this.renderCellValue(r, col);
          });
        });

        XLSX.utils.sheet_add_aoa(worksheet, chunkData, {
          origin: `A${startRowNumber}`,
        });

        startRowNumber += rows.length;
      },
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    return workbook;
  }

  private findFieldByDataIndex(dataIndex: Array<string>): Field {
    const { collection } = this.options;
    const field = collection.getField(dataIndex[0]);
    if (dataIndex.length > 1) {
      let association;

      for (let i = 0; i < dataIndex.length - 1; i++) {
        const isLast = i === dataIndex.length - 1;

        if (isLast) {
          return association.target.getField(dataIndex[i]);
        }

        association = collection.getField(dataIndex[i]);
      }
    }

    return field;
  }

  private renderHeaders() {
    return this.options.columns.map((col) => {
      const field = this.findFieldByDataIndex(col.dataIndex);
      return field.options.title || col.defaultTitle;
    });
  }

  private renderCellValue(rowData: Model, column: ExportColumn) {
    const { dataIndex } = column;
    rowData = rowData.toJSON();
    const value = rowData[dataIndex[0]];

    if (dataIndex.length > 1) {
      const deepValue = deepGet(rowData, dataIndex);

      if (Array.isArray(deepValue)) {
        return deepValue.join(',');
      }

      return deepValue;
    }

    const db = this.options.collection.db;
    if (!db) {
      return value;
    }

    const field = this.findFieldByDataIndex(dataIndex);
    const fieldOptions = field.options;
    const interfaceName = fieldOptions['interface'];

    if (!interfaceName) {
      return value;
    }

    const InterfaceClass = db.interfaceManager.getInterfaceType(interfaceName);
    const interfaceInstance = new InterfaceClass(fieldOptions);
    console.log({ value, rowData, dataIndex });
    return interfaceInstance.toString(value, {});
  }
}

export default XlsxExporter;
