/**
 * The invitation email and the port it goes through. The provider backs the port with the notification plugin; tests
 * pass a recording double.
 *
 * The invitee has no account yet, so there is no language to choose: the email carries every language the server
 * locales have, one block each.
 */
import enUS from '../locales/en-US.js';
import zhCN from '../locales/zh-CN.js';

export interface InvitationEmail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  /** Stable per token, so a retried request never sends the same link twice. */
  readonly idempotencyKey: string;
}

export interface InvitationMailer {
  /** Submits the email; throws when no channel is configured or the submission is refused. */
  send(email: InvitationEmail): Promise<void>;
}

/** Used when no channel is configured: every send fails, so the inviter gets the link to forward. */
export const unconfiguredMailer: InvitationMailer = {
  send: () =>
    Promise.reject(new Error('No invitation email channel is configured.')),
};

type Texts = (typeof enUS)['invitationEmail'];

const LANGUAGES: readonly Texts[] = [
  enUS.invitationEmail,
  zhCN.invitationEmail,
];

function fill(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/gu,
    (_, key: string) => values[key] ?? '',
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#39;');
}

export function buildInvitationEmail(input: {
  readonly to: string;
  readonly appTitle: string;
  readonly inviterName: string;
  readonly summary: readonly string[];
  readonly url: string;
  readonly expiresAt: Date;
  readonly idempotencyKey: string;
}): InvitationEmail {
  const date = input.expiresAt.toISOString().slice(0, 10);
  const blocks = LANGUAGES.map((texts) => {
    const values = {
      inviter: input.inviterName,
      app: input.appTitle,
      items: input.summary.join(texts.separator),
      date,
    };
    return {
      lines: [
        fill(texts.intro, values),
        ...(input.summary.length ? [fill(texts.summary, values)] : []),
        fill(texts.validity, values),
      ],
      action: texts.action,
      fallback: texts.fallback,
    };
  });
  const url = escapeHtml(input.url);
  return {
    to: input.to,
    subject: fill(enUS.invitationEmail.subject, {
      inviter: input.inviterName,
      app: input.appTitle,
    }),
    text: blocks
      .map((block) => [...block.lines, input.url].join('\n'))
      .join('\n\n'),
    html: blocks
      .map(
        (block) =>
          block.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('\n') +
          `\n<p><a href="${url}">${escapeHtml(block.action)}</a></p>` +
          `\n<p>${escapeHtml(block.fallback)}<br>${url}</p>`,
      )
      .join('\n<hr>\n'),
    idempotencyKey: input.idempotencyKey,
  };
}
