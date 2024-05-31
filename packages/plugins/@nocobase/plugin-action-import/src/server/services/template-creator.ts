/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ICollection } from '@nocobase/data-source-manager';
import { ImportColumn } from './xlsx-importer';
import XLSX, { WorkBook } from 'xlsx';

type TemplateCreatorOptions = {
  collection: ICollection;
  title?: string;
  explain?: string;
  columns: Array<ImportColumn>;
};

export class TemplateCreator {
  constructor(private options: TemplateCreatorOptions) {}

  async run(): Promise<WorkBook> {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.sheet_new();

    // write headers
    XLSX.utils.sheet_add_aoa(worksheet, [this.renderHeaders()], {
      origin: 'A1',
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');
    return workbook;
  }

  renderHeaders() {
    return this.options.columns.map((col) => {
      return col.defaultTitle;
    });
  }
}
