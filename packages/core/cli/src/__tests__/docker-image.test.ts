/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import {
  normalizeDockerImageTag,
  resolveDockerImageRef,
  shouldUseFullDockerImageTag,
} from '../lib/docker-image.js';

test('official docker registries use the -full image tag suffix', () => {
  expect(shouldUseFullDockerImageTag('nocobase/nocobase')).toBe(true);
  expect(shouldUseFullDockerImageTag('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase')).toBe(true);
  expect(normalizeDockerImageTag('nocobase/nocobase', 'alpha')).toBe('alpha-full');
  expect(normalizeDockerImageTag('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase', 'pr-9313')).toBe('pr-9313-full');
  expect(resolveDockerImageRef('nocobase/nocobase', 'beta')).toBe('nocobase/nocobase:beta-full');
});

test('non-official registries keep the original version tag', () => {
  expect(shouldUseFullDockerImageTag('registry.cn-beijing.aliyuncs.com/nocobase/nocobase')).toBe(false);
  expect(normalizeDockerImageTag('registry.cn-beijing.aliyuncs.com/nocobase/nocobase', 'alpha')).toBe('alpha');
  expect(resolveDockerImageRef('registry.cn-beijing.aliyuncs.com/nocobase/nocobase', 'pr-9313')).toBe(
    'registry.cn-beijing.aliyuncs.com/nocobase/nocobase:pr-9313',
  );
});

test('full suffix is not duplicated when the version already includes it', () => {
  expect(normalizeDockerImageTag('nocobase/nocobase', 'alpha-full')).toBe('alpha-full');
  expect(resolveDockerImageRef('nocobase/nocobase', 'beta-full')).toBe('nocobase/nocobase:beta-full');
});
