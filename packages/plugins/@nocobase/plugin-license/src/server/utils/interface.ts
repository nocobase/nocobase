/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface KeyData {
  upgradeExpirationDate: string;
  licenseKey: {
    id: string;
    licensee: string;
    desc: string;
    type: string;
    domain: string;
    licenseStatus: string;
  };
  plugins: Array<{
    displayName: string;
    packageName: string;
    updateExpirationDate?: string;
  }>;
  instanceData: {
    timestamp: string;
    sys: string;
    osVer: string;
    kVer: string;
    hostname: string;
    mac: string;
    db: {
      type: string;
      name: string;
      oid: number;
      ver: string;
      id?: string;
    };
    container: {
      name: string;
      id: string;
    };
  };
  service: {
    domain: string;
    [key: string]: any;
  };
  accessKeyId: string;
  accessKeySecret: string;
  timestamp: number;
}

export const enum LICENSE_ERROR {
  KEY_FORMAT_ERROR = 'KEY_FORMAT_ERROR',
  KEY_NOT_FOUND = 'KEY_NOT_FOUND',
  KEY_READ_ERROR = 'KEY_READ_ERROR',
}

export const CACHE_KEY = 'license-key';
