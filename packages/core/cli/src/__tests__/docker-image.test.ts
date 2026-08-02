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
  DEFAULT_KINGBASE_IMAGE,
  inferNbImageRegistryFromRepository,
  normalizeNbImageRegistry,
  normalizeNbImageVariant,
  normalizeDockerImageTag,
  resolveBuiltinDbImage,
  resolveDockerImageContainerPort,
  resolveDockerImageRef,
  resolveOfficialDockerRegistry,
  shouldUseFullDockerImageTag,
} from '../lib/docker-image.js';

test('official docker registries use the -full image tag suffix', () => {
  expect(shouldUseFullDockerImageTag('nocobase/nocobase')).toBe(true);
  expect(shouldUseFullDockerImageTag('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase')).toBe(true);
  expect(normalizeDockerImageTag('nocobase/nocobase', 'alpha')).toBe('alpha-full');
  expect(normalizeDockerImageTag('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase', 'pr-9313')).toBe(
    'pr-9313-full',
  );
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

test('nb image registry and variant helpers resolve official mappings', () => {
  expect(normalizeNbImageRegistry('dockerhub')).toBe('dockerhub');
  expect(normalizeNbImageRegistry('aliyun')).toBe('aliyun');
  expect(normalizeNbImageVariant('full-no-nginx')).toBe('full-no-nginx');
  expect(resolveOfficialDockerRegistry('dockerhub')).toBe('nocobase/nocobase');
  expect(resolveOfficialDockerRegistry('aliyun')).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
  expect(inferNbImageRegistryFromRepository('nocobase/nocobase')).toBe('dockerhub');
  expect(inferNbImageRegistryFromRepository('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase')).toBe('aliyun');
});

test('official image variant mapping supports no-nginx and full-no-nginx', () => {
  expect(resolveDockerImageRef('nocobase/nocobase', 'latest', { variant: 'standard' })).toBe(
    'nocobase/nocobase:latest',
  );
  expect(resolveDockerImageRef('nocobase/nocobase', 'latest', { variant: 'no-nginx' })).toBe(
    'nocobase/nocobase:latest-no-nginx',
  );
  expect(resolveDockerImageRef('nocobase/nocobase', 'latest', { variant: 'full' })).toBe(
    'nocobase/nocobase:latest-full',
  );
  expect(resolveDockerImageRef('nocobase/nocobase', 'latest', { variant: 'full-no-nginx' })).toBe(
    'nocobase/nocobase:latest-full-no-nginx',
  );
});

test('docker image container port follows the resolved nginx variant tag', () => {
  expect(resolveDockerImageContainerPort('nocobase/nocobase:latest')).toBe('80');
  expect(resolveDockerImageContainerPort('nocobase/nocobase:latest-full')).toBe('80');
  expect(resolveDockerImageContainerPort('nocobase/nocobase:latest-no-nginx')).toBe('13000');
  expect(resolveDockerImageContainerPort('localhost:5000/nocobase/nocobase:latest-full-no-nginx')).toBe('13000');
});

test('builtin db image mapping follows the selected official image registry', () => {
  expect(resolveBuiltinDbImage('postgres', { registry: 'dockerhub' })).toBe('postgres:16');
  expect(resolveBuiltinDbImage('mysql', { registry: 'dockerhub' })).toBe('mysql:8');
  expect(resolveBuiltinDbImage('mariadb', { registry: 'aliyun' })).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/mariadb:11',
  );
  expect(resolveBuiltinDbImage('kingbase', { registry: 'dockerhub' })).toBe(DEFAULT_KINGBASE_IMAGE);
});
