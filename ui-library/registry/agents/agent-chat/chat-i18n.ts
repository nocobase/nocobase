/**
 * The chat's translation and the wording it hands to other items: `t` with the block's English defaults, the
 * transcript rows' labels, and the HTTP status of a failed request.
 */
import type { Translate } from '@nocobase/app-plugin-agents/client/chat';
import { ACCESS_NAMESPACE } from '@nocobase/app-plugin-agents/shared/access';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import type { AgentComposerLabels } from '#components/agent-composer';
import type { AttachmentLabels } from '#components/attachment-list';
import type { AgentPickerLabels } from '#components/agent-picker';
import type { RunTranscriptLabels } from '#components/agent-run-history';

import agentChatEnUS from './locales/en-US.js';

/** The HTTP status of a failed request, when it has one. */
export function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error))
    return undefined;
  const { status } = error as { readonly status: unknown };
  return typeof status === 'number' ? status : undefined;
}

const KINDS = [
  'text',
  'thinking',
  'toolUse',
  'toolResult',
  'allowed',
  'denied',
  'input',
  'checkout',
  'status',
  'error',
  'usage',
] as const;

/** The transcript rows' wording, with i18next's placeholders turned into `agent-run-history`'s `{name}` ones. */
export function useTranscriptLabels(): RunTranscriptLabels {
  const { t } = useChatTranslation();
  return useMemo(
    () => ({
      waiting: t('chat.transcript.waiting'),
      empty: t('chat.transcript.empty'),
      fetchFailed: t('chat.transcript.fetchFailed'),
      expand: t('chat.transcript.expand'),
      truncated: t('chat.transcript.truncated'),
      events: t('chat.transcript.events'),
      inputDelivered: t('chat.transcript.inputDelivered', {
        count: '{count}',
      }),
      tokens: t('chat.transcript.tokens', {
        input: '{input}',
        output: '{output}',
      }),
      kinds: Object.fromEntries(
        KINDS.map((kind) => [kind, t(`chat.transcript.kinds.${kind}`)]),
      ) as RunTranscriptLabels['kinds'],
    }),
    [t],
  );
}

/** The composer's wording, with i18next's placeholders turned into `agent-composer`'s `{name}` ones. */
export function useComposerLabels(): AgentComposerLabels {
  const { t } = useChatTranslation();
  return useMemo(
    () => ({
      label: t('chat.composer.label'),
      placeholder: t('chat.composer.placeholder'),
      hint: t('chat.composer.hint'),
      runningHint: t('chat.composer.runningHint'),
      tooLong: t('chat.composer.tooLong', { max: '{max}' }),
      send: t('chat.composer.send'),
      stop: t('chat.composer.stop'),
      stopping: t('chat.composer.stopping'),
      contextLabel: t('chat.context.label'),
      contextFilter: t('chat.context.filter', { filter: '{filter}' }),
      contextSelection: t('chat.context.selection', { text: '{text}' }),
      contextRemove: t('chat.context.remove', { label: '{label}' }),
      attach: t('chat.attachments.attach'),
      attachmentsLabel: t('chat.attachments.label'),
      attachmentRemove: t('chat.attachments.remove', { name: '{name}' }),
      attachmentUploading: t('chat.attachments.uploading'),
      attachmentTooLarge: t('chat.attachments.tooLarge', { max: '{max}' }),
      attachmentFailed: t('chat.attachments.failed'),
      attachmentsTooMany: t('chat.attachments.tooMany', { max: '{max}' }),
      attachmentsBlocked: t('chat.attachments.blocked'),
      attachmentsWaiting: t('chat.attachments.waiting'),
    }),
    [t],
  );
}

/** The wording of a message's files (`attachment-list`), with i18next's placeholders turned into its `{name}` ones. */
export function useAttachmentLabels(): AttachmentLabels {
  const { t } = useChatTranslation();
  return useMemo(
    () => ({
      title: t('chat.attachments.sent'),
      images: t('chat.attachments.images'),
      files: t('chat.attachments.files'),
      pending: t('chat.attachments.label'),
      upload: t('chat.attachments.attach'),
      preview: t('chat.attachments.preview', { name: '{name}' }),
      download: t('chat.attachments.download', { name: '{name}' }),
      remove: t('chat.attachments.remove', { name: '{name}' }),
      uploading: t('chat.attachments.uploading'),
      removeTitle: t('chat.attachments.remove', { name: '' }),
      removeDescription: '',
      removeConfirm: t('chat.attachments.remove', { name: '' }),
      cancel: t('chat.pending.discard'),
      previous: t('chat.attachments.previous'),
      next: t('chat.attachments.next'),
    }),
    [t],
  );
}

/** The agent picker's wording, with i18next's placeholders turned into `agent-picker`'s `{name}` ones. */
export function useAgentPickerLabels(): AgentPickerLabels {
  const { t } = useChatTranslation();
  return useMemo(
    () => ({
      switch: t('chat.agents.switch', { name: '{name}' }),
      withStatus: t('chat.agents.withStatus', {
        name: '{name}',
        status: '{status}',
      }),
      chooseFor: t('chat.agents.chooseFor'),
      startWith: t('chat.agents.startWith'),
      boundHint: t('chat.agents.boundHint'),
      modeHint: t('chat.agents.modeHint'),
      empty: t('chat.agents.empty'),
      none: t('chat.agents.none'),
      field: t('chat.agents.field', { name: '{name}' }),
      unknown: t('chat.agents.unknown'),
      placeholder: t('chat.agents.placeholder'),
      myDefault: t('chat.agents.myDefault'),
      systemDefault: t('chat.agents.systemDefault'),
      personal: t('chat.agents.personal'),
      temporary: t('chat.agents.temporary'),
      onlineGroup: t('chat.agents.onlineGroup'),
      runnerGroup: t('chat.agents.runnerGroup'),
      mode: { online: t('chat.mode.online'), runner: t('chat.mode.runner') },
      modeHints: {
        online: t('chat.mode.onlineHint'),
        runner: t('chat.mode.runnerHint'),
      },
      availability: Object.fromEntries(
        AVAILABILITY.map((key) => [key, t(`chat.availability.${key}`)]),
      ) as AgentPickerLabels['availability'],
    }),
    [t],
  );
}

const AVAILABILITY = [
  'online',
  'agentMissing',
  'agentArchived',
  'forbidden',
  'noRunner',
  'modelUnavailable',
] as const;

function englishOf(key: string): string | undefined {
  let node: unknown = agentChatEnUS;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * `t` for the chat's views: a key missing from the application's resources renders the English wording of
 * `locales/en-US.ts` (a plural key, its `_one` and `_other` forms), and a run's failure reason, which the plugin's notice
 * texts look up as `failures.<reason>`, comes from the agents plugin's own namespace.
 */
export function useChatTranslation(): { readonly t: Translate } {
  const { t } = useTranslation();
  return useMemo(() => {
    const translate: Translate = (key, options) => {
      if (key.startsWith('failures.'))
        return t(key, { ...options, ns: ACCESS_NAMESPACE });
      const plural = typeof options?.['count'] === 'number';
      const english = plural ? englishOf(`${key}_other`) : englishOf(key);
      const one = plural ? englishOf(`${key}_one`) : undefined;
      return t(key, {
        ...(english === undefined ? {} : { defaultValue: english }),
        ...(one === undefined ? {} : { defaultValue_one: one }),
        ...options,
      });
    };
    return { t: translate };
  }, [t]);
}
