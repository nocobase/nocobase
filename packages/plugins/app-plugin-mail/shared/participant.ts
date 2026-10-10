/** The participant index accepts ASCII dot-atom mailboxes and DNS domains. */
export interface NormalizedMailParticipantAddress {
  readonly address: string;
  readonly domain: string;
}

export interface MailParticipantFilter {
  readonly field: 'address' | 'domain';
  readonly value: string;
}

function normalizeDomain(value: string): string | undefined {
  const domain = value.toLowerCase();
  if (domain.length > 253 || !domain.includes('.')) return undefined;
  const labels = domain.split('.');
  if (
    labels.some(
      (label) =>
        label.length === 0 ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    )
  )
    return undefined;
  return domain;
}

/** Trim and lowercase without alias folding, truncation, or display-name parsing. */
export function normalizeMailParticipantAddress(
  value: unknown,
): NormalizedMailParticipantAddress | undefined {
  if (typeof value !== 'string') return undefined;
  if (/[^\u0021-\u007e]/.test(value.trim())) return undefined;
  const address = value.trim().toLowerCase();
  if (address.length > 320) return undefined;
  const at = address.indexOf('@');
  if (at <= 0 || at !== address.lastIndexOf('@')) return undefined;
  const local = address.slice(0, at);
  if (
    local.length > 64 ||
    !/^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*$/.test(
      local,
    )
  )
    return undefined;
  const domain = normalizeDomain(address.slice(at + 1));
  return domain ? { address, domain } : undefined;
}

/** An omitted filter is distinct from an explicitly empty or malformed one. */
export function parseMailParticipant(
  value: string,
): MailParticipantFilter | undefined {
  if (value.length > 320) return undefined;
  if (/[^\u0021-\u007e]/.test(value.trim())) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized.startsWith('@')) {
    const domain = normalizeDomain(normalized.slice(1));
    return domain ? { field: 'domain', value: domain } : undefined;
  }
  const mailbox = normalizeMailParticipantAddress(normalized);
  return mailbox ? { field: 'address', value: mailbox.address } : undefined;
}
