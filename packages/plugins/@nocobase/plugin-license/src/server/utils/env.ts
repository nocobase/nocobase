/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Env } from '@nocobase/license-kit';
import { KeyData } from './interface';
import { logger } from '@nocobase/logger';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

export function getClientDomain(ctx: any) {
  if (!ctx) return '';

  const referer = typeof ctx.get === 'function' ? ctx.get('referer') : null;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      logger.error('Invalid Referer URL:', referer);
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
  if (!env || !keyData?.instanceData) return false;

  // 关键修正：任意一边没有 db，直接 false
  if (!env.db || !keyData.instanceData.db) return false;

  const envDbId = env?.db?.id;
  const keyDbId = keyData?.instanceData?.db?.id;
  const matchById = Boolean(envDbId && keyDbId);

  const normalizeEnvData = (envItem: typeof env) => {
    if (!envItem) return null;

    const { sys, osVer, db } = envItem;

    return {
      sys,
      osVer,
      db: matchById ? { id: db?.id } : omit(db, ['id']),
    };
  };

  const a = normalizeEnvData(env);
  const b = normalizeEnvData(keyData.instanceData as Env);

  return isEqual(a, b);
}
