/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { HostRuntime } from './types.ts';

interface ProcessReportHeader {
  glibcVersionRuntime?: string;
}

let cachedRuntime: HostRuntime | undefined;

/**
 * Describes the platform the Host process runs applications on.
 *
 * The shape mirrors `nocobase.buildTarget`, which `pnpm build` records in an application's `dist/package.json`, so
 * a Hub can compare an uploaded archive with the Host before accepting it. Applications run in-process, so the
 * Host's own platform, architecture, C library and Node ABI are the ones every native binary has to match.
 */
export function readHostRuntime(): HostRuntime {
  if (cachedRuntime) return { ...cachedRuntime };
  cachedRuntime = {
    platform: process.platform,
    arch: process.arch,
    libc: process.platform === 'linux' ? detectLinuxLibc() : null,
    nodeAbi: Number(process.versions.modules),
    nodeMajor: Number(process.versions.node.split('.')[0]),
  };
  return { ...cachedRuntime };
}

function detectLinuxLibc(): 'glibc' | 'musl' {
  // Node reports the glibc version it runs against only when linked with glibc, which is the same signal the
  // build uses when it records a current-machine target.
  const report = process.report.getReport() as { header?: ProcessReportHeader };
  return report.header?.glibcVersionRuntime ? 'glibc' : 'musl';
}
