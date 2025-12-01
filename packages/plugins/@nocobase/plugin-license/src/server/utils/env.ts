/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Env } from '@nocobase/license-kit';
import omit from 'lodash/omit';
import { KeyData } from './interface';

export function getClientDomain(ctx: any) {
  if (!ctx) {
    return '';
  }
  // const proto = ctx.headers['x-forwarded-proto']?.split(',')[0] || ctx.protocol;
  // const host = ctx.headers['x-forwarded-host']?.split(',')[0] || ctx.host;

  // let origin = `${proto}://${host}`;

  // // 如果 referer 存在，并且域名与 host 相同，可作为辅助
  // const referer = ctx.get('referer');
  // if (referer) {
  //   try {
  //     const url = new URL(referer);
  //     if (url.host === host) {
  //       origin = url.origin;
  //     }
  //   } catch {
  //     //
  //   }
  // }
  // return origin;

  if (!ctx.get) {
    return '';
  }
  let fullHost = `${ctx?.protocol}://${ctx?.request?.host || ctx?.host}`; // 默认完整地址

  const referer = ctx?.get?.('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      fullHost = url.origin;
    } catch (err) {
      console.error('Invalid Referer URL:', err);
    }
  }
  return fullHost;
}

export function isDomainMatch(currentDomain: string, keyData: KeyData) {
  function domainMatch(licenseDomain: string, currentDomain: string) {
    // 非泛域名匹配
    const url = new URL(currentDomain);
    const domain = url.hostname + (url.port ? `:${url.port}` : '');
    if (licenseDomain.indexOf('*') === -1) {
      return domain === licenseDomain;
    }
    // 泛域名
    const licenseBaseDomain = licenseDomain.replace('*', '');
    return domain.endsWith(licenseBaseDomain);
  }

  const licenseDomain = keyData?.licenseKey?.domain;
  if (!licenseDomain || !currentDomain) {
    return false;
  }
  if (licenseDomain.includes(',')) {
    return licenseDomain
      .replace(/\s/g, '')
      .split(',')
      .some((domain) => domainMatch(domain, currentDomain));
  }
  return domainMatch(licenseDomain, currentDomain);
}

export function isEnvMatch(env: Env, keyData: KeyData) {
  const matchId = env?.db?.id && keyData?.instanceData?.db?.id;
  const getMatchStr = (envData: {
    sys: string;
    osVer: string;
    db: {
      type: string;
      name: string;
      oid: number;
      ver: string;
      id?: string;
    };
  }) => {
    const data: any = {
      sys: envData?.sys,
      osVer: envData?.osVer,
      db: matchId ? { id: envData?.db?.id } : omit(envData?.db, ['id']),
    };
    return JSON.stringify(data);
  };
  return getMatchStr(env) === getMatchStr(keyData?.instanceData);
}
