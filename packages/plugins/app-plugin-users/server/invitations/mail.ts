/**
 * The invitation email and the port it goes through. The provider backs the port with the notification plugin; tests
 * pass a recording double.
 *
 * The invitee has no account yet, so there is no language to choose: the email carries every language the server
 * locales have, one block each.
 */
import type { UsersResource } from '../locales/en-US.js';
import locales from '../locales/index.js';

export interface InvitationEmail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export interface InvitationMailer {
  /** Submits the email; throws when no channel is configured or the submission is refused. */
  send(email: InvitationEmail): Promise<void>;
}

/** Used when no channel is configured: delivery fails; authorized inviters can deliver the link themselves. */
export const unconfiguredMailer: InvitationMailer = {
  send: () =>
    Promise.reject(new Error('No invitation email channel is configured.')),
};

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

export async function buildInvitationEmail(input: {
  readonly to: string;
  readonly appTitle: string;
  readonly inviterName: string;
  readonly summary: readonly string[];
  readonly url: string;
  readonly expiresAt: Date;
}): Promise<InvitationEmail> {
  const languages = await Promise.all(
    Object.values(locales).map(async (load) => {
      const resource = (await load()) as { default: UsersResource };
      return resource.default.invitationEmail;
    }),
  );
  const date = input.expiresAt.toISOString();
  const blocks = languages.map((texts) => {
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
    subject: fill(languages[0].subject, {
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
  };
}
