/**
 * A space's knowledge as people work with it, in two panes whose split can be dragged, with no header above them. On
 * the left (`knowledge-sidebar.tsx`), scrolling on its own: the view's title the full width of the pane (the
 * application's space switcher or the space's name; none where the page around it names it, `title={false}`), the
 * search with the New menu beside it, the proposals waiting for review and the tree of each space. Who may do what is
 * opened from what it applies to: the space's "…" menu opens the space's access, an entry's "…" menus its permissions.
 * On the right the entry, the proposals, the search results, or the space's home. What is open lives in the URL (`hooks/use-view-state.ts`), so a link opens it again. On a narrow screen
 * the list and the content take the screen in turn.
 *
 * The application names the space to show and words its spaces (`labels`): the assembling application shows a project's space with the
 * system's it inherits on the project page's Knowledge tab, and the system's on its system knowledge page.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu.js';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './ui/resizable.js';
import { Skeleton } from './ui/skeleton.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';
import { cn } from 'cn';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  KnowledgeDocSummary,
  KnowledgeSpace,
  SpaceRef,
} from '../../shared/knowledge.js';
import {
  knowledgeKeys,
  useKnowledgeApi,
  useKnowledgeCapabilities,
  useKnowledgeProposals,
  useKnowledgeRefresh,
  useKnowledgeTree,
} from '../api.js';
import type { KnowledgeAccessDetails } from '../lib/access.js';
import { useMediaQuery } from '../hooks/use-media.js';
import { useNotify } from '../hooks/use-notify.js';
import { useFilePicker } from '../hooks/use-file-picker.js';
import { useUpload } from '../hooks/use-upload.js';
import { useViewState } from '../hooks/use-view-state.js';
import { MoveDocDialog, NewDocDialog, RenameDocDialog } from './doc-editor.js';
import { SpaceAccessSheet } from './access-sheet.js';
import { DocPane } from './doc-pane.js';
import {
  EntryActionsContext,
  canAdd,
  type EntryActions,
  type NewEntryKind,
} from '../lib/entry-actions.js';
import { NewEntryMenuContent } from './new-entry-menu.js';
import { EntryIcon } from './file-pane.js';
import { PermissionsDialog } from './permissions-dialog.js';
import { KnowledgeSidebar } from './knowledge-sidebar.js';
import { ProposalDetail, ProposalList } from './proposal-view.js';
import { ProposeFileDialog } from './propose-file.js';
import { isSearchShortcut, searchShortcutLabel } from '../lib/shortcuts.js';
import { KnowledgeSearchDialog } from './search-dialog.js';
import { ChunkingDialog } from './chunking-dialog.js';
import { SearchTestDialog } from './search-test.js';
import { SpaceHome } from './space-home.js';
import {
  directoryKey,
  useDirectory,
  type KnowledgeDirectorySource,
} from '../hooks/use-directory.js';
import { useKnowledgeDoc } from '../api.js';
import { DropdownMenuContent, DropdownMenuItem } from './ui/dropdown-menu.js';
import { Alert, AlertDescription } from './ui/alert.js';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from './ui/empty.js';

/** How the application words its spaces; the plugin's own wording without it. */
export interface KnowledgeViewLabels {
  /** A space's heading in the tree. Defaults to its title. */
  readonly spaceTitle?: (space: KnowledgeSpace) => string;
  /** What a space inherited here is, beside its badge and in a document's facts. */
  readonly inheritedHint?: string;
  /** The badge of a search hit from an inherited space. */
  readonly inheritedHit?: string;
}

export interface KnowledgeViewProps {
  /** The application supplies its authorized directory and global search; single-space mode remains the default. */
  readonly directory?: KnowledgeDirectorySource;
  /** The space shown, with the spaces it inherits. */
  readonly space: SpaceRef;
  readonly labels?: KnowledgeViewLabels;
  /**
   * The view's title, at the top of the left pane: the application's own heading (a space switcher), or `false` where
   * the page around the view already names it (a tab). Defaults to the space's name as the page's heading.
   */
  readonly title?: ReactNode | false;
  /** After a proposal is decided here: the application may refresh what it shows of it (an inbox). */
  readonly onProposalDecided?: () => void;
  /** Who may do what in the space, as the application keeps its roles; the space's access shows only the viewer's without. */
  readonly accessDetails?:
    KnowledgeAccessDetails | ((space: SpaceRef) => KnowledgeAccessDetails);
  /** The view's size: it fills it, each pane scrolling on its own. */
  readonly className?: string;
}

type Dialog =
  | { readonly kind: 'proposeFile'; readonly parentId: string | null }
  | {
      readonly kind: 'new';
      readonly entry: NewEntryKind;
      readonly parentId: string | null;
    }
  | {
      readonly kind: 'rename' | 'move' | 'archive' | 'permissions';
      readonly doc: KnowledgeDocSummary;
    }
  | {
      readonly kind: 'searchTest' | 'search' | 'spaceAccess' | 'chunking';
    };

function SearchResults({
  space,
  q,
  onOpen,
  directory,
  inheritedLabel,
}: {
  readonly inheritedLabel: string | undefined;
  readonly space: SpaceRef;
  readonly q: string;
  readonly onOpen: (docId: string) => void;
  readonly directory?: KnowledgeDirectorySource;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const hits = useQuery({
    queryKey: directory
      ? ['knowledge', 'directory-search', q]
      : knowledgeKeys.search(space, q),
    queryFn: ({ signal }) =>
      directory ? directory.search(q, signal) : api.search(space, q, signal),
    retry: false,
  });
  if (hits.isError)
    return (
      <Alert variant='destructive'>
        <AlertDescription>{t('knowledge.loadFailed')}</AlertDescription>
      </Alert>
    );
  if (hits.isPending) return <Skeleton className='h-24 w-full' />;
  const list = hits.data ?? [];
  return (
    <section className='space-y-3' data-testid='knowledge-search-results'>
      <h2 className='font-heading text-lg font-semibold'>
        {t('knowledge.search.resultsFor', { q })}
      </h2>
      {directory ? (
        <p className='text-sm text-muted-foreground'>
          {t('knowledge.directory.topResults')}
        </p>
      ) : null}
      {list.length === 0 ? (
        <div className='space-y-1 text-sm text-muted-foreground'>
          <p>{t('knowledge.search.empty', { q })}</p>
          <p>{t('knowledge.search.emptyHint')}</p>
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {list.map((hit) => (
            <li key={`${hit.docId}#${hit.lines[0]}`}>
              <button
                type='button'
                className='w-full space-y-1 p-3 text-left hover:bg-muted'
                onClick={() => onOpen(hit.docId)}
              >
                <span className='flex flex-wrap items-center gap-2 text-sm font-medium'>
                  <EntryIcon entry={{ kind: hit.kind, file: null }} />
                  {hit.title}
                  {hit.headingPath.length > 0 ? (
                    <span className='font-normal text-muted-foreground'>
                      § {hit.headingPath.join(' › ')}
                    </span>
                  ) : null}
                  {hit.inherited ? (
                    <Badge variant='outline'>
                      {inheritedLabel ?? t('knowledge.search.inherited')}
                    </Badge>
                  ) : null}
                </span>
                <span className='block text-sm text-muted-foreground wrap-anywhere'>
                  {directory
                    ? [
                        hit.spaceTitle ?? t('knowledge.directory.system'),
                        ...(hit.folderPath ?? []),
                      ].join(' / ')
                    : null}
                </span>
                <span className='block text-sm text-muted-foreground wrap-anywhere'>
                  {hit.excerpt}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function KnowledgeView({
  space,
  labels = {},
  title,
  onProposalDecided,
  accessDetails,
  className,
  directory,
}: KnowledgeViewProps): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  useKnowledgeRefresh();
  const view = useViewState();
  const wide = useMediaQuery('(min-width: 768px)');
  const api = useKnowledgeApi();
  const capabilities = useKnowledgeCapabilities().data;
  const semanticSearch = capabilities?.semanticSearch === true;
  const proposalsEnabled =
    capabilities !== undefined && capabilities.proposals !== false;
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [target, setTarget] = useState<SpaceRef | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const linked = useKnowledgeDoc(directory ? view.doc : null);
  const active = directory
    ? dialog && target
      ? target
      : linked.data
        ? { scope: linked.data.scope, scopeId: linked.data.scopeId }
        : target
    : space;
  const catalog = useDirectory(directory, expanded, active, archived);
  const selectionKey =
    directory && view.doc && linked.data
      ? `${view.doc}:${directoryKey(linked.data)}`
      : null;
  const [seenSelection, setSeenSelection] = useState<string | null>(null);
  if (selectionKey !== seenSelection) {
    setSeenSelection(selectionKey);
    if (selectionKey && linked.data)
      setExpanded(new Set([...expanded, directoryKey(linked.data)]));
  }
  const tree = useKnowledgeTree(space, archived, !directory);
  const proposals = useKnowledgeProposals(
    directory ? active : null,
    'pending',
    true,
    proposalsEnabled &&
      (!directory ||
        (!!active && !(view.doc || view.proposal || view.proposals || view.q))),
  );
  const reviewTotal = useQuery({
    queryKey: ['knowledge', 'review-total'],
    queryFn: ({ signal }) => api.reviewTotal(signal),
    enabled: proposalsEnabled && !!directory,
    retry: false,
  });
  const listed = useKnowledgeProposals(
    null,
    view.proposals ?? 'pending',
    false,
    proposalsEnabled && !directory && !!view.proposals,
  );
  const paged = useQuery({
    queryKey: [
      ...knowledgeKeys.proposals(null, view.proposals ?? 'pending'),
      'page',
      view.proposalPage,
      view.review,
      view.about,
    ],
    queryFn: ({ signal }) =>
      api.proposalPage(
        view.proposalPage,
        view.proposals ?? 'pending',
        view.review && view.proposals === 'pending',
        view.about,
        signal,
      ),
    enabled: proposalsEnabled && !!directory && !!view.proposals,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  const rawSpaces = directory
    ? catalog.entries.map(({ space, docs }) => ({ space, docs }))
    : (tree.data?.spaces ?? []);
  const spaces = rawSpaces.map((entry) =>
    proposalsEnabled
      ? entry
      : {
          ...entry,
          space: {
            ...entry.space,
            access: { ...entry.space.access, propose: false },
          },
          docs: entry.docs.map((doc) => ({
            ...doc,
            pendingProposals: 0,
            access: { ...doc.access, propose: false },
          })),
        },
  );
  const own = directory
    ? spaces.find(
        (entry) => active && directoryKey(entry.space) === directoryKey(active),
      )
    : spaces.find((entry) => !entry.space.inherited);
  const allDocs = spaces.flatMap((entry) => entry.docs);
  const selectedDoc = allDocs.find((doc) => doc.id === view.doc) ?? linked.data;
  const selectedSpace = selectedDoc
    ? spaces.find(
        (entry) => directoryKey(entry.space) === directoryKey(selectedDoc),
      )?.space
    : undefined;
  const paneDocs = directory
    ? selectedDoc
      ? (catalog.entries
          .find(
            (entry) => directoryKey(entry.space) === directoryKey(selectedDoc),
          )
          ?.tree.data?.spaces.flatMap((entry) => entry.docs) ??
        allDocs.filter(
          (doc) => directoryKey(doc) === directoryKey(selectedDoc),
        ))
      : []
    : allDocs;
  const spaceLabel = (item: KnowledgeSpace) =>
    directory && item.scope === directory.sharedScope
      ? t('knowledge.directory.system')
      : (labels.spaceTitle?.(item) ??
        item.title ??
        t('knowledge.spaces.default'));
  const inheritedHint =
    labels.inheritedHint ?? t('knowledge.spaces.inheritedHint');
  const access = own?.space.access ?? {
    read: false,
    propose: false,
    edit: false,
    manage: false,
  };
  // The proposals of the view's spaces.
  const viewSpaces = new Set(
    spaces.map((entry) => `${entry.space.scope}:${entry.space.scopeId}`),
  );
  const inView = (item: { readonly scope: string; readonly scopeId: string }) =>
    viewSpaces.has(`${item.scope}:${item.scopeId}`);
  // Global review and author-visible lists follow the proposal service's node permissions, independently of project metadata visibility.
  const pending = directory
    ? (proposals.data ?? [])
    : (proposals.data ?? []).filter(inView);
  const ownRef = own
    ? { scope: own.space.scope, scopeId: own.space.scopeId }
    : null;
  // Someone may edit an entry without editing the space: the server decides each upload.
  const upload = useUpload(ownRef);
  const picker = useFilePicker(
    t('knowledge.files.upload'),
    (files, parentId, chosenSpace) =>
      upload.upload(files, parentId, chosenSpace ?? ownRef ?? undefined),
  );

  const open = (docId: string) => view.show({ doc: docId });
  const home = () => view.show({});
  const showing = !!(view.doc || view.proposal || view.proposals || view.q);

  // A new entry, proposal or list starts at the top, unless lines of it are shown (the document scrolls to them).
  const showingLines = view.lines !== null;
  useEffect(() => {
    if (!showingLines) contentRef.current?.scrollTo({ top: 0 });
  }, [
    view.doc,
    view.proposal,
    view.proposals,
    view.proposalPage,
    view.q,
    view.mode,
    showingLines,
  ]);

  // ⌘K / Ctrl+K opens the search while the view is shown.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) return;
      event.preventDefault();
      setDialog({ kind: 'search' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const act = useMutation({
    mutationFn: (input: {
      readonly id: string;
      readonly action: 'archive' | 'restore';
    }) => api.act(input.id, input.action),
    onSuccess: (_, input) => {
      notify.success(
        t(
          input.action === 'archive'
            ? 'knowledge.doc.archivedToast'
            : 'knowledge.doc.restoredToast',
        ),
      );
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
    },
    onError: (error) => notify.error(error),
  });

  const actions: EntryActions | null = own ? forSpace(own.space) : null;

  const loadError = directory ? catalog.summaries.error : tree.error;
  if ((!directory && tree.isError) || (directory && catalog.summaries.isError))
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {loadError instanceof ApiClientError &&
          [403, 404].includes(loadError.status)
            ? t('knowledge.directory.noAccess')
            : t('knowledge.loadFailed')}
        </AlertDescription>
        {!(loadError instanceof ApiClientError && loadError.status < 500) ? (
          <Button
            variant='outline'
            onClick={() =>
              void (directory ? catalog.summaries.refetch() : tree.refetch())
            }
          >
            {t('knowledge.directory.retry')}
          </Button>
        ) : null}
      </Alert>
    );

  const heading =
    title === false
      ? null
      : (title ?? (
          <h1 className='truncate font-heading text-lg font-semibold'>
            {own ? spaceLabel(own.space) : t('knowledge.title')}
          </h1>
        ));
  const creationParent =
    selectedDoc?.kind === 'folder' &&
    !selectedDoc.archivedAt &&
    own &&
    directoryKey(selectedDoc) === directoryKey(own.space)
      ? selectedDoc
      : null;
  const creationAccess = creationParent?.access ?? access;
  const newMenu =
    actions && canAdd(creationAccess) ? (
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button size='icon' aria-label={t('knowledge.new.label')} />
                }
              />
            }
          >
            <PlusIcon />
          </TooltipTrigger>
          <TooltipContent>{t('knowledge.new.label')}</TooltipContent>
        </Tooltip>
        <NewEntryMenuContent
          actions={{ ...actions, access: creationAccess }}
          parentId={creationParent?.id ?? null}
        />
      </DropdownMenu>
    ) : directory && spaces.some((entry) => canAdd(entry.space.access)) ? (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size='icon'
              aria-label={t('knowledge.directory.chooseTarget')}
            />
          }
        >
          <PlusIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-auto min-w-40' align='end'>
          {spaces
            .filter((entry) => canAdd(entry.space.access))
            .map((entry) => (
              <DropdownMenuItem
                key={directoryKey(entry.space)}
                onClick={() => {
                  setTarget(entry.space);
                  view.show({});
                  setExpanded(
                    (current) =>
                      new Set([...current, directoryKey(entry.space)]),
                  );
                }}
              >
                {spaceLabel(entry.space)}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  function forSpace(item: KnowledgeSpace): EntryActions {
    const choose = () => setTarget(item);
    return {
      access: proposalsEnabled
        ? item.access
        : { ...item.access, propose: false },
      newEntry: (entry, parentId) => {
        choose();
        setDialog({ kind: 'new', entry, parentId });
      },
      upload: (parentId) => {
        choose();
        picker.open(parentId, item);
      },
      proposeFile: (parentId = null) => {
        choose();
        setDialog({ kind: 'proposeFile', parentId });
      },
      rename: (doc) => {
        choose();
        setDialog({ kind: 'rename', doc });
      },
      move: (doc) => {
        choose();
        setDialog({ kind: 'move', doc });
      },
      archive: (doc) => {
        choose();
        setDialog({ kind: 'archive', doc });
      },
      restore: (doc) => act.mutate({ id: doc.id, action: 'restore' }),
      permissions: (doc) => {
        choose();
        setDialog({ kind: 'permissions', doc });
      },
      spaceAccess: () => {
        choose();
        setDialog({ kind: 'spaceAccess' });
      },
      ...(semanticSearch
        ? {
            searchTest: () => {
              choose();
              setDialog({ kind: 'searchTest' });
            },
            chunking: () => {
              choose();
              setDialog({ kind: 'chunking' });
            },
          }
        : {}),
    };
  }

  const sidebar = (
    <KnowledgeSidebar
      spaces={
        directory
          ? catalog.entries.map((entry) => ({
              ...entry,
              space: proposalsEnabled
                ? entry.space
                : {
                    ...entry.space,
                    access: { ...entry.space.access, propose: false },
                  },
              docs: proposalsEnabled
                ? entry.docs
                : entry.docs.map((doc) => ({
                    ...doc,
                    pendingProposals: 0,
                    access: { ...doc.access, propose: false },
                  })),
              expanded: expanded.has(directoryKey(entry.space)),
              onExpanded: (open: boolean) =>
                setExpanded((current) => {
                  const next = new Set(current);
                  if (open) next.add(directoryKey(entry.space));
                  else next.delete(directoryKey(entry.space));
                  return next;
                }),
              loading: entry.tree.isPending,
              error: entry.tree.isError,
              onRetry:
                entry.tree.error instanceof ApiClientError &&
                entry.tree.error.status < 500
                  ? undefined
                  : () => void entry.tree.refetch(),
              actions: forSpace(entry.space),
              onDropFiles: (files: File[], parentId: string | null) =>
                upload.upload(files, parentId, entry.space),
              archivedDocuments: archived ? entry.archivedDocuments : 0,
              hint:
                entry.space.scope === directory.sharedScope
                  ? directory.sharedLabel
                  : undefined,
              onSelectSpace: () => {
                setTarget(entry.space);
                view.show({});
              },
            }))
          : spaces
      }
      loading={directory ? catalog.summaries.isPending : tree.isPending}
      spaceLabel={spaceLabel}
      inheritedHint={inheritedHint}
      selected={view.doc}
      onSelect={open}
      pending={
        proposalsEnabled
          ? directory
            ? (reviewTotal.data ?? 0)
            : pending.length
          : 0
      }
      reviewing={
        directory
          ? view.review && (!!view.proposals || !!view.proposal)
          : !!view.proposals || !!view.proposal
      }
      proposalsActive={
        !!directory && !view.review && (!!view.proposals || !!view.proposal)
      }
      onReview={() =>
        view.show({
          proposals: 'pending',
          ...(directory ? { review: 'true' } : {}),
        })
      }
      onProposals={
        proposalsEnabled ? () => view.show({ proposals: 'pending' }) : undefined
      }
      onSearch={() => setDialog({ kind: 'search' })}
      onDropFiles={
        !directory && own
          ? (files, parentId) => upload.upload(files, parentId)
          : null
      }
      archived={archived}
      onArchived={directory || access.edit ? setArchived : null}
      searchShortcut={searchShortcutLabel()}
      heading={heading}
      toolbar={newMenu}
      directoryControls={
        directory ? (
          <>
            <p className='px-2 text-xs text-muted-foreground'>
              {own
                ? t('knowledge.directory.target', {
                    title: spaceLabel(own.space),
                  })
                : t('knowledge.directory.chooseTarget')}
            </p>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant='ghost'
                size='sm'
                disabled={catalog.summaries.isPending || spaces.length === 0}
                onClick={() =>
                  setExpanded(
                    new Set(spaces.map((entry) => directoryKey(entry.space))),
                  )
                }
              >
                {t('knowledge.directory.expandAll')}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setExpanded(new Set());
                }}
              >
                {t('knowledge.directory.collapseAll')}
              </Button>
            </div>
          </>
        ) : undefined
      }
    />
  );

  const activeProposal = proposalsEnabled ? view.proposal : null;
  const activeProposals = proposalsEnabled ? view.proposals : null;
  const content = activeProposal ? (
    <ProposalDetail
      id={activeProposal}
      onBack={() =>
        view.show({
          proposals: 'pending',
          ...(view.review ? { review: 'true' } : {}),
          ...(directory && view.proposalPage > 1
            ? { proposalPage: String(view.proposalPage) }
            : {}),
        })
      }
      onDecided={() => {
        view.show({
          proposals: 'pending',
          ...(view.review ? { review: 'true' } : {}),
        });
        onProposalDecided?.();
      }}
      onOpenDoc={open}
    />
  ) : activeProposals && directory && paged.isError ? (
    <Alert variant='destructive'>
      <AlertDescription>{t('knowledge.loadFailed')}</AlertDescription>
      {!(paged.error instanceof ApiClientError && paged.error.status < 500) ? (
        <Button variant='outline' onClick={() => void paged.refetch()}>
          {t('knowledge.directory.retry')}
        </Button>
      ) : null}
    </Alert>
  ) : activeProposals ? (
    <ProposalList
      contextLabel={
        directory
          ? (proposal) => {
              const entry = spaces.find(
                (item) => directoryKey(item.space) === directoryKey(proposal),
              );
              return entry ? spaceLabel(entry.space) : '';
            }
          : undefined
      }
      status={activeProposals}
      onStatus={(status) => view.set({ proposals: status, proposalPage: null })}
      proposals={(directory
        ? (paged.data?.data ?? [])
        : (listed.data ?? [])
      ).filter(
        (item) =>
          (directory || inView(item)) &&
          (!view.about || item.docId === view.about),
      )}
      loading={directory ? paged.isPending : listed.isPending}
      pagination={
        directory && paged.data
          ? {
              ...paged.data.meta,
              busy: paged.isFetching,
              onPage: (page) => view.set({ proposalPage: String(page) }),
            }
          : undefined
      }
      about={
        view.about
          ? (allDocs.find((doc) => doc.id === view.about)?.title ?? null)
          : null
      }
      onClearAbout={() => view.set({ about: null, proposalPage: null })}
      onOpen={(id) =>
        view.show({
          proposal: id,
          ...(view.review ? { review: 'true' } : {}),
          ...(directory && view.proposalPage > 1
            ? { proposalPage: String(view.proposalPage) }
            : {}),
        })
      }
    />
  ) : view.doc ? (
    <DocPane
      proposalsEnabled={proposalsEnabled}
      key={view.doc}
      docId={view.doc}
      inherited={selectedSpace?.inherited === true}
      inheritedHint={labels.inheritedHint}
      spaceLabel={
        selectedSpace
          ? spaceLabel(selectedSpace)
          : linked.data
            ? (spaces.find(
                (entry) =>
                  directoryKey(entry.space) === directoryKey(linked.data),
              )?.space.title ??
              t(
                linked.data.scope === directory?.sharedScope
                  ? 'knowledge.directory.system'
                  : 'knowledge.title',
              ))
            : own
              ? spaceLabel(own.space)
              : t('knowledge.title')
      }
      mode={view.mode}
      version={view.version}
      docs={paneDocs}
      onMode={(mode) => view.set({ mode: mode === 'read' ? null : mode })}
      onVersion={(version) =>
        view.set({ version: version ? String(version) : null, mode: null })
      }
      onOpen={open}
      onHome={home}
      onProposals={(docId) => view.show({ proposals: 'pending', about: docId })}
      lines={view.lines}
      onLines={(lines) =>
        view.set({
          lines: lines ? `${lines[0]}-${lines[1]}` : null,
          mode: null,
          version: null,
        })
      }
    />
  ) : view.q ? (
    <SearchResults
      space={space}
      q={view.q}
      onOpen={open}
      inheritedLabel={labels.inheritedHit}
      directory={directory}
    />
  ) : (directory ? catalog.summaries.isPending : tree.isPending) ? (
    <Skeleton className='h-40 w-full' />
  ) : directory && spaces.length === 0 ? (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyTitle>{t('knowledge.directory.empty')}</EmptyTitle>
        <EmptyDescription>
          {t('knowledge.directory.emptyAccessHint')}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : directory && !own ? (
    <div className='flex flex-col gap-2'>
      <h2 className='font-heading text-lg font-semibold'>
        {t('knowledge.directory.title')}
      </h2>
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.directory.welcome')}
      </p>
    </div>
  ) : (
    <SpaceHome
      space={ownRef}
      spaceLabel={own ? spaceLabel(own.space) : t('knowledge.title')}
      docs={directory ? (own?.docs ?? []) : allDocs}
      ownDocs={own?.docs ?? []}
      pending={
        !proposalsEnabled
          ? []
          : directory && own
            ? pending.filter(
                (proposal) =>
                  directoryKey(proposal) === directoryKey(own.space),
              )
            : pending
      }
      actions={actions}
      onOpen={open}
      onProposal={(id) => view.show({ proposal: id })}
      onProposals={() => view.show({ proposals: 'pending' })}
    />
  );

  const contentPane = (
    <div
      ref={contentRef}
      className='@container h-full overflow-y-auto overscroll-y-contain'
    >
      <div className='min-h-full p-4 md:p-6'>
        {!wide ? (
          <Button variant='ghost' className='mb-3 -ml-2' onClick={home}>
            <ArrowLeftIcon data-icon='inline-start' />
            {t('knowledge.tree.back')}
          </Button>
        ) : null}
        {content}
      </div>
    </div>
  );

  return (
    <EntryActionsContext.Provider value={actions}>
      <div
        className={cn('flex min-h-0 min-w-0 flex-col', className)}
        data-testid='knowledge-view'
      >
        {wide ? (
          <ResizablePanelGroup
            orientation='horizontal'
            className='min-h-0 flex-1 rounded-lg border'
          >
            <ResizablePanel
              defaultSize={260}
              minSize={200}
              maxSize={480}
              groupResizeBehavior='preserve-pixel-size'
            >
              {sidebar}
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel minSize={320}>{contentPane}</ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className='min-h-0 flex-1 overflow-hidden rounded-lg border'>
            {showing ? contentPane : sidebar}
          </div>
        )}
      </div>
      {picker.input}
      {dialog?.kind === 'search' ? (
        <KnowledgeSearchDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          space={space}
          inheritedLabel={labels.inheritedHit}
          directory={directory}
          onOpen={open}
          onAll={(q) => view.show({ q })}
        />
      ) : null}
      {semanticSearch && dialog?.kind === 'searchTest' ? (
        <SearchTestDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          space={target ?? space}
          onOpen={(docId, lines) =>
            view.show({
              doc: docId,
              lines: lines ? `${lines[0]}-${lines[1]}` : null,
            })
          }
        />
      ) : null}
      {dialog?.kind === 'new' && own ? (
        <NewDocDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          space={{ scope: own.space.scope, scopeId: own.space.scopeId }}
          spaceLabel={spaceLabel(own.space)}
          access={own.space.access}
          onProposed={() => view.show({ proposals: 'pending' })}
          docs={own.docs}
          parentId={dialog.parentId}
          kind={dialog.entry}
          onCreated={(doc) => open(doc.id)}
        />
      ) : null}
      {dialog?.kind === 'rename' ? (
        <RenameDocDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          doc={dialog.doc}
        />
      ) : null}
      {dialog?.kind === 'move' ? (
        <MoveDocDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          doc={dialog.doc}
          docs={directory ? (own?.docs ?? []) : allDocs}
        />
      ) : null}
      {dialog?.kind === 'permissions' && ownRef && own ? (
        <PermissionsDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          doc={dialog.doc}
          space={ownRef}
          spaceLabel={spaceLabel(
            spaces.find((entry) =>
              entry.docs.some((doc) => doc.id === dialog.doc.id),
            )?.space ?? own.space,
          )}
          // Changed only in the space it belongs to, not one it is inherited into.
          editable={
            dialog.doc.access.manage &&
            own.docs.some((doc) => doc.id === dialog.doc.id)
          }
        />
      ) : null}
      {dialog?.kind === 'spaceAccess' && own ? (
        <SpaceAccessSheet
          proposalsEnabled={proposalsEnabled}
          open
          onOpenChange={(next) => !next && setDialog(null)}
          access={access}
          spaceLabel={spaceLabel(own.space)}
          details={
            typeof accessDetails === 'function'
              ? accessDetails(own.space)
              : accessDetails
          }
        />
      ) : null}
      {semanticSearch && dialog?.kind === 'chunking' && ownRef && own ? (
        <ChunkingDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          space={ownRef}
          spaceLabel={spaceLabel(own.space)}
        />
      ) : null}
      {dialog?.kind === 'proposeFile' && ownRef ? (
        <ProposeFileDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          target={{
            kind: 'create',
            space: ownRef,
            parentId: dialog.parentId,
            label: [
              own ? spaceLabel(own.space) : '',
              own?.docs.find((doc) => doc.id === dialog.parentId)?.title,
            ]
              .filter(Boolean)
              .join(' / '),
          }}
        />
      ) : null}
      <AlertDialog
        open={dialog?.kind === 'archive'}
        onOpenChange={(next) => !next && setDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('knowledge.doc.archiveTitle', {
                title: dialog?.kind === 'archive' ? dialog.doc.title : '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('knowledge.doc.archiveDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('knowledge.editor.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                if (dialog?.kind === 'archive')
                  act.mutate({ id: dialog.doc.id, action: 'archive' });
                setDialog(null);
              }}
            >
              {t('knowledge.doc.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EntryActionsContext.Provider>
  );
}
