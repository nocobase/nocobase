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
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  useKnowledgeProposals,
  useKnowledgeRefresh,
  useKnowledgeSearch,
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
  readonly accessDetails?: KnowledgeAccessDetails;
  /** The view's size: it fills it, each pane scrolling on its own. */
  readonly className?: string;
}

type Dialog =
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
      readonly kind:
        'proposeFile' | 'searchTest' | 'search' | 'spaceAccess' | 'chunking';
    };

function SearchResults({
  space,
  q,
  onOpen,
  inheritedLabel,
}: {
  readonly inheritedLabel: string | undefined;
  readonly space: SpaceRef;
  readonly q: string;
  readonly onOpen: (docId: string) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const hits = useKnowledgeSearch(space, q);
  if (hits.isPending) return <Skeleton className='h-24 w-full' />;
  const list = hits.data ?? [];
  return (
    <section className='space-y-3' data-testid='knowledge-search-results'>
      <h2 className='font-heading text-lg font-semibold'>
        {t('knowledge.search.resultsFor', { q })}
      </h2>
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
}: KnowledgeViewProps): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  useKnowledgeRefresh();
  const view = useViewState();
  const wide = useMediaQuery('(min-width: 768px)');
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [archived, setArchived] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const tree = useKnowledgeTree(space, archived);
  const proposals = useKnowledgeProposals(null);
  const listed = useKnowledgeProposals(null, view.proposals ?? 'pending');
  const contentRef = useRef<HTMLDivElement>(null);

  const spaces = tree.data?.spaces ?? [];
  const own = spaces.find((entry) => !entry.space.inherited);
  const allDocs = spaces.flatMap((entry) => entry.docs);
  const selectedDoc = allDocs.find((doc) => doc.id === view.doc);
  const selectedSpace = selectedDoc
    ? spaces.find((entry) => entry.docs.includes(selectedDoc))?.space
    : undefined;
  const spaceLabel = (item: KnowledgeSpace) =>
    labels.spaceTitle?.(item) ?? item.title ?? t('knowledge.spaces.default');
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
  const pending = (proposals.data ?? []).filter(inView);
  const ownRef = own
    ? { scope: own.space.scope, scopeId: own.space.scopeId }
    : null;
  // Someone may edit an entry without editing the space: the server decides each upload.
  const upload = useUpload(ownRef);
  const picker = useFilePicker(t('knowledge.files.upload'), (files, parentId) =>
    upload.upload(files, parentId),
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

  const actions: EntryActions | null = own
    ? {
        access,
        newEntry: (entry, parentId) =>
          setDialog({ kind: 'new', entry, parentId }),
        upload: picker.open,
        proposeFile: () => setDialog({ kind: 'proposeFile' }),
        rename: (doc) => setDialog({ kind: 'rename', doc }),
        move: (doc) => setDialog({ kind: 'move', doc }),
        archive: (doc) => setDialog({ kind: 'archive', doc }),
        restore: (doc) => act.mutate({ id: doc.id, action: 'restore' }),
        permissions: (doc) => setDialog({ kind: 'permissions', doc }),
        spaceAccess: () => setDialog({ kind: 'spaceAccess' }),
        searchTest: () => setDialog({ kind: 'searchTest' }),
        chunking: () => setDialog({ kind: 'chunking' }),
      }
    : null;

  if (tree.isError)
    return (
      <p className='text-sm text-muted-foreground'>
        {tree.error instanceof ApiClientError && tree.error.status === 404
          ? t('knowledge.doc.notFound')
          : t('knowledge.loadFailed')}
      </p>
    );

  const heading =
    title === false
      ? null
      : (title ?? (
          <h1 className='truncate font-heading text-lg font-semibold'>
            {own ? spaceLabel(own.space) : t('knowledge.title')}
          </h1>
        ));
  const newMenu =
    actions && canAdd(access) ? (
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
        <NewEntryMenuContent actions={actions} />
      </DropdownMenu>
    ) : null;

  const sidebar = (
    <KnowledgeSidebar
      spaces={spaces}
      loading={tree.isPending}
      spaceLabel={spaceLabel}
      inheritedHint={inheritedHint}
      selected={view.doc}
      onSelect={open}
      pending={pending.length}
      reviewing={!!view.proposals || !!view.proposal}
      onReview={() => view.show({ proposals: 'pending' })}
      onSearch={() => setDialog({ kind: 'search' })}
      onDropFiles={
        own ? (files, parentId) => upload.upload(files, parentId) : null
      }
      archived={archived}
      onArchived={access.edit ? setArchived : null}
      searchShortcut={searchShortcutLabel()}
      heading={heading}
      toolbar={newMenu}
    />
  );

  const content = view.proposal ? (
    <ProposalDetail
      id={view.proposal}
      onBack={() => view.show({ proposals: 'pending' })}
      onDecided={() => {
        view.show({ proposals: 'pending' });
        onProposalDecided?.();
      }}
      onOpenDoc={open}
    />
  ) : view.proposals ? (
    <ProposalList
      status={view.proposals}
      onStatus={(status) => view.set({ proposals: status })}
      proposals={(listed.data ?? []).filter(
        (item) => inView(item) && (!view.about || item.docId === view.about),
      )}
      loading={listed.isPending}
      about={
        view.about
          ? (allDocs.find((doc) => doc.id === view.about)?.title ?? null)
          : null
      }
      onClearAbout={() => view.set({ about: null })}
      onOpen={(id) => view.show({ proposal: id })}
    />
  ) : view.doc ? (
    <DocPane
      key={view.doc}
      docId={view.doc}
      inherited={selectedSpace?.inherited === true}
      inheritedHint={labels.inheritedHint}
      spaceLabel={
        selectedSpace
          ? spaceLabel(selectedSpace)
          : own
            ? spaceLabel(own.space)
            : t('knowledge.title')
      }
      mode={view.mode}
      version={view.version}
      docs={allDocs}
      onMode={(mode) => view.set({ mode: mode === 'read' ? null : mode })}
      onVersion={(version) =>
        view.set({ version: version ? String(version) : null })
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
    />
  ) : tree.isPending ? (
    <Skeleton className='h-40 w-full' />
  ) : (
    <SpaceHome
      space={ownRef}
      spaceLabel={own ? spaceLabel(own.space) : t('knowledge.title')}
      docs={allDocs}
      ownDocs={own?.docs ?? []}
      pending={pending}
      actions={actions}
      onOpen={open}
      onProposal={(id) => view.show({ proposal: id })}
      onProposals={() => view.show({ proposals: 'pending' })}
    />
  );

  const contentPane = (
    <div ref={contentRef} className='@container h-full overflow-y-auto'>
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
          onOpen={open}
          onAll={(q) => view.show({ q })}
        />
      ) : null}
      {dialog?.kind === 'searchTest' ? (
        <SearchTestDialog
          open
          onOpenChange={(next) => !next && setDialog(null)}
          space={space}
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
          docs={allDocs}
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
          open
          onOpenChange={(next) => !next && setDialog(null)}
          access={access}
          spaceLabel={spaceLabel(own.space)}
          details={accessDetails}
        />
      ) : null}
      {dialog?.kind === 'chunking' && ownRef && own ? (
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
          target={{ kind: 'create', space: ownRef }}
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
