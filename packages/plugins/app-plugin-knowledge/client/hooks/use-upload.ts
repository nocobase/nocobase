/**
 * Uploading files into a space's tree: one after another under a parent, and the handlers of a drop target that takes
 * files.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type DragEvent } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { KnowledgeDoc, SpaceRef } from '../../shared/knowledge.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';
import { useNotify } from './use-notify.js';

/** Uploads files into `space` (under `parentId`) one after another; answers the last entry made. */
export function useUpload(space: SpaceRef | null): {
  readonly pending: boolean;
  upload(files: readonly File[], parentId: string | null): void;
} {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: {
      readonly files: readonly File[];
      readonly parentId: string | null;
    }) => {
      let made: KnowledgeDoc | null = null;
      for (const file of input.files)
        made = await api.upload(space!, file, { parentId: input.parentId });
      return made;
    },
    onSuccess: (_, input) => {
      notify.success(
        t('knowledge.files.uploaded', { count: input.files.length }),
      );
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
    onError: (error) => {
      notify.error(error);
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
  });
  return {
    pending: mutation.isPending,
    upload(files, parentId) {
      if (space && files.length > 0) mutation.mutate({ files, parentId });
    },
  };
}

/** Drag-and-drop handlers for a target taking files, and whether files are over it. */
export function useFileDrop(onFiles: ((files: File[]) => void) | null): {
  readonly over: boolean;
  readonly handlers: {
    onDragOver?: (event: DragEvent) => void;
    onDragLeave?: (event: DragEvent) => void;
    onDrop?: (event: DragEvent) => void;
  };
} {
  const [over, setOver] = useState(false);
  if (!onFiles) return { over: false, handlers: {} };
  const carriesFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer.types).includes('Files');
  return {
    over,
    handlers: {
      onDragOver: (event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        onFiles(Array.from(event.dataTransfer.files));
      },
    },
  };
}
