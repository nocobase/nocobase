/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Client Settings build stage', () => {
  it('builds Settings with its own Rsbuild stage', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../build.ts'), 'utf8');

    expect(source).toContain("'app client-settings shell'");
    expect(source).toContain("path.join(CORE_APP, 'client-settings', 'rsbuild.config.ts')");
    expect(source.indexOf("'app client-settings shell'")).toBeGreaterThan(source.indexOf("'app client-v2 shell'"));

    const settingsConfig = fs.readFileSync(
      path.resolve(__dirname, '../../../app/client-settings/rsbuild.config.ts'),
      'utf8',
    );
    expect(settingsConfig).toContain("window['__nocobase_modern_client_prefix__']");
  });
});
