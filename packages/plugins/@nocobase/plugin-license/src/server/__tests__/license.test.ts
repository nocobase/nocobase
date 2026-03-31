/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { testPkgConnection, testPkgLogin } from '../utils/pkg';
import { isEnvMatch } from '../utils';

describe('conect to pkg.nocobase.com', () => {
  it('should connect to pkg.nocobase.com', async () => {
    const result = await testPkgConnection();
    expect(result).toEqual(true);
  });
  it('should login to pkg.nocobase.com', async () => {
    const result = await testPkgLogin({});
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

const makeEnv = (env: any) => env;
const makeKeyData = (instanceData: any) => ({
  instanceData,
});

describe('isEnvMatch', () => {
  // ========== 1. db.id 存在时，只比较 id ==========
  test('matches when db.id exists on both sides and id is equal', () => {
    const env = makeEnv({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { id: 'abc', type: 'pg', name: 'noco', ver: '14', oid: 1 },
    });

    const keyData: any = makeKeyData({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { id: 'abc', type: 'other', name: 'ignore', ver: 'ignore', oid: 999 },
    });

    expect(isEnvMatch(env, keyData)).toBe(true);
  });

  test('fails when db.id exists but not equal', () => {
    const env = makeEnv({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { id: 'abc' },
    });
    const keyData: any = makeKeyData({
      db: { id: 'xyz' },
    });

    expect(isEnvMatch(env, keyData)).toBe(false);
  });

  // ========== 2. db.id 缺失 → 比较其它字段 ==========
  test('matches when db.id missing and full db fields match', () => {
    const env = makeEnv({
      sys: 'linux',
      osVer: 'ubuntu',
      db: {
        type: 'pg',
        name: 'noco',
        ver: '14',
        oid: 1,
      },
    });

    const keyData: any = makeKeyData({
      sys: 'linux',
      osVer: 'ubuntu',
      db: {
        type: 'pg',
        name: 'noco',
        ver: '14',
        oid: 1,
      },
    });

    expect(isEnvMatch(env, keyData)).toBe(true);
  });

  test('fails when db.id missing and db fields differ', () => {
    const env = makeEnv({
      sys: 'linux',
      osVer: 'ubuntu',
      db: {
        type: 'pg',
        name: 'noco',
        ver: '14',
        oid: 1,
      },
    });

    const keyData: any = makeKeyData({
      sys: 'linux',
      osVer: 'ubuntu',
      db: {
        type: 'pg',
        name: 'other', // diff
        ver: '14',
        oid: 1,
      },
    });

    expect(isEnvMatch(env, keyData)).toBe(false);
  });

  test('fails when sys or osVer differ (id missing)', () => {
    const env = makeEnv({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { type: 'pg', name: 'a', ver: '14', oid: 1 },
    });

    const keyData: any = makeKeyData({
      sys: 'windows',
      osVer: 'ubuntu',
      db: { type: 'pg', name: 'a', ver: '14', oid: 1 },
    });

    expect(isEnvMatch(env, keyData)).toBe(false);
  });

  // ========== 3. 字段顺序不同但内容一致（isEqual 保障） ==========
  test('matches when object field order differs', () => {
    const env = makeEnv({
      osVer: 'ubuntu',
      sys: 'linux',
      db: {
        name: 'noco',
        type: 'pg',
        oid: 1,
        ver: '14',
      },
    });

    const keyData: any = makeKeyData({
      sys: 'linux',
      osVer: 'ubuntu',
      db: {
        type: 'pg',
        ver: '14',
        name: 'noco',
        oid: 1,
      },
    });

    expect(isEnvMatch(env, keyData)).toBe(true);
  });

  // ========== 4. env / keyData 不存在 ==========
  test('fails when env is null', () => {
    expect(isEnvMatch(null as any, makeKeyData({ db: {} })) as any).toBe(false);
  });

  test('fails when keyData.instanceData is null', () => {
    expect(isEnvMatch(makeEnv({ db: {} }), null as any) as any).toBe(false);
  });

  test('fails when both missing db', () => {
    const env = makeEnv({ sys: 'linux', osVer: 'ubuntu' });
    const keyData: any = makeKeyData({ sys: 'linux', osVer: 'ubuntu' });

    // db is missing → normalize will produce null db
    expect(isEnvMatch(env, keyData)).toBe(false);
  });

  // ========== 5. Only one side has db.id ==========
  test('fails when only env has db.id but keyData does not', () => {
    const env = makeEnv({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { id: 'abc' },
    });

    const keyData: any = makeKeyData({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { type: 'pg' },
    });

    expect(isEnvMatch(env, keyData)).toBe(false);
  });

  test('fails when only keyData has db.id but env does not', () => {
    const env = makeEnv({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { type: 'pg' },
    });

    const keyData: any = makeKeyData({
      sys: 'linux',
      osVer: 'ubuntu',
      db: { id: 'abc' },
    });

    expect(isEnvMatch(env, keyData)).toBe(false);
  });
});
