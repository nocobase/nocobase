/**
 * The prose of the prompt for a person's own agent (`shared/ci-prompt.ts`), in the viewer's language, and Studio's
 * address the prompt names.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useHref } from 'react-router';

import type { CiPromptWords } from '../../../shared/ci-prompt.js';

/** Studio's address with its base path, as CI and a person's agent reach it. */
export function useStudioUrl(): string {
  const basePath = useHref('/');
  return new URL(basePath, window.location.origin).href.replace(/\/+$/u, '');
}

export function useCiPromptWords(): CiPromptWords {
  const { t } = useTranslation();
  // `{{name}}` stays for the prompt to fill.
  const raw = (key: string) =>
    t(`ciSetup.prompt.${key}`, {
      interpolation: { skipOnVariables: true, escapeValue: false },
      repo: '{{repo}}',
      studioUrl: '{{studioUrl}}',
      secret: '{{secret}}',
      defaultBranch: '{{defaultBranch}}',
      directory: '{{directory}}',
      appId: '{{appId}}',
      branch: '{{branch}}',
      pattern: '{{pattern}}',
      environment: '{{environment}}',
    });
  return {
    intro: {
      pullRequest: raw('intro.pullRequest'),
      branch: raw('intro.branch'),
      tag: raw('intro.tag'),
    },
    appTitle: raw('appTitle'),
    directory: raw('directory'),
    appId: {
      pullRequest: raw('appId.pullRequest'),
      branch: raw('appId.branch'),
      tag: raw('appId.tag'),
    },
    fileTitle: raw('fileTitle'),
    commandsTitle: raw('commandsTitle'),
    commandsHint: raw('commandsHint'),
    secretTask: raw('secretTask'),
    secretOwn: raw('secretOwn'),
    stepsTitle: raw('stepsTitle'),
    steps: [raw('steps.read'), raw('steps.add'), raw('steps.pullRequest')],
  };
}
