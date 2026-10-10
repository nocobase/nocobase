/* eslint-disable react-refresh/only-export-components -- context and its consumer share one module */
import {
  useChatPanel,
  useChatSources,
  type ChatSelection,
} from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router';
import { useRouteTrail } from '../routing/route-context.js';
import { studioContext } from './chat-context.js';

type Snapshot = ReturnType<typeof studioContext> & {
  remove: (key: string) => void;
};
const StudioContext = createContext<Snapshot | null>(null);

/** One page selection and removal lifetime for both editors, including while the panel is absent. */
export function StudioChatContextProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const location = useLocation();
  const panel = useChatPanel();
  const sources = useChatSources();
  const trail = useRouteTrail();
  const { t } = useTranslation();
  const current = trail.at(-1)?.route;
  const name = current?.name ?? location.pathname;
  const title = current?.breadcrumb?.title;
  // Chat/account controls do not constitute a new business page.
  const params = new URLSearchParams(location.search);
  for (const key of ['chat', 'chatMode', 'chatView', 'chatAgent', 'account'])
    params.delete(key);
  const key = `${location.pathname}?${params.toString()}`;
  const [selection, setSelection] = useState<{
    key: string;
    value: ChatSelection | null;
  }>({ key, value: null });
  const [removed, setRemoved] = useState<{
    key: string;
    values: ReadonlySet<string>;
  }>(() => ({ key, values: new Set() }));
  useEffect(() => {
    function inChat(node: Node | null): boolean {
      const element = node instanceof Element ? node : node?.parentElement;
      return element?.closest('[data-agents-chat]') != null;
    }
    function onSelectionChange(): void {
      const chosen = document.getSelection();
      if (!chosen || chosen.isCollapsed) {
        if (
          inChat(document.activeElement) ||
          inChat(chosen?.anchorNode ?? null)
        )
          return;
        setSelection({ key, value: null });
        return;
      }
      if (inChat(chosen.anchorNode) || inChat(chosen.focusNode)) return;
      const element =
        chosen.anchorNode instanceof Element
          ? chosen.anchorNode
          : chosen.anchorNode?.parentElement;
      const end =
        chosen.focusNode instanceof Element
          ? chosen.focusNode
          : chosen.focusNode?.parentElement;
      if (
        !element?.closest('main') ||
        !end?.closest('main') ||
        !element.isConnected ||
        !end.isConnected
      )
        return;
      if (element?.closest('input, textarea, [contenteditable="true"]')) return;
      const text = chosen.toString().trim();
      setSelection({ key, value: text ? { text } : null });
      setRemoved((before) => ({
        key,
        values: new Set(
          before.key === key
            ? [...before.values].filter((value) => value !== 'selection')
            : [],
        ),
      }));
    }
    document.addEventListener('selectionchange', onSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', onSelectionChange);
  }, [key]);
  const snapshot = studioContext(
    {
      route: `${location.pathname}${location.search}`,
      pinned: panel.pinned,
      sources: sources.items,
      filter: sources.filter,
      selection: selection.key === key ? selection.value : null,
      removed: removed.key === key ? removed.values : new Set(),
    },
    typeof title === 'string'
      ? t(title, current?.packageName ? { ns: current.packageName } : undefined)
      : name,
  );
  const value: Snapshot = {
    ...snapshot,
    remove: (value) => {
      setRemoved((before) => ({
        key,
        values: new Set([...(before.key === key ? before.values : []), value]),
      }));
      sources.remove(value);
    },
  };
  return (
    <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
  );
}

/** Both editors read this same snapshot and freeze it when a message is submitted. */
export function useStudioChatContext(): Snapshot {
  const value = useContext(StudioContext);
  if (!value) throw new Error('StudioChatContextProvider is required');
  return value;
}
