/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FindOptions,
  ICollection,
  ICollectionManager,
  IField,
  IModel,
  IRelationField,
} from '@nocobase/data-source-manager';

import XLSX from 'xlsx';
import { deepGet } from './utils/deep-get';
import { NumberField } from '@nocobase/database';

type ExportColumn = {
  dataIndex: Array<string>;
  title?: string;
  defaultTitle: string;
};

type ExportOptions = {
  collectionManager: ICollectionManager;
  collection: ICollection;
  columns: Array<ExportColumn>;
  findOptions?: FindOptions;
  chunkSize?: number;
};

class XlsxExporter {
  /**
   * You can adjust the maximum number of exported rows based on business needs and system
   * available resources. However, please note that you need to fully understand the risks
   * after the modification. Increasing the maximum number of rows that can be exported may
   * increase system resource usage, leading to increased processing delays for other
   * requests, or even server processes being recycled by the operating system.
   *
   * 您可以根据业务需求和系统可用资源等参数，调整最大导出数量的限制。但请注意，您需要充分了解修改之后的风险，
   * 增加最大可导出的行数可能会导致系统资源占用率升高，导致其他请求处理延迟增加、无法处理、甚至
   * 服务端进程被操作系统回收等问题。
   */
  limit = process.env['EXPORT_LIMIT'] ? parseInt(process.env['EXPORT_LIMIT']) : 2000;

  constructor(private options: ExportOptions) {}

  async run(ctx?): Promise<XLSX.WorkBook> {
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
      chunkSize: chunkSize || 200,
      callback: async (rows, options) => {
        const chunkData = rows.map((r) => {
          return columns.map((col) => {
            return this.renderCellValue(r, col, ctx);
          });
        });

        XLSX.utils.sheet_add_aoa(worksheet, chunkData, {
          origin: `A${startRowNumber}`,
        });

        startRowNumber += rows.length;

        await new Promise((resolve) => {
          setTimeout(resolve, 50);
        });
      },
    });

    for (const col of columns) {
      const field = this.findFieldByDataIndex(col.dataIndex);
      if (field instanceof NumberField) {
        // set column cell type to number
        const colIndex = columns.indexOf(col);
        const cellRange = XLSX.utils.decode_range(worksheet['!ref']);

        for (let r = 1; r <= cellRange.e.r; r++) {
          const cell = worksheet[XLSX.utils.encode_cell({ c: colIndex, r })];
          // if cell and cell.v is a number, set cell.t to 'n'
          if (cell && typeof cell.v === 'number') {
            cell.t = 'n';
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    return workbook;
  }

  private getAppendOptionsFromColumns() {
    return this.options.columns
      .map((col) => {
        if (col.dataIndex.length > 1) {
          return col.dataIndex.join('.');
        }

        const field = this.options.collection.getField(col.dataIndex[0]);

        if (field.isRelationField()) {
          return col.dataIndex[0];
        }

        return null;
      })
      .filter(Boolean);
  }

  private getFindOptions() {
    const { findOptions = {} } = this.options;

    findOptions.limit = this.limit;

    const appendOptions = this.getAppendOptionsFromColumns();

    if (appendOptions.length) {
      return {
        ...findOptions,
        appends: appendOptions,
      };
    }

    return findOptions;
  }

  private findFieldByDataIndex(dataIndex: Array<string>): IField {
    const { collection } = this.options;
    const currentField = collection.getField(dataIndex[0]);

    if (dataIndex.length > 1) {
      let targetCollection: ICollection;

      for (let i = 0; i < dataIndex.length - 1; i++) {
        const isLast = i === dataIndex.length - 1;

        if (isLast) {
          return targetCollection.getField(dataIndex[i]);
        }

        targetCollection = (currentField as IRelationField).targetCollection();
      }
    }

    return currentField;
  }

  private renderHeaders() {
    return this.options.columns.map((col) => {
      const field = this.findFieldByDataIndex(col.dataIndex);
      if (col.title) {
        return col.title;
      }

      return field?.options.title || col.defaultTitle;
    });
  }

  private renderRawValue(value) {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }

    return value;
  }

  private renderCellValue(rowData: IModel, column: ExportColumn, ctx?) {
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

    const field = this.findFieldByDataIndex(dataIndex);

    if (!field) {
      return this.renderRawValue(value);
    }

    const fieldOptions = field.options;
    const interfaceName = fieldOptions['interface'];

    if (!interfaceName) {
      return this.renderRawValue(value);
    }

    const InterfaceClass = this.options.collectionManager.getFieldInterface(interfaceName);

    if (!InterfaceClass) {
      return this.renderRawValue(value);
    }

    const interfaceInstance = new InterfaceClass(fieldOptions);
    return interfaceInstance.toString(value, ctx);
  }
}

export default XlsxExporter;
