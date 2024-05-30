/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '@nocobase/database';

export type ImportColumn = {
  dataIndex: Array<string>;
  defaultTitle: string;
};

type ImporterOptions = {
  collection: Collection;
  columns: Array<ImportColumn>;
};
export class XlsxImporter {
  constructor(private options: ImporterOptions) {}

  async run() {}
}
