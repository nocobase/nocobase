import type { MailAddress } from '../../shared/mail.js';

export function mailAddressName(value?: MailAddress): string {
  const address = value?.address.trim() ?? '';
  const name = value?.name?.trim();
  return name && name.toLowerCase() !== address.toLowerCase() ? name : address;
}

export function formatMailAddress(value: MailAddress): string {
  const name = mailAddressName(value);
  const address = value.address.trim();
  return address && name !== address ? `${name} <${address}>` : name;
}

export function formatMailAddresses(values: readonly MailAddress[]): string {
  return values.map(formatMailAddress).filter(Boolean).join(', ');
}
