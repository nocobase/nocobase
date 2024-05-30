/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '@nocobase/database';
import XLSX, { WorkBook } from 'xlsx';
import lodash from 'lodash';

export type ImportColumn = {
  dataIndex: Array<string>;
  defaultTitle: string;
};

type ImporterOptions = {
  collection: Collection;
  columns: Array<ImportColumn>;
  workbook: WorkBook;
  chunkSize?: number;
};

export class XlsxImporter {
  constructor(private options: ImporterOptions) {
    if (options.columns.length == 0) {
      throw new Error();
    }
  }

  async run() {
    const rows = this.getData();
    const chunks = lodash.chunk(rows, this.options.chunkSize || 200);
    for (const chunkRows of chunks) {
      for (const row of chunkRows) {
        const rowValues = {};

        for (let index = 0; index < this.options.columns.length; index++) {
          const column = this.options.columns[index];

          const field = this.options.collection.fields.get(column.dataIndex[0]);

          if (!field) {
            throw new Error(`Field not found: ${column.dataIndex[0]}`);
          }

          const interfaceType = field.options.interface;

          const value = row[index];

          if (value === null || value === undefined) {
            continue;
          }
        }
      }
    }
  }

  getData() {
    const firstSheet = this.firstSheet();
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null, raw: false });

    const headers = rows[0];
    const columns = this.options.columns;

    // validate headers
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      if (column.defaultTitle !== headers[i]) {
        throw new Error(`Invalid header: ${column.defaultTitle} !== ${headers[i]}`);
      }
    }

    // remove header
    rows.shift();

    return rows;
  }

  firstSheet() {
    return this.options.workbook.Sheets[this.options.workbook.SheetNames[0]];
  }
}
