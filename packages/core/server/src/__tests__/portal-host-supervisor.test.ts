/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { sanitizePortalHostChildNodeOptions } from '../portal-host/supervisor';

describe('PortalHostSupervisor', () => {
  it('removes preserve symlink flags from portal-host child NODE_OPTIONS', () => {
    expect(
      sanitizePortalHostChildNodeOptions('--preserve-symlinks --max_old_space_size=4096 --preserve-symlinks-main=true'),
    ).toBe('--max_old_space_size=4096');
  });

  it('removes empty NODE_OPTIONS when only preserve symlink flags are present', () => {
    expect(sanitizePortalHostChildNodeOptions('--preserve-symlinks --preserve-symlinks-main')).toBe('');
  });
});
