/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import type { IncomingMessage } from 'http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveSubAppSegment } from '../resolveSubAppSegment';

function createRequest(headers: IncomingMessage['headers'] = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

describe('resolveSubAppSegment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty segment for the main app', async () => {
    expect(await resolveSubAppSegment(createRequest(), 'main')).toBe('');
  });

  it('returns an empty segment in single-app mode', async () => {
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({ runningMode: 'single' } as AppSupervisor);

    expect(await resolveSubAppSegment(createRequest({ host: 'example.com' }), 'sub')).toBe('');
  });

  it('returns an empty segment when the request host is the sub-app custom domain', async () => {
    const getAppNameByCName = vi.fn().mockResolvedValue('sub');
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
      getAppNameByCName,
    } as unknown as AppSupervisor);

    expect(await resolveSubAppSegment(createRequest({ host: 'sub.example.com' }), 'sub')).toBe('');
    expect(getAppNameByCName).toHaveBeenCalledWith('sub.example.com');
  });

  it('uses x-hostname when the gateway forwards the original hostname', async () => {
    const getAppNameByCName = vi.fn().mockResolvedValue('sub');
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
      getAppNameByCName,
    } as unknown as AppSupervisor);

    const req = createRequest({ host: 'internal.example.com', 'x-hostname': 'sub.example.com' });
    expect(await resolveSubAppSegment(req, 'sub')).toBe('');
    expect(getAppNameByCName).toHaveBeenCalledWith('sub.example.com');
  });

  it('normalizes ports and comma-separated values from x-hostname', async () => {
    const getAppNameByCName = vi.fn().mockResolvedValue('sub');
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
      getAppNameByCName,
    } as unknown as AppSupervisor);

    const req = createRequest({ 'x-hostname': 'sub.example.com:443, internal.example.com' });
    expect(await resolveSubAppSegment(req, 'sub')).toBe('');
    expect(getAppNameByCName).toHaveBeenCalledWith('sub.example.com');
  });

  it('uses the first valid x-hostname array value', async () => {
    const getAppNameByCName = vi.fn().mockResolvedValue('sub');
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
      getAppNameByCName,
    } as unknown as AppSupervisor);

    const req = createRequest({ 'x-hostname': ['', 'sub.example.com:443'] });
    expect(await resolveSubAppSegment(req, 'sub')).toBe('');
    expect(getAppNameByCName).toHaveBeenCalledWith('sub.example.com');
  });

  it('falls back to the request host when x-hostname has no valid values', async () => {
    const getAppNameByCName = vi.fn().mockResolvedValue('sub');
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
      getAppNameByCName,
    } as unknown as AppSupervisor);

    const req = createRequest({ host: 'sub.example.com:13000', 'x-hostname': ['', ' '] });
    expect(await resolveSubAppSegment(req, 'sub')).toBe('');
    expect(getAppNameByCName).toHaveBeenCalledWith('sub.example.com');
  });

  it('returns the path segment when the request host is not the sub-app custom domain', async () => {
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      runningMode: 'multiple',
      getAppNameByCName: vi.fn().mockResolvedValue(null),
    } as unknown as AppSupervisor);

    expect(await resolveSubAppSegment(createRequest({ host: 'main.example.com' }), 'sub')).toBe('/apps/sub');
  });
});
