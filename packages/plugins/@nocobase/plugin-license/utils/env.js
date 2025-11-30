'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.isEnvMatch = exports.isDomainMatch = exports.getClientDomain = void 0;
const omit_1 = __importDefault(require('lodash/omit'));
function getClientDomain(ctx) {
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
exports.getClientDomain = getClientDomain;
function isDomainMatch(currentDomain, keyData) {
  function domainMatch(licenseDomain, currentDomain) {
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
exports.isDomainMatch = isDomainMatch;
function isEnvMatch(env, keyData) {
  const idMatchId = env?.db?.id && keyData?.instanceData?.db?.id;
  const getMatchStr = (envData) => {
    const data = {
      sys: envData?.sys,
      osVer: envData?.osVer,
      db: idMatchId ? { id: envData?.db?.id } : (0, omit_1.default)(envData?.db, ['id']),
    };
    return JSON.stringify(data);
  };
  return getMatchStr(env) === getMatchStr(keyData?.instanceData);
}
exports.isEnvMatch = isEnvMatch;
