import { createHash } from 'node:crypto';
import {
  type MailLabelColor,
  DEFAULT_MAIL_LABEL_COLOR,
  isMailLabelColor,
} from '../../shared/mail.js';
import { mailInvalidArgument } from './errors.js';

export function normalizeMailLabelColor(
  value: unknown,
  fallback: MailLabelColor = DEFAULT_MAIL_LABEL_COLOR,
): MailLabelColor {
  if (value === undefined || value === null) return fallback;
  if (!isMailLabelColor(value)) {
    throw mailInvalidArgument('Mail label color is invalid.');
  }
  return value;
}

export function hashState(state: string): string {
  return createHash('sha256').update(state).digest('hex');
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function normalizeMailSyncDate(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw mailInvalidArgument('Mail synchronization start date is required.');
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw mailInvalidArgument('Mail synchronization start date is invalid.');
  }
  return new Date(timestamp).toISOString();
}

export function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const resolved = value ?? fallback;
  if (
    !Number.isSafeInteger(resolved) ||
    resolved < minimum ||
    resolved > maximum
  ) {
    throw new TypeError(
      `Mail sync option must be an integer from ${minimum} through ${maximum}.`,
    );
  }
  return resolved;
}
