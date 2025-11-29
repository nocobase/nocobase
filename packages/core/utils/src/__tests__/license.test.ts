/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { testPkgConnection, testPkgLogin, isEnvMatch } from '../license';

describe('conect to pkg.nocobase.com', () => {
  it('should connect to pkg.nocobase.com', async () => {
    const result = await testPkgConnection();
    expect(result).toEqual(true);
  });
  it('should login to pkg.nocobase.com', async () => {
    const result = await testPkgLogin('');
    expect(result).toEqual(false);
  });
});

describe('env match', () => {
  const envWithDbId = {
    sys: 'Windows',
    osVer: '10',
    db: { name: 'MySQL', oid: 1, ver: '5.7', id: '123' },
  };
  const envWithNewVersion = {
    sys: 'Windows',
    osVer: '10',
    db: { name: 'MySQL', oid: 1, ver: '5.7.2', id: '1234' },
  };
  const licenseKey = {
    instanceData: {
      sys: 'Windows',
      osVer: '10',
      db: { name: 'MySQL', oid: 1, ver: '5.7' },
    },
  };
  const licenseKeyWithId = {
    instanceData: {
      sys: 'Windows',
      osVer: '10',
      db: { name: 'MySQL', oid: 1, ver: '5.7', id: '1234' },
    },
  };
  it('new env match old key', async () => {
    const result = isEnvMatch(envWithDbId as any, licenseKey as any);
    expect(result).toEqual(true);
  });
  it('new env match old key with different Version', async () => {
    const result = isEnvMatch(envWithNewVersion as any, licenseKey as any);
    expect(result).toEqual(false);
  });
  it('new env match new key', async () => {
    const result = isEnvMatch(envWithNewVersion as any, licenseKeyWithId as any);
    expect(result).toEqual(true);
  });
});
