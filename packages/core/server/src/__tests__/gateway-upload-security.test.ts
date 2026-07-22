/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { supertest } from '@nocobase/test';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppSupervisor } from '../app-supervisor';
import { Gateway } from '../gateway';

const originalAppPublicPath = process.env.APP_PUBLIC_PATH;
const originalStoragePath = process.env.STORAGE_PATH;

describe('gateway upload security', () => {
  let storagePath: string;

  beforeEach(async () => {
    storagePath = await mkdtemp(path.join(os.tmpdir(), 'nocobase-gateway-upload-security-'));
    await mkdir(path.join(storagePath, 'uploads'), { recursive: true });
    process.env.APP_PUBLIC_PATH = '/console/';
    process.env.STORAGE_PATH = storagePath;
  });

  afterEach(async () => {
    if (originalAppPublicPath === undefined) {
      delete process.env.APP_PUBLIC_PATH;
    } else {
      process.env.APP_PUBLIC_PATH = originalAppPublicPath;
    }

    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }

    await Gateway.getInstance().destroy();
    await AppSupervisor.getInstance().destroy();
    await rm(storagePath, { recursive: true, force: true });
  });

  it.each([
    ['report.pdf', '%PDF-1.4'],
    ['payload.xml', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
  ])('forces active uploaded file %s to download', async (filename, content) => {
    await writeFile(path.join(storagePath, 'uploads', filename), content);

    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get(`/console/storage/uploads/${filename}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-security-policy']).toBe('sandbox');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('keeps non-active uploaded files inline while sandboxing the response', async () => {
    await writeFile(path.join(storagePath, 'uploads', 'notes.txt'), 'safe text');

    const response = await supertest
      .agent(Gateway.getInstance().getCallback())
      .get('/console/storage/uploads/notes.txt');

    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('inline');
    expect(response.headers['content-security-policy']).toBe('sandbox');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.text).toBe('safe text');
  });
});
