/**
 * The invitation email and the port it goes through. The provider uses the application mailer, or a legacy notification adapter; tests
 * pass a recording double.
 *
 * The invitee has no account yet, so the inviter's side decides the language when the invitation is created and the
 * invitation keeps it. The email is written in that language alone. Only a language this plugin has no email text for
 * falls back to the application's default language followed by English, at most two blocks.
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

/** The language every email can fall back to. */
const BASE_EMAIL_LOCALE = 'en-US';

/** The languages this plugin has invitation email text for. */
export const INVITATION_EMAIL_LOCALES: readonly string[] = Object.keys(locales);

/**
 * The languages the email is written in, in order: the chosen one when there is email text for it; otherwise the
 * application's default when there is text for it, then English.
 */
export function invitationEmailLocales(
  locale: string | undefined,
  defaultLocale?: string,
): readonly string[] {
  if (locale && INVITATION_EMAIL_LOCALES.includes(locale)) return [locale];
  return [
    ...new Set(
      [defaultLocale, BASE_EMAIL_LOCALE].filter(
        (candidate): candidate is string =>
          !!candidate && INVITATION_EMAIL_LOCALES.includes(candidate),
      ),
    ),
  ];
}

/** The expiry in the email's language, in UTC and saying so, since the recipient's time zone is unknown. */
export function formatInvitationDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    // `dateStyle` cannot be combined with `timeZoneName`, so the long date is spelled out.
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date);
}

export async function buildInvitationEmail(input: {
  readonly to: string;
  readonly appTitle: string;
  readonly inviterName: string;
  readonly summary: readonly string[];
  readonly url: string;
  readonly expiresAt: Date;
  /** The invitation's language; unset for invitations created before it was kept. */
  readonly locale?: string;
  /** The application's default language, for the fallback. */
  readonly defaultLocale?: string;
}): Promise<InvitationEmail> {
  const { expiresAt, ...rest } = input;
  return renderInvitationEmail({
    ...rest,
    expiresAt: (locale) => formatInvitationDate(expiresAt, locale),
  });
}

/** Pure content builder shared by sending and the source-owned template directory. */
export async function renderInvitationEmail(input: {
  readonly to: string;
  readonly appTitle: string;
  readonly inviterName: string;
  readonly summary: readonly string[];
  readonly url: string;
  /** The expiry as shown in one of the email's languages. */
  readonly expiresAt: (locale: string) => string;
  readonly locale?: string;
  readonly defaultLocale?: string;
}): Promise<InvitationEmail> {
  const languages = await Promise.all(
    invitationEmailLocales(input.locale, input.defaultLocale).map(
      async (locale) => {
        const resource = (await locales[locale]()) as {
          default: UsersResource;
        };
        return { locale, texts: resource.default.invitationEmail };
      },
    ),
  );
  const blocks = languages.map(({ locale, texts }) => {
    const values = {
      inviter: input.inviterName,
      app: input.appTitle,
      items: input.summary.join(texts.separator),
      date: input.expiresAt(locale),
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
    subject: fill(languages[0].texts.subject, {
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
