/**
 * Writing knowledge: an entry's editor and the dialogs of new, renamed and moved entries.
 *
 * The editor takes the document's place: a bar pinned at the top says what is being done and holds the change note and
 * Cancel / Save; the title is edited where it reads; an article's Markdown is written beside its preview (in tabs on a
 * narrow pane), the field growing with the text; the summary is in the Properties sheet. Saving makes the next version
 * against the version read, with a conflict explained when someone saved meanwhile. Someone who may propose but not
 * edit gets the same editor, where the note is the reason and Save submits the change as a proposal.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontalIcon } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { Alert, AlertDescription } from './ui/alert.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Field, FieldDescription, FieldLabel } from './ui/field.js';
import { Input } from './ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet.js';
import { Spinner } from './ui/spinner.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';
import { Textarea } from './ui/textarea.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  KNOWLEDGE_NOTE_MAX,
  KNOWLEDGE_REASON_MAX,
  KNOWLEDGE_SUMMARY_MAX,
  KNOWLEDGE_TITLE_MAX,
  type KnowledgeDoc,
  type KnowledgeDocSummary,
  type SpaceRef,
} from '../../shared/knowledge.js';
import { useNotify } from '../hooks/use-notify.js';
import { useElementWidth } from '../hooks/use-media.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';
import type { NewEntryKind } from '../lib/entry-actions.js';
import { KnowledgeMarkdown } from './markdown.js';

/** The Markdown field, growing with its text. */
function MarkdownField({
  value,
  onChange,
  id,
  className,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly id: string;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Textarea
      id={id}
      value={value}
      aria-label={t('knowledge.editor.content')}
      className={className ?? 'min-h-96 font-mono text-sm leading-6'}
      placeholder={t('knowledge.editor.contentPlaceholder')}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function Preview({ content }: { readonly content: string }): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return content.trim() ? (
    <KnowledgeMarkdown content={content} />
  ) : (
    <p className='text-sm text-muted-foreground'>
      {t('knowledge.editor.nothingToPreview')}
    </p>
  );
}

/** Markdown beside its preview on a wide pane, in tabs on a narrow one. */
function SplitEditor({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  return (
    <div ref={ref}>
      {width >= 880 ? (
        <div className='grid grid-cols-2 gap-6'>
          <MarkdownField
            id='knowledge-content'
            value={value}
            onChange={onChange}
          />
          <section
            aria-label={t('knowledge.editor.preview')}
            className='min-w-0 rounded-lg border p-4'
          >
            <Preview content={value} />
          </section>
        </div>
      ) : (
        <Tabs defaultValue='write'>
          <TabsList variant='line'>
            <TabsTrigger value='write'>
              {t('knowledge.editor.write')}
            </TabsTrigger>
            <TabsTrigger value='preview'>
              {t('knowledge.editor.preview')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='write'>
            <MarkdownField
              id='knowledge-content'
              value={value}
              onChange={onChange}
            />
          </TabsContent>
          <TabsContent value='preview'>
            <div className='min-h-40 rounded-lg border p-4'>
              <Preview content={value} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export function DocEditor({
  doc,
  propose = false,
  onDone,
}: {
  readonly doc: KnowledgeDoc;
  /** Save submits the change as a proposal, for someone who may propose but not edit. */
  readonly propose?: boolean;
  readonly onDone: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(doc.title);
  const [summary, setSummary] = useState(doc.summary);
  const [content, setContent] = useState(doc.content);
  const [note, setNote] = useState('');
  const [properties, setProperties] = useState(false);
  const [conflict, setConflict] = useState<number | null>(null);
  const article = doc.kind === 'article';
  const folder = doc.kind === 'folder';
  const save = useMutation({
    mutationFn: async () => {
      if (propose) {
        await api.propose({
          kind: 'update',
          docId: doc.id,
          baseVersion: doc.version,
          reason: note.trim(),
          ...(title !== doc.title ? { title } : {}),
          ...(summary !== doc.summary ? { summary } : {}),
          content,
        });
        return null;
      }
      return api.update(doc.id, {
        expectedVersion: doc.version,
        title,
        ...(folder ? {} : { summary }),
        ...(article ? { content } : {}),
        ...(note.trim() && !folder ? { note: note.trim() } : {}),
      });
    },
    onSuccess: (saved) => {
      notify.success(
        saved === null
          ? t('knowledge.editor.proposed')
          : saved.version === doc.version
            ? t('knowledge.editor.unchanged')
            : t('knowledge.editor.saved', { version: saved.version }),
      );
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      onDone();
    },
    onError: (error) => {
      if (
        error instanceof ApiClientError &&
        error.reason === 'KNOWLEDGE_VERSION_CONFLICT'
      ) {
        const current = (
          error.payload as { details?: { currentVersion?: number } } | undefined
        )?.details?.currentVersion;
        setConflict(current ?? doc.version + 1);
        return;
      }
      notify.error(error);
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  const ready = title.trim() !== '' && (!propose || note.trim() !== '');
  return (
    <form
      className='space-y-4'
      onSubmit={submit}
      data-testid='knowledge-editor'
      data-propose={propose || undefined}
    >
      <div className='sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-2 backdrop-blur-md md:-mx-6 md:px-6'>
        <span className='shrink-0 text-sm font-medium'>
          {propose
            ? t('knowledge.editor.proposing')
            : t('knowledge.editor.editing')}
        </span>
        {folder ? (
          <span className='flex-1' />
        ) : (
          <Input
            value={note}
            required={propose}
            maxLength={propose ? KNOWLEDGE_REASON_MAX : KNOWLEDGE_NOTE_MAX}
            aria-label={
              propose
                ? t('knowledge.proposals.reason')
                : t('knowledge.editor.note')
            }
            placeholder={
              propose
                ? t('knowledge.editor.reasonPlaceholder')
                : t('knowledge.editor.notePlaceholder')
            }
            className='min-w-40 flex-1'
            onChange={(event) => setNote(event.target.value)}
          />
        )}
        <div className='flex shrink-0 gap-2'>
          {folder ? null : (
            <Button
              type='button'
              variant='outline'
              size='icon'
              aria-label={t('knowledge.editor.properties')}
              title={t('knowledge.editor.properties')}
              onClick={() => setProperties(true)}
            >
              <SlidersHorizontalIcon />
            </Button>
          )}
          <Button type='button' variant='outline' onClick={onDone}>
            {t('knowledge.editor.cancel')}
          </Button>
          <Button type='submit' disabled={save.isPending || !ready}>
            {save.isPending ? <Spinner data-icon='inline-start' /> : null}
            {propose
              ? t('knowledge.editor.submitProposal')
              : t('knowledge.editor.save')}
          </Button>
        </div>
      </div>
      {conflict !== null ? (
        <Alert variant='destructive'>
          <AlertDescription className='flex flex-wrap items-center gap-2'>
            {t('knowledge.editor.conflict', { version: conflict })}
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: knowledgeKeys.all,
                });
                onDone();
              }}
            >
              {t('knowledge.editor.reload')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <input
        value={title}
        maxLength={KNOWLEDGE_TITLE_MAX}
        required
        aria-label={t('knowledge.editor.title')}
        placeholder={t('knowledge.editor.title')}
        className='w-full bg-transparent font-heading text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground'
        onChange={(event) => setTitle(event.target.value)}
      />
      {article ? <SplitEditor value={content} onChange={setContent} /> : null}
      {folder ? null : (
        <Sheet open={properties} onOpenChange={setProperties}>
          <SheetContent className='w-full gap-0 data-[side=right]:sm:max-w-xl'>
            <SheetHeader className='border-b pr-12'>
              <SheetTitle>{t('knowledge.editor.properties')}</SheetTitle>
              <SheetDescription>
                {t('knowledge.editor.propertiesHint')}
              </SheetDescription>
            </SheetHeader>
            <div className='min-h-0 flex-1 space-y-4 overflow-y-auto p-4'>
              <Field>
                <FieldLabel htmlFor='knowledge-summary'>
                  {t('knowledge.editor.summary')}
                </FieldLabel>
                <Textarea
                  id='knowledge-summary'
                  value={summary}
                  rows={3}
                  maxLength={KNOWLEDGE_SUMMARY_MAX}
                  onChange={(event) => setSummary(event.target.value)}
                />
                <FieldDescription>
                  {t('knowledge.editor.summaryHint')}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor='knowledge-slug'>
                  {t('knowledge.editor.slug')}
                </FieldLabel>
                <Input
                  id='knowledge-slug'
                  value={doc.slug}
                  readOnly
                  className='font-mono'
                />
              </Field>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </form>
  );
}

const ROOT = '__root__';

/** The entries an entry may go under: its space's folders and articles, not itself or what is below it. */
function parentOptions(
  docs: readonly KnowledgeDocSummary[],
  exclude: string | null,
): KnowledgeDocSummary[] {
  const below = new Set<string>();
  if (exclude) {
    below.add(exclude);
    let grew = true;
    while (grew) {
      grew = false;
      for (const doc of docs)
        if (doc.parentId && below.has(doc.parentId) && !below.has(doc.id)) {
          below.add(doc.id);
          grew = true;
        }
    }
  }
  return docs.filter(
    (doc) => !below.has(doc.id) && !doc.archivedAt && doc.kind !== 'file',
  );
}

function ParentSelect({
  docs,
  value,
  onChange,
}: {
  readonly docs: readonly KnowledgeDocSummary[];
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const items = [
    { value: ROOT, label: t('knowledge.doc.root') },
    ...docs.map((doc) => ({ value: doc.id, label: doc.title })),
  ];
  return (
    <Select
      items={items}
      value={value ?? ROOT}
      onValueChange={(next: string | null) =>
        onChange(!next || next === ROOT ? null : next)
      }
    >
      <SelectTrigger id='knowledge-parent' className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function NewDocDialog({
  open,
  onOpenChange,
  space,
  docs,
  parentId,
  kind: initialKind = 'article',
  onCreated,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly space: SpaceRef;
  readonly docs: readonly KnowledgeDocSummary[];
  readonly parentId: string | null;
  readonly kind?: NewEntryKind;
  readonly onCreated: (doc: KnowledgeDoc) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [kind, setKind] = useState<NewEntryKind>(initialKind);
  const [parent, setParent] = useState<string | null>(parentId);
  const folder = kind === 'folder';
  const create = useMutation({
    mutationFn: () =>
      api.create({
        ...space,
        kind,
        title,
        ...(folder ? {} : { content }),
        ...(summary.trim() && !folder ? { summary: summary.trim() } : {}),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        ...(parent ? { parentId: parent } : {}),
      }),
    onSuccess: (doc) => {
      notify.success(t('knowledge.editor.created'));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      onCreated(doc);
      onOpenChange(false);
    },
    onError: (error) => notify.error(error),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {folder ? t('knowledge.new.folder') : t('knowledge.new.article')}
          </DialogTitle>
          <DialogDescription className='sr-only'>
            {t('knowledge.tree.newDoc')}
          </DialogDescription>
        </DialogHeader>
        <form
          id='knowledge-new'
          className='-mx-4 min-h-0 flex-1 space-y-4 overflow-y-auto px-4'
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <Tabs
            value={kind}
            onValueChange={(next) =>
              setKind(next === 'folder' ? 'folder' : 'article')
            }
          >
            <TabsList>
              <TabsTrigger value='article'>
                {t('knowledge.kinds.article')}
              </TabsTrigger>
              <TabsTrigger value='folder'>
                {t('knowledge.kinds.folder')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Field>
            <FieldLabel htmlFor='knowledge-new-title'>
              {t('knowledge.editor.title')}
            </FieldLabel>
            <Input
              id='knowledge-new-title'
              value={title}
              required
              autoFocus
              maxLength={KNOWLEDGE_TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='knowledge-new-slug'>
              {t('knowledge.editor.slug')}
            </FieldLabel>
            <Input
              id='knowledge-new-slug'
              value={slug}
              className='font-mono'
              maxLength={64}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
            />
            <FieldDescription>
              {t('knowledge.editor.slugHint')}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor='knowledge-parent'>
              {t('knowledge.editor.parent')}
            </FieldLabel>
            <ParentSelect
              docs={parentOptions(docs, null)}
              value={parent}
              onChange={setParent}
            />
          </Field>
          {folder ? null : (
            <>
              <Field>
                <FieldLabel htmlFor='knowledge-new-summary'>
                  {t('knowledge.editor.summary')}
                </FieldLabel>
                <Input
                  id='knowledge-new-summary'
                  value={summary}
                  maxLength={KNOWLEDGE_SUMMARY_MAX}
                  onChange={(event) => setSummary(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='knowledge-new-content'>
                  {t('knowledge.editor.content')}
                </FieldLabel>
                <MarkdownField
                  id='knowledge-new-content'
                  value={content}
                  onChange={setContent}
                  className='min-h-40 font-mono text-sm leading-6'
                />
              </Field>
            </>
          )}
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('knowledge.editor.cancel')}
          </Button>
          <Button
            type='submit'
            form='knowledge-new'
            disabled={create.isPending || !title.trim()}
          >
            {create.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('knowledge.editor.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A new title, from the tree: an article's or a file's next version, or a folder's new name. */
export function RenameDocDialog({
  open,
  onOpenChange,
  doc,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly doc: KnowledgeDocSummary;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(doc.title);
  const rename = useMutation({
    mutationFn: () =>
      api.update(doc.id, { expectedVersion: doc.version, title: title.trim() }),
    onSuccess: () => {
      notify.success(t('knowledge.doc.renamedToast'));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      onOpenChange(false);
    },
    onError: (error) => notify.error(error),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {t('knowledge.doc.renameTitle', { title: doc.title })}
          </DialogTitle>
          <DialogDescription className='sr-only'>
            {t('knowledge.doc.rename')}
          </DialogDescription>
        </DialogHeader>
        <form
          id='knowledge-rename'
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim() && title.trim() !== doc.title) rename.mutate();
            else onOpenChange(false);
          }}
        >
          <Field>
            <FieldLabel htmlFor='knowledge-rename-title'>
              {t('knowledge.editor.title')}
            </FieldLabel>
            <Input
              id='knowledge-rename-title'
              value={title}
              required
              autoFocus
              maxLength={KNOWLEDGE_TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('knowledge.editor.cancel')}
          </Button>
          <Button
            type='submit'
            form='knowledge-rename'
            disabled={rename.isPending || !title.trim()}
          >
            {rename.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('knowledge.doc.rename')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MoveDocDialog({
  open,
  onOpenChange,
  doc,
  docs,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly doc: KnowledgeDocSummary;
  readonly docs: readonly KnowledgeDocSummary[];
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [parent, setParent] = useState<string | null>(doc.parentId);
  const move = useMutation({
    mutationFn: () => api.move(doc.id, { parentId: parent }),
    onSuccess: () => {
      notify.success(t('knowledge.doc.movedToast'));
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
      onOpenChange(false);
    },
    onError: (error) => notify.error(error),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {t('knowledge.doc.moveTitle', { title: doc.title })}
          </DialogTitle>
          <DialogDescription className='sr-only'>
            {t('knowledge.doc.move')}
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor='knowledge-parent'>
            {t('knowledge.doc.moveTo')}
          </FieldLabel>
          <ParentSelect
            docs={parentOptions(
              docs.filter((item) => item.spaceId === doc.spaceId),
              doc.id,
            )}
            value={parent}
            onChange={setParent}
          />
        </Field>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('knowledge.editor.cancel')}
          </Button>
          <Button disabled={move.isPending} onClick={() => move.mutate()}>
            {move.isPending ? <Spinner data-icon='inline-start' /> : null}
            {t('knowledge.doc.move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
