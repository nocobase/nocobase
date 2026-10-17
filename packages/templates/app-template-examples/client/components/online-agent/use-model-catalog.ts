import { useChatModels } from '@nocobase/app-plugin-agents/client/chat';

/** Share the authenticated chat catalog with the picker; failures never become an empty success. */
export function useModelCatalog(open: boolean) {
  const query = useChatModels(open);
  const services = query.data ?? [];
  const phase =
    query.isFetching || query.isPending
      ? 'loading'
      : query.isError
        ? 'error'
        : 'ready';
  const canSend =
    open &&
    phase === 'ready' &&
    services.some((service) =>
      service.models.some((model) => model.kind === 'chat'),
    );
  return {
    phase,
    services,
    error: query.error,
    canSend,
    refresh: () => {
      void query.refetch({ cancelRefetch: false });
    },
  };
}
