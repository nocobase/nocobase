/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, FindOptions } from '@nocobase/database';
import XLSX from 'xlsx';

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
  async run(): Promise<XLSX.WorkBook> {
    const { collection, columns, findOptions, chunkSize } = this.options;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.sheet_new();

    // write headers
    XLSX.utils.sheet_add_aoa(worksheet, [columns.map((col) => col.defaultTitle)], {
      origin: 'A1',
    });

    let startRowNumber = 2;

    await collection.repository.chunk({
      chunkSize: chunkSize || 1000,
      async callback(rows, options) {
        const chunkData = rows.map((r) => {
          return columns.map((col) => {
            return r.get(col.dataIndex[0]);
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
}

export default XlsxExporter;
