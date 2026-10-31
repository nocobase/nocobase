/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */
/* global vi */

const { putWithRetry, OSS_TIMEOUT, OSS_MAX_ATTEMPTS } = require('../commands/client')._test;

describe('cli-v1 client:upload', () => {
  let warn;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('should raise the ali-oss response timeout above its 60s default', () => {
    expect(OSS_TIMEOUT).toBeGreaterThan(60000);
  });

  it('should return the result without retrying when the upload succeeds', async () => {
    const put = vi.fn().mockResolvedValue({ name: 'a.js' });

    await expect(putWithRetry({ put }, 'a.js', '/tmp/a.js')).resolves.toEqual({ name: 'a.js' });

    expect(put).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledWith('a.js', '/tmp/a.js');
    expect(warn).not.toHaveBeenCalled();
  });

  it('should retry a transient timeout and resolve', async () => {
    const put = vi
      .fn()
      .mockRejectedValueOnce(new Error('Response timeout for 60000ms'))
      .mockResolvedValue({ name: 'a.js' });

    await expect(putWithRetry({ put }, 'a.js', '/tmp/a.js')).resolves.toEqual({ name: 'a.js' });

    expect(put).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should give up and rethrow after the attempt limit', async () => {
    const error = new Error('Response timeout for 60000ms');
    const put = vi.fn().mockRejectedValue(error);

    await expect(putWithRetry({ put }, 'a.js', '/tmp/a.js')).rejects.toThrow(error);

    expect(put).toHaveBeenCalledTimes(OSS_MAX_ATTEMPTS);
  });
});
