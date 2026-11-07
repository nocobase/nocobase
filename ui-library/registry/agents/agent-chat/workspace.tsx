import { ShareConversation } from './share-conversation.js';
import { SnapshotView } from './snapshot-view.js';
/**
 * The chat workspace: the conversation list, one conversation and its details, laid out by the workspace's own width
 * (a ResizeObserver on its root, never the viewport), so a full page and a side panel are the same component:
 *
 * - **narrow** (below `NARROW_BELOW`): one column, the list or the conversation; "← list" goes back; the details and an
 *   opened record cover the conversation pane. A docked panel, a phone page and a phone panel.
 * - **medium**: the list column (foldable to a rail) beside the conversation; the details are a sheet over it.
 * - **wide** (from `WIDE_FROM`): the list, the conversation and the details column beside it.
 *
 * The host decides only what differs between a page and a panel: where the selection lives (`conversationId`, `view`
 * and the callbacks: an address on a page, the panel store in a panel) and whether there are Close and Expand. What
 * only the application knows comes in through narrow slots: list rows and filters (`list`), the conversation body
 * (`renderBody`, the transcript and composer), header metadata, details metadata, and `scope`, a wrapper around the
 * conversation that can provide context and render an opened record (`aside`) in the details' place.
 */
import {
  useConversation,
  useConversationActions,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationDetail } from '@nocobase/app-plugin-agents/shared/conversations';
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  Share2Icon,
  PanelLeftOpenIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';
import { Button } from '#components/ui/button';
import { DropdownMenuItem } from '#components/ui/dropdown-menu';
import { ConversationHeader } from './conversation-header.js';
import { ConversationMetadata } from './conversation-metadata.js';
import { ConversationAssociationSummary } from './conversation-associations.js';
import { ConversationDetails } from './conversation-details.js';
import {
  ConversationList,
  type ConversationListProps,
} from './conversation-list.js';
import { ConversationView } from './conversation-view.js';
import { DeleteConversationDialog } from './delete-conversation.js';
import { useConversationUsage } from './use-conversation-usage.js';
import { useChatTranslation } from './chat-i18n.js';
import {
  WIDE_FROM,
  WorkspaceContext,
  workspaceLayout,
  type ChatWorkspaceState,
  type WorkspaceLayout,
} from './workspace-layout.js';

export interface ChatWorkspaceProps {
  /** The open conversation; null is a new conversation. */
  readonly conversationId: string | null;
  /** What a narrow workspace shows; wider ones show both. */
  readonly view: 'list' | 'conversation';
  readonly onOpen: (conversationId: string) => void;
  readonly onNew: () => void;
  /** "← list" in a narrow workspace. */
  readonly onBack: () => void;
  /** A panel's Close; a page has none. */
  readonly onClose?: (() => void) | undefined;
  /** A panel's expand/restore; a page has none. */
  readonly onExpand?: (() => void) | undefined;
  readonly expanded?: boolean;
  /** Keeps the folded list and the details choice per layout across visits. */
  readonly storageKey?: string;
  /** The list's fold, when the host keeps it (such as shared with another surface); the workspace's own otherwise. */
  readonly listFolded?: boolean | undefined;
  readonly onListFoldedChange?: ((folded: boolean) => void) | undefined;
  readonly list?: Pick<
    ConversationListProps,
    'heading' | 'row' | 'filters' | 'filter' | 'mode'
  >;
  /** The transcript and composer; the registry's `ConversationView` by default. */
  readonly renderBody?:
    ((conversationId: string | null) => ReactNode) | undefined;
  /** Header chips after the agent's, such as a project. */
  readonly metadata?:
    ((conversation: ConversationDetail) => ReactNode) | undefined;
  /** More rows of the details' Session section. */
  readonly detailsMetadata?:
    ((conversation: ConversationDetail) => ReactNode) | undefined;
  readonly detailsTestId?: string;
  /** Wraps the conversation, its details and anything it renders in their place (`aside`). */
  readonly scope?:
    | ((props: {
        readonly conversationId: string | null;
        readonly children: ReactNode;
      }) => ReactNode)
    | undefined;
  readonly onDeleted?: (() => void) | undefined;
  readonly className?: string;
}

interface Choices {
  readonly folded?: boolean;
  readonly details?: boolean;
}

function readChoices(
  key: string | undefined,
): Partial<Record<WorkspaceLayout, Choices>> {
  if (!key) return {};
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

export function ChatWorkspace({
  conversationId,
  view,
  onOpen,
  onNew,
  onBack,
  onClose,
  onExpand,
  expanded = false,
  storageKey,
  listFolded,
  onListFoldedChange,
  list,
  renderBody,
  metadata,
  detailsMetadata,
  detailsTestId,
  scope,
  onDeleted,
  className,
}: ChatWorkspaceProps): ReactElement {
  const rootRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return undefined;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const layout = workspaceLayout(width ?? WIDE_FROM);
  const narrow = layout === 'narrow';
  const [choices, setChoices] = useState(() => readChoices(storageKey));
  const choice = choices[layout] ?? {};
  const choose = useCallback(
    (patch: Choices) =>
      setChoices((current) => {
        const next = { ...current, [layout]: { ...current[layout], ...patch } };
        if (storageKey)
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            // Kept for this visit only.
          }
        return next;
      }),
    [layout, storageKey],
  );
  const folded = !narrow && (listFolded ?? Boolean(choice.folded));
  const setFolded = (next: boolean): void =>
    onListFoldedChange ? onListFoldedChange(next) : choose({ folded: next });
  // Beside the conversation the details follow the remembered choice, open by default; as a sheet they open on demand.
  const [sheetOpen, setSheetOpen] = useState(false);
  const detailsOpen = layout === 'wide' ? choice.details !== false : sheetOpen;
  const setDetailsOpen = useCallback(
    (open: boolean) =>
      layout === 'wide' ? choose({ details: open }) : setSheetOpen(open),
    [layout, choose],
  );
  const asideRef = useRef<{ readonly close: () => void } | null>(null);
  const [asideOpen, setAsideOpen] = useState(false);
  const reportAside = useCallback(
    (aside: { readonly close: () => void } | null) => {
      asideRef.current = aside;
      setAsideOpen(aside !== null);
    },
    [],
  );
  const openDetails = useCallback(() => {
    asideRef.current?.close();
    setDetailsOpen(true);
  }, [setDetailsOpen]);
  const closeCoveringDetails = useCallback(() => setSheetOpen(false), []);
  const state = useMemo<ChatWorkspaceState>(
    () => ({
      layout,
      conversationId,
      newConversation: onNew,
      openDetails,
      closeCoveringDetails,
      reportAside,
    }),
    [
      layout,
      conversationId,
      onNew,
      openDetails,
      closeCoveringDetails,
      reportAside,
    ],
  );
  // Nothing mounts before the first measurement (taken before paint), so a narrow workspace never mounts both.
  const measured = width !== null;
  const showList = measured && (!narrow || view === 'list');
  const showConversation = measured && (!narrow || view === 'conversation');
  // Each stays mounted once shown, so a draft, a scroll position or the list's filters survive switching.
  const [mounted, setMounted] = useState({
    list: showList,
    conversation: showConversation,
  });
  if (
    (showList && !mounted.list) ||
    (showConversation && !mounted.conversation)
  )
    setMounted({
      list: mounted.list || showList,
      conversation: mounted.conversation || showConversation,
    });
  const conversation = (
    <WorkspaceConversation
      conversationId={conversationId}
      narrow={narrow}
      onBack={onBack}
      onNew={onNew}
      onClose={onClose}
      onExpand={onExpand}
      expanded={expanded}
      details={detailsOpen && !asideOpen}
      beside={layout === 'wide'}
      onToggleDetails={() =>
        asideOpen ? openDetails() : setDetailsOpen(!detailsOpen)
      }
      onCloseDetails={() => setDetailsOpen(false)}
      renderBody={renderBody}
      metadata={metadata}
      detailsMetadata={detailsMetadata}
      detailsTestId={detailsTestId}
      onDeleted={onDeleted}
    />
  );
  return (
    <WorkspaceContext.Provider value={state}>
      <div
        ref={rootRef}
        className={cn('relative flex h-full min-h-0 min-w-0 flex-1', className)}
        data-testid='chat-workspace'
        data-layout={layout}
      >
        {folded ? (
          <div
            className='flex w-12 shrink-0 flex-col items-center gap-2 border-r py-3'
            data-testid='session-list-rail'
          >
            <ListRailButtons onUnfold={() => setFolded(false)} onNew={onNew} />
          </div>
        ) : mounted.list ? (
          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-col',
              narrow ? 'flex-1' : 'w-[264px] shrink-0',
            )}
            hidden={!showList}
          >
            <ConversationList
              activeId={narrow ? null : conversationId}
              onOpen={onOpen}
              onNew={onNew}
              heading={list?.heading}
              headerActions={
                // Beside a conversation the list folds instead; Close is in the conversation's header.
                onClose && narrow ? <CloseButton onClose={onClose} /> : null
              }
              onFold={narrow ? undefined : () => setFolded(true)}
              row={list?.row}
              filters={list?.filters}
              filter={list?.filter}
              mode={list?.mode}
              className={narrow ? undefined : 'border-r'}
            />
          </div>
        ) : null}
        {mounted.conversation ? (
          <div
            className='relative flex min-h-0 min-w-0 flex-1'
            hidden={!showConversation}
            data-testid='chat-workspace-conversation'
          >
            {scope
              ? scope({ conversationId, children: conversation })
              : conversation}
          </div>
        ) : null}
      </div>
    </WorkspaceContext.Provider>
  );
}

function ListRailButtons({
  onUnfold,
  onNew,
}: {
  readonly onUnfold: () => void;
  readonly onNew: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  return (
    <>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('chat.history.unfold')}
        title={t('chat.history.unfold')}
        onClick={onUnfold}
        data-testid='session-list-unfold'
      >
        <PanelLeftOpenIcon />
      </Button>
      <Button
        variant='ghost'
        size='icon-sm'
        aria-label={t('chat.newConversation')}
        title={t('chat.newConversation')}
        onClick={onNew}
      >
        <PlusIcon />
      </Button>
    </>
  );
}

function CloseButton({
  onClose,
}: {
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  return (
    <Button
      variant='ghost'
      size='icon-sm'
      className='size-9 shrink-0 [&_svg]:size-4'
      aria-label={t('chat.close')}
      onClick={onClose}
    >
      <XIcon />
    </Button>
  );
}

function WorkspaceConversation({
  conversationId,
  narrow,
  onBack,
  onNew,
  onClose,
  onExpand,
  expanded,
  details,
  beside,
  onToggleDetails,
  onCloseDetails,
  renderBody,
  metadata,
  detailsMetadata,
  detailsTestId,
  onDeleted,
}: {
  readonly conversationId: string | null;
  readonly narrow: boolean;
  readonly onBack: () => void;
  readonly onNew: () => void;
  readonly onClose?: (() => void) | undefined;
  readonly onExpand?: (() => void) | undefined;
  readonly expanded: boolean;
  readonly details: boolean;
  readonly beside: boolean;
  readonly onToggleDetails: () => void;
  readonly onCloseDetails: () => void;
  readonly renderBody?:
    ((conversationId: string | null) => ReactNode) | undefined;
  readonly metadata?:
    ((conversation: ConversationDetail) => ReactNode) | undefined;
  readonly detailsMetadata?:
    ((conversation: ConversationDetail) => ReactNode) | undefined;
  readonly detailsTestId?: string | undefined;
  readonly onDeleted?: (() => void) | undefined;
}): ReactElement {
  const { t } = useChatTranslation();
  const detail = useConversation(conversationId).data ?? null;
  const actions = useConversationActions();
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);
  // The conversation owns its usage read; the details only show the cached snapshot.
  useConversationUsage(
    detail?.snapshot || !detail ? null : conversationId,
    false,
  );
  if (detail?.snapshot)
    return (
      <section className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <ConversationHeader
          title={detail.title || t('chat.untitled')}
          onBack={narrow ? onBack : undefined}
          onClose={onClose}
          onExpand={onExpand}
          expanded={expanded}
        />
        <SnapshotView
          key={`${detail.id}:${detail.updatedAt}`}
          conversation={detail}
        />
      </section>
    );
  return (
    <>
      <section
        className='@container/agent-session flex min-h-0 min-w-0 flex-1 flex-col'
        aria-label={detail?.title ?? undefined}
        data-testid='session-conversation'
      >
        <ConversationHeader
          title={detail?.title?.trim() || t('chat.newConversation')}
          onRename={
            detail
              ? (title) => actions.rename.mutate({ id: detail.id, title })
              : undefined
          }
          onBack={narrow ? onBack : undefined}
          onNew={detail ? onNew : undefined}
          onToggleDetails={detail ? onToggleDetails : undefined}
          details={details}
          onExpand={onExpand}
          expanded={expanded}
          onClose={onClose}
          metadata={
            detail ? (
              <ConversationMetadata conversation={detail}>
                {metadata?.(detail)}
              </ConversationMetadata>
            ) : null
          }
          summary={
            detail && !(beside && details) ? (
              <ConversationAssociationSummary
                conversationId={detail.id}
                onOpenDetails={onToggleDetails}
              />
            ) : null
          }
          menuItems={
            detail ? (
              <>
                <DropdownMenuItem onClick={() => setSharing(true)}>
                  <Share2Icon />
                  {t('chat.sharing.share')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    actions.archive.mutate({
                      id: detail.id,
                      archived: !detail.archivedAt,
                    })
                  }
                >
                  {detail.archivedAt ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                  {detail.archivedAt
                    ? t('chat.list.restore')
                    : t('chat.archive')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setDeleting(true)}
                  data-testid='conversation-delete'
                >
                  <Trash2Icon />
                  {t('chat.delete')}
                </DropdownMenuItem>
              </>
            ) : null
          }
        />
        {renderBody ? (
          renderBody(conversationId)
        ) : (
          <ConversationView conversationId={conversationId} />
        )}
      </section>
      {detail && (
        <ShareConversation
          conversationId={detail.id}
          open={sharing}
          onOpenChange={setSharing}
        />
      )}
      {detail && (
        <DeleteConversationDialog
          conversation={detail}
          open={deleting}
          onOpenChange={setDeleting}
          onDeleted={onDeleted ?? onNew}
        />
      )}
      {detail && (
        <ConversationDetails
          open={details}
          beside={beside}
          conversation={detail}
          onClose={onCloseDetails}
          metadata={detailsMetadata?.(detail)}
          testId={detailsTestId}
        />
      )}
    </>
  );
}
