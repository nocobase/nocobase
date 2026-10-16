import { commercialDatabaseNotice } from './commercial-database.js';
import * as clack from '@clack/prompts';

import type { OfficialDialect } from '@nocobase/app-server/database';

/** Thrown when the user aborts a prompt with Ctrl+C, so the caller can exit quietly rather than print a stack. */
export class PromptCancelledError extends Error {
  public constructor() {
    super('Cancelled.');
    this.name = 'PromptCancelledError';
  }
}

/**
 * Asks which installed driver to configure.
 *
 * Only drivers that are actually installed are offered, so the prompt cannot produce a dialect the application is
 * unable to load — the "driver missing" path exists for `--dialect` and for scripted runs, not for this one.
 */
export async function selectDialect(
  available: readonly OfficialDialect[],
): Promise<OfficialDialect> {
  const choice = await clack.select({
    message: 'Which database should the main connection use?',
    options: available.map((dialect) => ({
      value: dialect,
      label: commercialDatabaseNotice(dialect)
        ? `${dialect} (Pro · Commercial)`
        : dialect,
    })),
  });

  if (clack.isCancel(choice)) {
    throw new PromptCancelledError();
  }

  return choice;
}

const LABELS: Readonly<Record<string, string>> = {
  host: 'Host',
  port: 'Port',
  database: 'Database',
  serviceName: 'Service name',
  username: 'Username',
  password: 'Password',
};

/**
 * Asks for the main connection's settings, offering the generated ones as defaults.
 *
 * The password is read without echo. That is why it is asked for here rather than accepted as a flag: a flag stays in
 * the shell history, and an answer typed into a masked prompt does not.
 */
export async function promptConnection(
  dialect: OfficialDialect,
  defaults: Readonly<Record<string, unknown>>,
): Promise<Readonly<Record<string, unknown>>> {
  clack.log.info(`Connection settings for ${dialect}`);
  const answers: Record<string, unknown> = {};
  for (const [field, fallback] of Object.entries(defaults)) {
    const label = LABELS[field] ?? field;
    // Connection settings are strings and numbers; anything else has no useful default to offer.
    const shown =
      typeof fallback === 'string' || typeof fallback === 'number'
        ? String(fallback)
        : undefined;
    const answer =
      field === 'password'
        ? await clack.password({ message: label })
        : await clack.text({
            message: label,
            defaultValue: shown ?? '',
            placeholder: shown,
            validate:
              field === 'port'
                ? (value) =>
                    value === '' || /^\d+$/u.test(value ?? '')
                      ? undefined
                      : 'A port is a number.'
                : undefined,
          });
    if (clack.isCancel(answer)) throw new PromptCancelledError();
    const text = String(answer ?? '');
    answers[field] =
      field === 'port'
        ? Number(text === '' ? fallback : text)
        : text === '' && field !== 'password'
          ? fallback
          : text;
  }
  return answers;
}

/** Asks whether to write a configuration whose connection failed; the safe answer is no. */
export async function confirmWriteAnyway(): Promise<boolean> {
  const answer = await clack.confirm({
    message: 'Write the configuration anyway?',
    initialValue: false,
  });
  if (clack.isCancel(answer)) throw new PromptCancelledError();
  return answer;
}
