/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getUpgradeLicenseErrorMessage } from '../plugin';

describe('getUpgradeLicenseErrorMessage', () => {
  test('returns nothing when license status is empty', () => {
    expect(
      getUpgradeLicenseErrorMessage({
        pkgVersion: '2.1.0-beta.35',
        appVersion: '2.0.0-beta.10',
        licenseStatus: undefined,
      }),
    ).toBeUndefined();
  });

  test('returns nothing when license status is active', () => {
    expect(
      getUpgradeLicenseErrorMessage({
        pkgVersion: '2.1.0-beta.35',
        appVersion: '2.0.0-beta.10',
        licenseStatus: 'active',
      }),
    ).toBeUndefined();
  });

  test('returns nothing when package version matches application version', () => {
    expect(
      getUpgradeLicenseErrorMessage({
        pkgVersion: '2.1.0-beta.35',
        appVersion: '2.1.0-beta.35',
        licenseStatus: 'invalid',
        upgradeExpirationDate: '2026-05-20T00:00:00.000Z',
      }),
    ).toBeUndefined();
  });

  test('returns an expiration message when the upgrade validity has expired', () => {
    expect(
      getUpgradeLicenseErrorMessage({
        pkgVersion: '2.1.0-beta.35',
        appVersion: '2.0.0-beta.10',
        licenseStatus: 'invalid',
        upgradeExpirationDate: '2026-05-20T00:00:00.000Z',
      }),
    ).toBe(
      'The license has expired and cannot be upgraded. Upgrade expiration date: 2026-05-20T00:00:00.000Z.\nPlease roll back to version 2.0.0-beta.10.\nCurrent core version is 2.1.0-beta.35, but the installed application version is 2.0.0-beta.10.',
    );
  });

  test('returns an invalid license message when no upgrade expiration date exists', () => {
    expect(
      getUpgradeLicenseErrorMessage({
        pkgVersion: '2.1.0-beta.35',
        appVersion: '2.0.0-beta.10',
        licenseStatus: 'invalid',
      }),
    ).toBe(
      'The license is invalid and cannot be upgraded.\nPlease roll back to version 2.0.0-beta.10.\nCurrent core version is 2.1.0-beta.35, but the installed application version is 2.0.0-beta.10.',
    );
  });
});
