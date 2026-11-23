/* eslint-disable react-refresh/only-export-components -- the layout extension's provider and aside are made together */
/**
 * What the plugin adds to the application's signed-in layout (`layoutExtensions`): a provider around it, holding the
 * panel's state for the signed-in person (`ChatProvider`, the AI form registry), and the panel beside the content. The
 * provider is small and always there, so the ✦ button, "Ask Agent" and the pages' context reach it; the panel itself is
 * a separate chunk (`client/panel/`), downloaded the first time it opens.
 */
import type { AppClientLayoutExtensionDefinition } from '@nocobase/app-client/plugins';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { withNamespace } from '@nocobase/i18n/client';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { PageDraftStoreContext, PageDraftStore } from '../chat/page-draft.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { AIFormRegistryProvider } from '../chat/ai-form.js';
import { CHAT_PANEL_STORAGE_KEY } from '../chat/panel-state.js';
import { ChatProvider, useChatPanel } from '../chat/provider.js';
import { agentsQueryClient } from '../query.js';
import { AgentsOptionsContext, type ResolvedAgentsOptions } from './options.js';

const Panel = lazy(() =>
  import('../panel/index.js').then((module) => ({
    default: withNamespace(
      ACCESS_NAMESPACE,
      module.ChatPanel as ComponentType<object>,
    ) as ComponentType<{ readonly width?: number }>,
  })),
);

/** The panel state belongs to one person: a sign-out or a change of person starts from nothing. */
function IdentityChat({
  userId,
  options,
  children,
}: PropsWithChildren<{
  readonly userId: string;
  readonly options: ResolvedAgentsOptions;
}>): ReactElement | null {
  const [pageDrafts] = useState(() => new PageDraftStore());
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    // The panel's stored state and the cache are not per person: clear them before the provider reads them.
    const reset = () => {
      try {
        window.sessionStorage.removeItem(CHAT_PANEL_STORAGE_KEY);
      } catch {
        // Storage may be unavailable.
      }
      agentsQueryClient().clear();
    };
    reset();
    let active = true;
    // Let the previous person's controller clean up before the next one mounts.
    queueMicrotask(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      reset();
    };
  }, []);
  if (!ready) return null;
  return (
    <AIFormRegistryProvider>
      <ChatProvider
        memoryScope={userId}
        conversationPath={(id) =>
          `${options.chatPath}/${encodeURIComponent(id)}`
        }
      >
        {options.panel && options.panel.defaultOpen ? <OpenOnce /> : null}
        <PageDraftStoreContext.Provider value={pageDrafts}>
          {children}
        </PageDraftStoreContext.Provider>
      </ChatProvider>
    </AIFormRegistryProvider>
  );
}

/** `panel.defaultOpen`: opens the panel once per sign-in on a screen wide enough to dock it. */
function OpenOnce(): null {
  const { openChat, open } = useChatPanel();
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (!open && window.matchMedia?.('(min-width: 1280px)').matches) openChat();
  }, [open, openChat]);
  return null;
}

/** The panel, once it has been opened; it stays mounted while closed so its conversation keeps its place. */
function PanelAside({
  options,
}: {
  readonly options: ResolvedAgentsOptions;
}): ReactElement | null {
  const { available, open } = useChatPanel();
  const [opened, setOpened] = useState(false);
  if (open && !opened) setOpened(true);
  if (!available || !options.panel || !(open || opened)) return null;
  return (
    <QueryClientProvider client={agentsQueryClient()}>
      <Suspense fallback={null}>
        <Panel width={options.panel.width} />
      </Suspense>
    </QueryClientProvider>
  );
}

/** The layout extension for `options`: the provider always, the aside unless the panel is turned off. */
export function agentsLayoutExtension(
  options: ResolvedAgentsOptions,
): AppClientLayoutExtensionDefinition {
  function AgentsLayoutProvider({ children }: PropsWithChildren): ReactElement {
    const { session, isPending } = useAuthentication();
    const userId = isPending ? null : (session?.user.id ?? null);
    return (
      <AgentsOptionsContext.Provider value={options}>
        {userId ? (
          <IdentityChat key={userId} userId={userId} options={options}>
            {children}
          </IdentityChat>
        ) : (
          children
        )}
      </AgentsOptionsContext.Provider>
    );
  }
  function AgentsPanelAside(): ReactElement | null {
    return <PanelAside options={options} />;
  }
  return {
    name: 'agents',
    provider: AgentsLayoutProvider,
    ...(options.panel ? { aside: AgentsPanelAside } : {}),
  };
}
