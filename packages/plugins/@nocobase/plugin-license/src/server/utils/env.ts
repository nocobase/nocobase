/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Env, getEnvAsync } from '@nocobase/license-kit';
import { KeyData } from './interface';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

export function getClientDomain(ctx: any) {
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

function matchSingleDomain(licenseDomain: string, currentDomain: string) {
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

export function isDomainMatch(currentDomain: string, keyData: KeyData) {
  if (!keyData?.licenseKey?.domain || !currentDomain) return false;

  const licenseDomains = keyData.licenseKey.domain
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);

  return licenseDomains.some((licenseDomain) => matchSingleDomain(licenseDomain, currentDomain));
}

export function isEnvMatch(env: Env, keyData: KeyData) {
  return isDbMatch(env, keyData) && isSysMatch(env, keyData);
}

export function isDbMatch(env: any, keyData: any) {
  const a = env?.db;
  const b = keyData?.instanceData?.db;

  if (!a || !b) return false;

  // If both have id, compare by id only
  if (a?.id && b?.id) return a.id === b.id;

  // Otherwise compare shallow equality excluding id
  return isEqual(omit(a, ['id']), omit(b, ['id']));
}

export function isSysMatch(env: Env, keyData: KeyData) {
  const instance = keyData?.instanceData;
  if (!env || !instance) return false;

  const normalize = (item: Env | null | undefined) => {
    if (!item) return null;

    return {
      sys: item.sys ?? null,
      osVer: item.osVer ?? null,
    };
  };

  const a = normalize(env);
  const b = normalize(instance as Env);

  return isEqual(a, b);
}

let envPromise;
export function getEnvOnce() {
  return envPromise ?? (envPromise = getEnvAsync());
}
