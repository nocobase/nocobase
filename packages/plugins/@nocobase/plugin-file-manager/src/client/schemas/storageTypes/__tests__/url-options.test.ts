/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import aliOss from '../ali-oss';
import local from '../local';
import s3 from '../s3';
import txCos from '../tx-cos';

describe('storage URL options schema', () => {
  it.each([local, aliOss, s3, txCos])(
    'places the shared URL options after renaming and before upload rules',
    (storageType) => {
      const properties = storageType.fieldset;
      const fieldNames = Object.keys(properties);

      expect(properties['options.useOriginalUrl']).toMatchObject({
        type: 'boolean',
        'x-component': 'UseOriginalUrlRadio',
        default: false,
      });
      expect(properties['options.public']).toMatchObject({
        type: 'boolean',
        'x-display': 'hidden',
        default: false,
      });
      expect(fieldNames.indexOf('path')).toBeLessThan(fieldNames.indexOf('options.useOriginalUrl'));
      expect(fieldNames.indexOf('renameMode')).toBeLessThan(fieldNames.indexOf('options.useOriginalUrl'));
      expect(fieldNames.indexOf('options.useOriginalUrl')).toBeLessThan(fieldNames.indexOf('rules'));
    },
  );
});
