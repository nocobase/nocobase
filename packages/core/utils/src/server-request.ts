/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * SSRF protection utilities for server-side HTTP requests.
 *
 * Configure allowed outbound request targets via the SERVER_REQUEST_WHITELIST
 * environment variable. Accepts a comma-separated list of:
 *   - Exact IPv4 addresses:        1.2.3.4
 *   - IPv4 CIDR ranges:            10.0.0.0/8
 *   - Exact IPv6 addresses:        ::1
 *   - IPv6 CIDR ranges:            fc00::/7
 *   - Exact hostnames:             api.example.com
 *   - Wildcard subdomains:         *.example.com  (single level only)
 *
 * Example:
 *   SERVER_REQUEST_WHITELIST=1.2.3.4,10.0.0.0/8,::1,fc00::/7,api.example.com,*.trusted.com
 *
 * When not set, all requests are allowed (preserves existing behaviour).
 * When set, only requests whose host matches an entry are permitted.
 *
 * Note: only http and https URL schemes are ever accepted, regardless of the
 * whitelist configuration.
 */

import ipaddr from 'ipaddr.js';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { LookupAddress } from 'dns';
import { lookup } from 'dns/promises';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const SSRF_RISK_IP_RANGES = new Set(['loopback', 'private', 'linkLocal', 'uniqueLocal', 'unspecified']);
const SSRF_RISK_HOSTNAMES = new Set(['localhost', 'metadata.google.internal']);
const DNS_LOOKUP_WARNING_TIMEOUT = 1000;
const warnedSsrfRiskTargets = new Set<string>();

/**
 * Match a hostname (already confirmed to be a valid IP address) against a
 * whitelist entry that may be an exact IP or a CIDR range (IPv4 or IPv6).
 * IPv4-mapped IPv6 addresses (::ffff:1.2.3.4) are normalised to plain IPv4
 * before comparison so that v4 CIDR entries also cover mapped addresses.
 */
function matchesIpEntry(hostname: string, entry: string): boolean {
  try {
    let addr: ipaddr.IPv4 | ipaddr.IPv6 = ipaddr.parse(hostname);
    if (addr.kind() === 'ipv6' && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
      addr = (addr as ipaddr.IPv6).toIPv4Address();
    }

    if (entry.includes('/')) {
      const cidr = ipaddr.parseCIDR(entry);
      // parseCIDR returns [IPv4, number] | [IPv6, number]; match() overloads
      // are not mutually compatible in the union, so we cast per kind.
      if (addr.kind() !== cidr[0].kind()) return false;
      if (addr.kind() === 'ipv4') {
        return (addr as ipaddr.IPv4).match(cidr as [ipaddr.IPv4, number]);
      }
      return (addr as ipaddr.IPv6).match(cidr as [ipaddr.IPv6, number]);
    }

    // Exact IP comparison — normalise both sides first
    let entryAddr: ipaddr.IPv4 | ipaddr.IPv6 = ipaddr.parse(entry);
    if (entryAddr.kind() === 'ipv6' && (entryAddr as ipaddr.IPv6).isIPv4MappedAddress()) {
      entryAddr = (entryAddr as ipaddr.IPv6).toIPv4Address();
    }
    return addr.toString() === entryAddr.toString();
  } catch {
    return false;
  }
}

/**
 * Match a hostname against a domain pattern.
 * `*.example.com` matches exactly one subdomain level (e.g. `foo.example.com`)
 * but not `example.com` itself or deeper levels like `a.b.example.com`.
 */
export function matchesDomainPattern(hostname: string, pattern: string): boolean {
  const h = hostname.toLowerCase();
  const p = pattern.toLowerCase();
  if (p.startsWith('*.')) {
    const suffix = p.slice(1); // ".example.com"
    if (!h.endsWith(suffix) || h.length <= suffix.length) return false;
    const prefix = h.slice(0, h.length - suffix.length);
    return !prefix.includes('.');
  }
  return h === p;
}

function matchesEntry(hostname: string, entry: string): boolean {
  const e = entry.trim();
  if (!e) return false;
  return ipaddr.isValid(hostname) ? matchesIpEntry(hostname, e) : matchesDomainPattern(hostname, e);
}

function getNormalizedHost(url: URL): string {
  const { hostname } = url;
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

function getSsrfRiskReason(hostname: string): string | undefined {
  const host = hostname.toLowerCase();
  if (SSRF_RISK_HOSTNAMES.has(host)) {
    return 'known local or metadata hostname';
  }

  if (!ipaddr.isValid(host)) {
    return;
  }

  try {
    let addr: ipaddr.IPv4 | ipaddr.IPv6 = ipaddr.parse(host);
    if (addr.kind() === 'ipv6' && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
      addr = (addr as ipaddr.IPv6).toIPv4Address();
    }

    const range = addr.range();
    return SSRF_RISK_IP_RANGES.has(range) ? range : undefined;
  } catch {
    return;
  }
}

function warnSsrfRiskTarget(host: string, reason: string, key = `${host}:${reason}`): void {
  if (warnedSsrfRiskTargets.has(key)) return;
  warnedSsrfRiskTargets.add(key);

  console.warn(
    [
      `Outbound request to "${host}" targets a potential SSRF risk target (${reason}) and is allowed because SERVER_REQUEST_WHITELIST is not configured.`,
      'Configure SERVER_REQUEST_WHITELIST to explicitly allow required outbound targets.',
      'A future version may block private, loopback, link-local, and metadata targets by default.',
    ].join(' '),
  );
}

function warnIfSsrfRiskTarget(host: string): void {
  const reason = getSsrfRiskReason(host);
  if (!reason) return;

  warnSsrfRiskTarget(host, reason);
}

function hasServerRequestWhitelist(): boolean {
  const whitelist = process.env.SERVER_REQUEST_WHITELIST;
  return Boolean(whitelist && whitelist.trim());
}

async function resolveHostAddresses(host: string): Promise<LookupAddress[]> {
  try {
    return await Promise.race([
      lookup(host, { all: true, verbatim: true }),
      new Promise<LookupAddress[]>((resolve) => {
        setTimeout(() => resolve([]), DNS_LOOKUP_WARNING_TIMEOUT);
      }),
    ]);
  } catch {
    return [];
  }
}

async function warnIfResolvedSsrfRiskTarget(url?: string): Promise<void> {
  if (!url || !url.includes('://') || hasServerRequestWhitelist()) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return;

  const host = getNormalizedHost(parsed);
  if (getSsrfRiskReason(host) || ipaddr.isValid(host)) return;

  const addresses = await resolveHostAddresses(host);
  for (const address of addresses) {
    const reason = getSsrfRiskReason(address.address);
    if (reason) {
      warnSsrfRiskTarget(host, `resolves to ${address.address} (${reason})`, `${host}:resolved-risk`);
      return;
    }
  }
}

/**
 * Validate a URL against the SERVER_REQUEST_WHITELIST environment variable.
 *
 * Throws an error if:
 *   - The URL scheme is not http or https.
 *   - SERVER_REQUEST_WHITELIST is set and the host does not match any entry.
 *
 * Silently returns for relative URLs (no scheme) so that internal API calls
 * that use a relative path are not affected.
 *
 * Prefer using {@link serverRequest} over calling this directly.
 */
export function checkUrlAgainstWhitelist(url?: string): void {
  if (!url) return;

  // Relative URLs have no scheme — they resolve to the same server, skip check.
  if (!url.includes('://')) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Malformed URL — let the HTTP client surface its own error.
    return;
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `URL scheme "${parsed.protocol.replace(':', '')}" is not allowed. Only http and https are permitted.`,
    );
  }

  const host = getNormalizedHost(parsed);
  const whitelist = process.env.SERVER_REQUEST_WHITELIST;
  if (!whitelist || !whitelist.trim()) {
    warnIfSsrfRiskTarget(host);
    return;
  }

  const entries = whitelist
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (entries.length === 0) return;

  for (const entry of entries) {
    if (matchesEntry(host, entry)) return;
  }

  throw new Error(
    `Outbound request to "${host}" is blocked. Add it to SERVER_REQUEST_WHITELIST to allow this request.`,
  );
}

/**
 * Drop-in replacement for `axios.request()` with built-in SSRF protection.
 *
 * Validates `config.url` against {@link checkUrlAgainstWhitelist} before
 * forwarding to axios. Every redirect destination is validated before the
 * next request is sent. Use this instead of calling axios directly for all
 * server-initiated outbound HTTP requests.
 */
export async function serverRequest<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  // Check config.url (before any baseURL combination) so that relative paths
  // pointing to the same server are not subject to the whitelist.
  checkUrlAgainstWhitelist(config.url);
  await warnIfResolvedSsrfRiskTarget(config.url);
  return axios.request<T>({
    ...config,
    // Axios request interceptors do not run again for redirects. In Node.js,
    // beforeRedirect runs after Location is resolved and before the next hop
    // is sent, so every redirect destination must be checked here.
    beforeRedirect: (options) => {
      if (typeof options.href !== 'string') {
        throw new Error('Unable to validate redirect destination.');
      }
      checkUrlAgainstWhitelist(options.href);
    },
  });
}
