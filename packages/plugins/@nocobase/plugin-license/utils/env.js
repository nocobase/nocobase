'use strict';
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.isEnvMatch = exports.isDomainMatch = exports.getClientDomain = void 0;
const omit_1 = __importDefault(require('lodash/omit'));
const isEqual_1 = __importDefault(require('lodash/isEqual'));
function getClientDomain(ctx) {
  if (!ctx) return '';
  const referer = typeof ctx.get === 'function' ? ctx.get('referer') : null;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      console.error('Invalid Referer URL:', referer);
    }
  }
  const protocol = ctx.headers?.['x-forwarded-proto'] || ctx.protocol || ctx.request?.protocol || 'http';
  const host = ctx.headers?.['x-forwarded-host'] || ctx.host || ctx.request?.host || '';
  return host ? `${protocol}://${host}` : '';
}
exports.getClientDomain = getClientDomain;
function matchSingleDomain(licenseDomain, currentDomain) {
  let hostname = '';
  let port = '';
  try {
    const url = new URL(currentDomain);
    hostname = url.hostname;
    port = url.port ? `:${url.port}` : '';
  } catch {
    return false;
  }
  const fullDomain = hostname + port;
  if (!licenseDomain.includes('*')) {
    return fullDomain === licenseDomain;
  }
  const base = licenseDomain.replace('*', '');
  return fullDomain.endsWith(base);
}
function isDomainMatch(currentDomain, keyData) {
  if (!keyData?.licenseKey?.domain || !currentDomain) return false;
  const licenseDomains = keyData.licenseKey.domain
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  return licenseDomains.some((licenseDomain) => matchSingleDomain(licenseDomain, currentDomain));
}
exports.isDomainMatch = isDomainMatch;
function isEnvMatch(env, keyData) {
  if (!env || !keyData?.instanceData) return false;
  if (!env.db || !keyData.instanceData.db) return false;
  const envDbId = env?.db?.id;
  const keyDbId = keyData?.instanceData?.db?.id;
  const matchById = Boolean(envDbId && keyDbId);
  const normalizeEnvData = (envItem) => {
    if (!envItem) return null;
    const { sys, osVer, db } = envItem;
    return {
      sys,
      osVer,
      db: matchById ? { id: db?.id } : (0, omit_1.default)(db, ['id']),
    };
  };
  const a = normalizeEnvData(env);
  const b = normalizeEnvData(keyData.instanceData);
  return (0, isEqual_1.default)(a, b);
}
exports.isEnvMatch = isEnvMatch;
