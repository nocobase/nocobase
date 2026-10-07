import { useCallback, useEffect, useRef, useState } from 'react';
import type { AIConfigurationStatus, AIConversation } from './types.js';

export function useConversationCatalog({
  configurationStatus,
  listConversations,
  onChange,
  onError,
}: {
  configurationStatus: AIConfigurationStatus;
  listConversations: (keyword?: string) => Promise<AIConversation[]>;
  onChange: (conversations: AIConversation[]) => void;
  onError: (error?: Error) => void;
}) {
  const [searching, setSearching] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [search, setSearch] = useState('');
  // Derived rather than toggled from the effect below: the catalog is loading
  // from the moment the configuration is ready until the first list resolves.
  const loading =
    searching || (configurationStatus === 'ready' && !initialLoaded);
  const searchRef = useRef('');
  const requestRef = useRef(0);
  const catalogRef = useRef<AIConversation[]>([]);

  const apply = useCallback(
    (conversations: AIConversation[], keyword = searchRef.current) => {
      if (!keyword) catalogRef.current = conversations;
      onChange(conversations);
    },
    [onChange],
  );

  const refresh = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const keyword = searchRef.current;
    const conversations = await listConversations(keyword);
    if (requestRef.current === requestId) apply(conversations, keyword);
    return conversations;
  }, [apply, listConversations]);

  useEffect(() => {
    if (configurationStatus !== 'ready') return;
    let active = true;
    onError(undefined);
    void listConversations()
      .then((conversations) => {
        if (!active || searchRef.current) return;
        apply(conversations, '');
      })
      .catch((error: unknown) => {
        if (!active) return;
        onError(
          error instanceof Error
            ? error
            : new Error('Unable to load conversations'),
        );
      })
      .finally(() => {
        if (active) setInitialLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [apply, configurationStatus, listConversations, onError]);

  const searchConversations = useCallback(
    async (keyword: string) => {
      const normalizedKeyword = keyword.trim();
      setSearch(keyword);
      searchRef.current = normalizedKeyword;

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setSearching(true);
      onError(undefined);
      try {
        const conversations = await listConversations(normalizedKeyword);
        if (requestRef.current !== requestId) return;
        apply(conversations, normalizedKeyword);
      } catch (error) {
        if (requestRef.current !== requestId) return;
        const resolvedError =
          error instanceof Error
            ? error
            : new Error('Unable to search conversations');
        onError(resolvedError);
        throw resolvedError;
      } finally {
        if (requestRef.current === requestId) setSearching(false);
      }
    },
    [apply, listConversations, onError],
  );

  const updateCatalog = useCallback(
    (updater: (conversations: AIConversation[]) => AIConversation[]) => {
      catalogRef.current = updater(catalogRef.current);
    },
    [],
  );

  return {
    loading,
    search,
    searchRef,
    refresh,
    searchConversations,
    updateCatalog,
  };
}
