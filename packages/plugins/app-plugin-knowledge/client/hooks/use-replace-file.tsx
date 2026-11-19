/** Replacing a file entry's file with a new version, from its header. */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { KnowledgeDoc } from '../../shared/knowledge.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';
import { useNotify } from './use-notify.js';

/**
 * Replacing a file entry's file with a new version: `pick` opens the file picker, `input` is the hidden field to
 * render, `pending` while it uploads.
 */
export function useReplaceFile(doc: KnowledgeDoc | undefined): {
  readonly pick: () => void;
  readonly pending: boolean;
  readonly input: ReactElement;
} {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const replace = useMutation({
    mutationFn: (next: File) => {
      if (!doc) throw new Error('The file entry is not loaded.');
      return api.replaceFile(doc.id, next, doc.version);
    },
    onSuccess: (saved) => {
      notify.success(t('knowledge.files.replaced', { version: saved.version }));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
    onError: (error) => notify.error(error),
  });
  return {
    pick: () => inputRef.current?.click(),
    pending: replace.isPending,
    input: (
      <input
        ref={inputRef}
        type='file'
        className='hidden'
        aria-label={t('knowledge.files.replace')}
        onChange={(event) => {
          const next = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (next) replace.mutate(next);
        }}
      />
    ),
  };
}
