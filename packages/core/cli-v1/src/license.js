/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const chalk = require('chalk');
const { resolve } = require('path');
const fs = require('fs-extra');
const { keyDecrypt, getEnvAsync } = require('@nocobase/license-kit');
const { isEnvMatch } = require('@nocobase/plugin-license/utils/env');
const { logger } = require('./logger');
const { pick } = require('lodash');

exports.getAccessKeyPair = async function () {
  const keyFile = resolve(process.cwd(), 'storage/.license/license-key');
  if (!fs.existsSync(keyFile)) {
    logger.info('License key not found');
    return {};
  }
  logger.info('License key found');
  let keyData = {};
  try {
    const str = fs.readFileSync(keyFile, 'utf-8');
    const keyDataStr = keyDecrypt(str);
    keyData = JSON.parse(keyDataStr);
  } catch (error) {
    showLicenseInfo(LicenseKeyError.parseFailed);
    throw new Error(LicenseKeyError.parseFailed.title);
  }
  const env = await getEnvAsync();
  const isEnvMatched = await isEnvMatch(env, keyData);
  if (!isEnvMatched) {
    showLicenseInfo({
      ...LicenseKeyError.notMatch,
      env,
    });
    throw new Error(LicenseKeyError.notMatch.title);
  }
  const { accessKeyId, accessKeySecret } = keyData;
  return { accessKeyId, accessKeySecret };
};

const LicenseKeyError = {
  notExist: {
    title: 'License key not found',
    content:
      'Please go to the license settings page to obtain the Instance ID for the current environment, and then generate the license key on the service platform.',
  },
  parseFailed: {
    title: 'Invalid license key format',
    content: 'Please check your license key, or regenerate the license key on the service platform.',
  },
  notMatch: {
    title: 'License key not match current environment',
    content:
      'Please go to the license settings page to obtain the Instance ID for the current environment, and then regenerate the license key on the service platform.',
  },
  notValid: {
    title: 'Invalid license key',
    content:
      'Please go to the license settings page to obtain the Instance ID for the current environment, and then regenerate the license key on the service platform.',
  },
};

exports.LicenseKeyError = LicenseKeyError;

function showLicenseInfo({ title, content, env }) {
  logger.error(title + '. ' + content);
  logger.error('Current environment', pick(env, ['sys', 'osVer', 'db']));
}

exports.showLicenseInfo = showLicenseInfo;
