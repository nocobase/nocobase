import { ImapFlow } from 'imapflow';
import nodemailer, { type Transporter } from 'nodemailer';

import type {
  ImapSmtpEndpointConfig,
  ImapSmtpMailProviderConfig,
} from './config.js';
import type { ImapSmtpCredential } from './types.js';
import {
  CONNECTION_TIMEOUT_MS,
  SOCKET_TIMEOUT_MS,
  MAX_IMAP_BODY_BYTES,
} from './constants.js';

export function validateConfig(config: ImapSmtpMailProviderConfig): void {
  validateEndpoint(config.imap, 'IMAP');
  validateEndpoint(config.smtp, 'SMTP');
  if (
    config.sentCopyMode !== undefined &&
    !['server', 'client'].includes(config.sentCopyMode)
  ) {
    throw new Error('SMTP sentCopyMode must be server or client.');
  }
}

function validateEndpoint(
  endpoint: ImapSmtpEndpointConfig,
  label: string,
): void {
  if (!endpoint.host.trim()) throw new Error(`${label} host is required.`);
  if (
    !Number.isInteger(endpoint.port) ||
    endpoint.port < 1 ||
    endpoint.port > 65_535
  ) {
    throw new Error(`${label} port must be an integer between 1 and 65535.`);
  }
}

export async function verifyConnections(
  config: ImapSmtpMailProviderConfig,
  credential: ImapSmtpCredential,
): Promise<void> {
  const imap = createImapClient(config.imap, credential);
  const smtp = createSmtpTransport(config.smtp, credential);
  try {
    await imap.connect();
    await smtp.verify();
  } finally {
    try {
      await imap.logout();
    } catch {
      imap.close();
    }
    smtp.close();
  }
}

export function createImapClient(
  endpoint: ImapSmtpEndpointConfig,
  credential: ImapSmtpCredential,
): ImapFlow {
  const client = new ImapFlow({
    host: endpoint.host,
    port: endpoint.port,
    secure: endpoint.secure,
    auth: { user: credential.username, pass: credential.password },
    logger: false,
    // Reject oversized server literals before the IMAP parser allocates them.
    maxLiteralSize: MAX_IMAP_BODY_BYTES + 1,
    maxLineLength: 256 * 1024,
    maxResponseSize: 2 * MAX_IMAP_BODY_BYTES,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: CONNECTION_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
    tls: { rejectUnauthorized: endpoint.rejectUnauthorized ?? true },
  });
  // Protocol limit failures emit an error after connect. Closing rejects pending
  // commands; consuming the event prevents an unhandled EventEmitter exception.
  client.on('error', () => client.close());
  return client;
}

export function createSmtpTransport(
  endpoint: ImapSmtpEndpointConfig,
  credential: ImapSmtpCredential,
): Transporter {
  return nodemailer.createTransport({
    host: endpoint.host,
    port: endpoint.port,
    secure: endpoint.secure,
    auth: { user: credential.username, pass: credential.password },
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: CONNECTION_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
    dnsTimeout: CONNECTION_TIMEOUT_MS,
    tls: { rejectUnauthorized: endpoint.rejectUnauthorized ?? true },
  });
}
