/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { requireModule } from '@nocobase/utils';
import { resolve } from 'path';

export const getCronLocale = (lang: string) => {
  const candidates = Array.from(new Set([lang, lang.replace('-', '_')]));
  const files = candidates.map((candidate) => resolve(__dirname, `./../locale/cron/${candidate}`));
  if (process.env.APP_ENV !== 'production') {
    for (const candidate of candidates) {
      files.push(`@nocobase/client/src/locale/cron/${candidate}`, `@nocobase/client/lib/locale/cron/${candidate}`);
    }
  }
  for (const file of files) {
    try {
      require.resolve(file);
      return requireModule(file);
    } catch (error) {
      continue;
    }
  }
  return {};
};
