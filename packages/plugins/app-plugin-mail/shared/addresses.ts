export interface Mailbox {
  readonly address: string;
  readonly name?: string;
}

export interface AddressIssue {
  readonly field: string;
  readonly message: string;
  readonly input?: string;
}

const controls = /\p{Cc}/u;

/** Sending accepts dot-atoms (including EAI), quoted locals and IDN domains.
 * Comments, groups and obsolete mailbox grammar are deliberately unsupported.
 */
export function mailboxError(address: string): string | undefined {
  if (!address || address.length > 320 || controls.test(address))
    return 'Enter a single email address without control characters (at most 320 characters).';
  const match =
    /^("(?:[^"\\]|\\.)*"|[^@\s"<>(),;:\\]+)@([^@\s<>(),;\\]+)$/u.exec(address);
  if (!match)
    return 'Enter a single email address; put its display name in the name field.';
  const local = match[1];
  const domain = match[2];
  if (
    !local.startsWith('"') &&
    (local.startsWith('.') || local.endsWith('.') || local.includes('..'))
  )
    return 'The email local part contains an empty segment.';
  if (
    !local.startsWith('"') &&
    /[^\p{L}\p{N}\p{M}!#$%&'*+\-/=?^_`{|}~.]/u.test(local)
  )
    return 'The email local part contains unsupported characters.';
  if (domain.startsWith('[')) {
    const ipv4 = /^\[(\d{1,3}(?:\.\d{1,3}){3})\]$/u.exec(domain);
    const ipv6 = /^\[IPv6:([0-9a-f:.]+)\]$/iu.exec(domain);
    if (ipv4 && ipv4[1].split('.').every((part) => Number(part) <= 255))
      return undefined;
    if (ipv6) {
      try {
        new URL(`http://[${ipv6[1]}]`);
        return undefined;
      } catch {
        /* Invalid IPv6 literal. */
      }
    }
    return 'Enter a valid email domain literal.';
  }
  if (
    !domain
      .split('.')
      .every((label) =>
        /^[\p{L}\p{N}](?:[\p{L}\p{N}\p{M}-]*[\p{L}\p{N}\p{M}])?$/u.test(label),
      )
  )
    return 'Enter a valid email domain.';
  return undefined;
}

export function mailboxNameError(name: string | undefined): string | undefined {
  return name !== undefined && (name.length > 255 || controls.test(name))
    ? 'Display names must not contain control characters and must be at most 255 characters.'
    : undefined;
}

/** Split only outside quoted strings and angle brackets. Invalid tokens survive draft saves verbatim. */
export function parseMailboxList(
  value: string,
  maxRecipients = 100,
): {
  mailboxes: Mailbox[];
  issues: AddressIssue[];
} {
  const tokens: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  let angle = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted && char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') quoted = !quoted;
    if (!quoted) {
      if (char === '<') angle += 1;
      if (char === '>') angle -= 1;
      if (angle === 0 && /[,;\n\r]/u.test(char)) {
        tokens.push(value.slice(start, index));
        start = index + 1;
      }
    }
  }
  tokens.push(value.slice(start));
  const mailboxes: Mailbox[] = [];
  const issues: AddressIssue[] = [];
  for (const token of tokens) {
    const raw = token.trim();
    if (!raw) continue;
    let mailbox: Mailbox = { address: raw };
    const named = /^("(?:[^"\\]|\\.)*"|[^"<>]+)\s*<([^<>]+)>$/u.exec(raw);
    if (named) {
      const display = named[1].trim();
      const name = display.startsWith('"')
        ? display.slice(1, -1).replace(/\\(.)/gu, '$1')
        : display;
      // Unquoted phrase specials are not repaired or silently discarded.
      if (display.startsWith('"') || !/[(),;:\\]/u.test(display))
        mailbox = { name, address: named[2].trim() };
    }
    const message =
      mailboxError(mailbox.address) ?? mailboxNameError(mailbox.name);
    if (message) {
      issues.push({
        field: String(mailboxes.length),
        message: `${message} (${raw})`,
        input: raw,
      });
      mailbox = { address: raw };
    }
    mailboxes.push(mailbox);
  }
  if (mailboxes.length > maxRecipients)
    issues.push({
      field: '',
      message: 'Use at most 100 recipients per field.',
    });
  return { mailboxes, issues };
}

export function formatMailboxList(addresses: readonly Mailbox[]): string {
  return addresses
    .map(({ address, name }) =>
      name ? `"${name.replace(/["\\]/gu, '\\$&')}" <${address}>` : address,
    )
    .join(', ');
}

export function recipientIssues(input: {
  readonly to?: readonly Mailbox[];
  readonly cc?: readonly Mailbox[];
  readonly bcc?: readonly Mailbox[];
}): AddressIssue[] {
  const issues: AddressIssue[] = [];
  for (const field of ['to', 'cc', 'bcc'] as const) {
    const list = input[field] ?? [];
    if ((field === 'to' && list.length === 0) || list.length > 100)
      issues.push({
        field,
        message:
          'Use between 1 and 100 To recipients and at most 100 Cc or Bcc recipients.',
      });
    list.forEach((mailbox, index) => {
      const address = mailboxError(mailbox.address);
      const name = mailboxNameError(mailbox.name);
      if (address)
        issues.push({ field: `${field}.${index}.address`, message: address });
      if (name) issues.push({ field: `${field}.${index}.name`, message: name });
    });
  }
  return issues;
}
