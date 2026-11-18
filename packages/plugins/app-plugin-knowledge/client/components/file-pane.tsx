/**
 * Files in a space's view: the icon of each kind of entry, and a file's detail: its card (name, type, size, version,
 * where its text stands), replacing it with a new version, a failure explained with Extract again, its preview (also
 * full screen) and its extracted text, numbered line by line as search and agents read it.
 */
import { copyText } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  CopyIcon,
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  Maximize2Icon,
  RefreshCwIcon,
  XIcon,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from './ui/alert.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Card, CardContent } from './ui/card.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog.js';
import { Spinner } from './ui/spinner.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';
import { cn } from 'cn';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  KnowledgeDoc,
  KnowledgeDocSummary,
  KnowledgeFileInfo,
  KnowledgeParseStatus,
} from '../../shared/knowledge.js';
import { FilePreview } from '../extensions/file-preview/file-preview.js';
import { useNotify } from '../hooks/use-notify.js';
import { fileSize } from '../lib/format.js';
import {
  canPreview,
  citedKey,
  downloadFile,
  isMarkdown,
  recordOf,
} from '../lib/files.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';

const SHEETS = new Set(['xlsx', 'xls', 'xlsm', 'csv']);
const IMAGES = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp']);

/** An entry's icon: a folder (open with entries in it), an article, or a file by its type. */
export function EntryIcon({
  entry,
  open = false,
  className,
}: {
  readonly entry: Pick<KnowledgeDocSummary, 'kind' | 'file'>;
  readonly open?: boolean;
  readonly className?: string;
}): ReactElement {
  const props = {
    className: cn('size-3.5 shrink-0 text-muted-foreground', className),
    'aria-hidden': true,
  } as const;
  if (entry.kind === 'folder')
    return open ? <FolderOpenIcon {...props} /> : <FolderIcon {...props} />;
  if (entry.kind === 'article') return <FileTextIcon {...props} />;
  const ext = entry.file?.ext ?? '';
  if (SHEETS.has(ext)) return <FileSpreadsheetIcon {...props} />;
  if (IMAGES.has(ext)) return <FileImageIcon {...props} />;
  return <FileIcon {...props} />;
}

/** Where a file's text stands, as a badge whose tooltip says what that means. */
export function ParseBadge({
  status,
  error = null,
}: {
  readonly status: KnowledgeParseStatus | null;
  readonly error?: string | null;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (!status) return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant={
              status === 'failed'
                ? 'destructive'
                : status === 'ready'
                  ? 'outline'
                  : 'secondary'
            }
            tabIndex={0}
            data-testid='knowledge-parse-status'
          />
        }
      >
        {status === 'parsing' ? <Spinner data-icon='inline-start' /> : null}
        {t(`knowledge.files.status.${status}`)}
      </TooltipTrigger>
      <TooltipContent>
        {status === 'failed' && error
          ? t('knowledge.files.failed', { reason: error })
          : t(`knowledge.files.statusHint.${status}`)}
      </TooltipContent>
    </Tooltip>
  );
}

/** A file's preview with the file plugin's components; Markdown reads as the knowledge base's articles do. */
export function FilePreviewBox({
  file,
  at,
}: {
  readonly file: KnowledgeFileInfo;
  readonly at: string;
}): ReactElement {
  const record = recordOf(file, at);
  const markdown = isMarkdown(file);
  return (
    <div
      className={cn(
        'min-w-0',
        !markdown && 'overflow-hidden rounded-lg border p-3',
      )}
    >
      <FilePreview file={record} onDownload={() => downloadFile(file)} />
    </div>
  );
}

/**
 * A file as a card: its name, type, size and version, and where its text stands; the actions given (a proposal's file
 * offers its download), and its preview unless left out.
 */
export function FileCard({
  file,
  at,
  version = null,
  actions,
  download = true,
  preview = true,
}: {
  readonly file: KnowledgeFileInfo;
  readonly at: string;
  readonly version?: number | null;
  readonly actions?: ReactNode;
  /** Offer its download on the card; a file entry offers it in its header instead. */
  readonly download?: boolean;
  readonly preview?: boolean;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Card size='sm' data-testid='knowledge-file'>
      <CardContent className='flex flex-wrap items-center gap-x-3 gap-y-3'>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted'>
          <EntryIcon entry={{ kind: 'file', file }} className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='truncate font-medium'>{file.filename}</p>
          <p className='text-xs text-muted-foreground'>
            {[
              file.ext ? file.ext.toUpperCase() : file.mimeType,
              fileSize(file.size, i18n.language),
              version === null
                ? null
                : t('knowledge.files.version', { version }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <ParseBadge status={file.parseStatus} error={file.parseError} />
        {actions || download ? (
          <div className='flex flex-wrap gap-2'>
            {actions}
            {download ? (
              <Button variant='outline' onClick={() => downloadFile(file)}>
                <DownloadIcon data-icon='inline-start' />
                {t('knowledge.files.download')}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
      {preview ? (
        <CardContent>
          <FilePreviewBox file={file} at={at} />
        </CardContent>
      ) : null}
    </Card>
  );
}

/**
 * The extracted text as it is, numbered line by line (the lines a citation names), with what it is for and a Copy
 * action. The highlighted lines carry `data-highlighted`, for the page to scroll to.
 */
export function ExtractedText({
  content,
  highlight = null,
}: {
  readonly content: string;
  readonly highlight?: readonly [number, number] | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const notify = useNotify();
  const lines = useMemo(() => content.split(/\r?\n/u), [content]);
  const copy = async () => {
    if (await copyText(content)) notify.success(t('knowledge.files.copied'));
    else notify.error(null, t('knowledge.files.copyFailed'));
  };
  return (
    <div
      className='overflow-hidden rounded-lg border'
      data-testid='knowledge-extracted-text'
    >
      <div className='flex items-center gap-2 border-b bg-muted/50 py-1 pr-1 pl-3 text-xs text-muted-foreground'>
        <span className='min-w-0 flex-1'>
          {t('knowledge.files.textHint', { count: lines.length })}
        </span>
        <Button variant='ghost' size='sm' onClick={() => void copy()}>
          <CopyIcon data-icon='inline-start' />
          {t('knowledge.files.copy')}
        </Button>
      </div>
      <div className='py-2 font-mono text-xs leading-5'>
        {lines.map((line, index) => {
          const number = index + 1;
          const marked =
            highlight !== null &&
            number >= highlight[0] &&
            number <= highlight[1];
          return (
            <div
              key={number}
              data-line={number}
              data-highlighted={marked || undefined}
              className={cn(
                'flex scroll-mt-20',
                marked && 'bg-accent text-accent-foreground',
              )}
            >
              <span
                aria-hidden='true'
                className={cn(
                  'w-12 shrink-0 pr-3 text-right text-muted-foreground tabular-nums select-none',
                  marked && 'text-accent-foreground',
                )}
              >
                {number}
              </span>
              <span className='min-w-0 flex-1 pr-3 whitespace-pre-wrap wrap-anywhere'>
                {line || '\u200b'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Lets Esc close the dialog while a frame inside `areaRef` holds the focus, when the frame's document can be read
 * (served from here): key presses there never reach this document, so the frame gets its own Esc listener. The focus
 * stays in the frame, which keeps its own keys (paging, arrows, typing). A frame served from elsewhere (an Office
 * viewer) or the browser's PDF viewer never shows us its keys; Close is the way out there.
 */
function useEscapeFromFrames(
  open: boolean,
  areaRef: { readonly current: HTMLElement | null },
  onOpenChange: (open: boolean) => void,
): void {
  useEffect(() => {
    if (!open) return undefined;
    const listened = new Set<Document>();
    const timers = new Set<number>();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    const onBlur = () => {
      // The focus has moved into a frame by the time the window loses it.
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        const frame = document.activeElement;
        if (
          !(frame instanceof HTMLIFrameElement) ||
          !areaRef.current?.contains(frame)
        )
          return;
        const inner = readableDocument(frame);
        if (inner && !listened.has(inner)) {
          listened.add(inner);
          inner.addEventListener('keydown', onKey);
        }
      }, 0);
      timers.add(timer);
    };
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('blur', onBlur);
      for (const timer of timers) window.clearTimeout(timer);
      for (const inner of listened) inner.removeEventListener('keydown', onKey);
    };
  }, [open, areaRef, onOpenChange]);
}

/** A frame's document, or null when another origin serves it. */
function readableDocument(frame: HTMLIFrameElement): Document | null {
  try {
    return frame.contentDocument;
  } catch {
    return null;
  }
}

/**
 * The preview in a full-screen dialog: the file's name, its entry's title and the version shown (an older one says
 * so), Download and Close (Esc closes it too). Phones get the whole screen.
 */
export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
  at,
  title,
  version,
  older,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly file: KnowledgeFileInfo;
  readonly at: string;
  readonly title: string;
  readonly version: number;
  readonly older: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const record = recordOf(file, at);
  const markdown = isMarkdown(file);
  const areaRef = useRef<HTMLDivElement>(null);
  useEscapeFromFrames(open, areaRef, onOpenChange);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='flex h-dvh max-h-none w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[calc(100dvh-4rem)] sm:w-[calc(100vw-4rem)] sm:max-w-none sm:rounded-xl'
        data-testid='knowledge-file-fullscreen'
      >
        <div className='flex shrink-0 items-center gap-3 border-b px-4 py-3'>
          <span className='flex size-8 shrink-0 items-center justify-center rounded-md bg-muted'>
            <EntryIcon entry={{ kind: 'file', file }} className='size-4' />
          </span>
          <div className='min-w-0 flex-1'>
            <DialogTitle className='truncate text-sm font-medium'>
              {file.filename}
            </DialogTitle>
            <DialogDescription className='truncate text-xs'>
              {`${title} · ${
                older
                  ? t('knowledge.files.olderVersion', { version })
                  : t('knowledge.files.version', { version })
              }`}
            </DialogDescription>
          </div>
          <Button
            variant='outline'
            className='max-sm:size-8 max-sm:p-0'
            aria-label={t('knowledge.files.download')}
            onClick={() => downloadFile(file)}
          >
            <DownloadIcon data-icon='inline-start' />
            <span className='max-sm:hidden'>
              {t('knowledge.files.download')}
            </span>
          </Button>
          <DialogClose
            render={
              <Button
                variant='outline'
                size='icon'
                aria-label={t('knowledge.files.close')}
                title={t('knowledge.files.close')}
              />
            }
          >
            <XIcon />
          </DialogClose>
        </div>
        <div
          ref={areaRef}
          tabIndex={-1}
          className={cn(
            'min-h-0 flex-1 outline-none',
            markdown
              ? 'overflow-y-auto px-4 py-6 sm:px-8'
              : 'overflow-auto p-3',
          )}
        >
          <FilePreview
            file={record}
            onDownload={() => downloadFile(file)}
            fill
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A file entry's file (at `content`'s version): its card, a failure explained with Extract again, and its preview
 * (with a full-screen view when it can be previewed) and extracted text in tabs. Lines to highlight open the text.
 * Replacing, downloading and the rest are in the entry's header.
 */
export function FileBody({
  doc,
  file,
  content,
  version = doc.version,
  older = false,
  editable,
  highlight = null,
}: {
  readonly doc: KnowledgeDoc;
  readonly file: KnowledgeFileInfo;
  /** The version's extracted text. */
  readonly content: string;
  /** The version shown. */
  readonly version?: number;
  /** Whether that is an older version than the current one. */
  readonly older?: boolean;
  /** Whether the current version is shown to someone who may edit it. */
  readonly editable: boolean;
  /** Lines of its text to highlight: the text is shown instead of the preview. */
  readonly highlight?: readonly [number, number] | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const reparse = useMutation({
    mutationFn: () => api.reparse(doc.id),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all }),
    onError: (error) => notify.error(error),
  });
  const [tab, setTab] = useState<string>(highlight ? 'text' : 'preview');
  // Lines asked for (a citation, a section) open the text again; the same lines asked for again do not.
  const cited = citedKey(doc.id, highlight);
  const [seen, setSeen] = useState(cited);
  if (seen !== cited) {
    setSeen(cited);
    if (cited) setTab('text');
  }
  const [fullscreen, setFullscreen] = useState(false);
  const previewable = canPreview(file);
  return (
    <div className='space-y-4'>
      <FileCard
        file={file}
        at={doc.updatedAt}
        version={version}
        download={false}
        preview={false}
      />
      {file.parseStatus === 'failed' ? (
        <Alert variant='destructive'>
          <AlertCircleIcon />
          <AlertTitle>{t('knowledge.files.status.failed')}</AlertTitle>
          <AlertDescription>
            {file.parseError
              ? t('knowledge.files.failed', { reason: file.parseError })
              : t('knowledge.files.noText.failed')}
          </AlertDescription>
          {editable ? (
            <AlertAction>
              <Button
                variant='outline'
                disabled={reparse.isPending}
                onClick={() => reparse.mutate()}
              >
                {reparse.isPending ? (
                  <Spinner data-icon='inline-start' />
                ) : (
                  <RefreshCwIcon data-icon='inline-start' />
                )}
                {t('knowledge.files.reparse')}
              </Button>
            </AlertAction>
          ) : null}
        </Alert>
      ) : null}
      <Tabs value={tab} onValueChange={(next: string) => setTab(next)}>
        <div className='flex items-center gap-2'>
          <TabsList variant='line'>
            <TabsTrigger value='preview'>
              {t('knowledge.files.preview')}
            </TabsTrigger>
            <TabsTrigger value='text'>{t('knowledge.files.text')}</TabsTrigger>
          </TabsList>
          {tab === 'preview' && previewable ? (
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto text-muted-foreground max-sm:size-7 max-sm:p-0'
              aria-label={t('knowledge.files.fullscreen')}
              title={t('knowledge.files.fullscreen')}
              onClick={() => setFullscreen(true)}
            >
              <Maximize2Icon data-icon='inline-start' />
              <span className='max-sm:hidden'>
                {t('knowledge.files.fullscreen')}
              </span>
            </Button>
          ) : null}
        </div>
        <TabsContent value='preview'>
          <FilePreviewBox file={file} at={doc.updatedAt} />
        </TabsContent>
        <TabsContent value='text'>
          {file.parseStatus === 'ready' && content.trim() ? (
            <ExtractedText content={content} highlight={highlight} />
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t(`knowledge.files.noText.${file.parseStatus ?? 'unsupported'}`)}
            </p>
          )}
        </TabsContent>
      </Tabs>
      {fullscreen ? (
        <FilePreviewDialog
          open
          onOpenChange={setFullscreen}
          file={file}
          at={doc.updatedAt}
          title={doc.title}
          version={version}
          older={older}
        />
      ) : null}
    </div>
  );
}
