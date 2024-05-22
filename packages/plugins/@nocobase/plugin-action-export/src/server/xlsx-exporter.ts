/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, FindOptions } from '@nocobase/database';

type ExportColumn = {
  dataIndex: Array<string>;
  defaultTitle: string;
};

type ExportOptions = {
  collection: Collection;
  columns: Array<ExportColumn>;
  findOptions: FindOptions;
};

class XlsxExporter {
  constructor(private options: ExportOptions) {}
  async run() {
    const { collection, columns, findOptions } = this.options;
  }
}

export default XlsxExporter;
