import { BlockList, SocketAddress, isIP } from 'node:net';

export function parseAuditAddress(value: string): SocketAddress | undefined {
  if (!isIP(value)) return undefined;
  return SocketAddress.parse(value) ?? SocketAddress.parse(`[${value}]:0`);
}

export function createTrustedAuditProxies(
  entries: unknown,
  warn: (message: string) => void,
): BlockList {
  const list = new BlockList();
  if (entries === undefined || entries === null) return list;
  const setting = 'auth.advanced.ipAddress.trustedProxies';
  if (!Array.isArray(entries)) {
    warn(
      `Ignoring ${setting}: expected a list of IP addresses or CIDR ranges.`,
    );
    return list;
  }
  for (const [index, entry] of (entries as unknown[]).entries()) {
    const [ip = '', prefix, extra] =
      typeof entry === 'string' ? entry.split('/') : [];
    const parsed = parseAuditAddress(ip);
    const prefixLength = prefix === undefined ? undefined : Number(prefix);
    if (
      !parsed ||
      parsed.port ||
      extra !== undefined ||
      (prefix !== undefined && !/^\d+$/u.test(prefix)) ||
      (prefixLength !== undefined &&
        prefixLength > (parsed.family === 'ipv4' ? 32 : 128))
    ) {
      warn(
        `Ignoring ${setting}[${index}]: expected an IP address or CIDR range.`,
      );
      continue;
    }
    if (prefixLength === undefined)
      list.addAddress(parsed.address, parsed.family);
    else list.addSubnet(parsed.address, prefixLength, parsed.family);
  }
  return list;
}
