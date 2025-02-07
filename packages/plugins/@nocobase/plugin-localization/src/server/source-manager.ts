/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Registry } from '@nocobase/utils';

export type Source = {
  title: string;
  sync: (ctx: Context) => Promise<{
    [module: string]: {
      [text: string]: string;
    };
  }>;
  namespace?: string;
  collections?: {
    collection: string;
    fields: string[];
  }[];
};

export class SourceManager {
  sources = new Registry<Source>();

  registerSource(name: string, source: Source) {
    this.sources.register(name, source);
  }
}
