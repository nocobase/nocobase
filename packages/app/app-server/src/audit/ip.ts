import { BlockList, SocketAddress, isIP } from 'node:net';

export function parseAuditAddress(value: string): SocketAddress | undefined {
  if (!isIP(value)) return undefined;
  return SocketAddress.parse(value) ?? SocketAddress.parse(`[${value}]:0`);
}

export function createTrustedAuditProxies(entries: unknown): BlockList {
  const list = new BlockList();
  if (entries === undefined || entries === null) return list;
  if (!Array.isArray(entries))
    throw new Error('must be a list of IP addresses or CIDR ranges.');
  for (const entry of entries as unknown[]) {
    if (typeof entry !== 'string')
      throw new Error('must contain only IP addresses or CIDR ranges.');
    const [ip = '', prefix, extra] = entry.split('/');
    const parsed = parseAuditAddress(ip);
    if (
      !parsed ||
      parsed.port ||
      extra !== undefined ||
      (prefix !== undefined && !/^\d{1,3}$/u.test(prefix))
    ) {
      throw new Error('must contain only IP addresses or CIDR ranges.');
    }
    if (prefix === undefined) list.addAddress(parsed.address, parsed.family);
    else list.addSubnet(parsed.address, Number(prefix), parsed.family);
  }
  return list;
}
