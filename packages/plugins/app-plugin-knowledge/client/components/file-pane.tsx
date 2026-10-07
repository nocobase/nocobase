/**
 * Files in a space's view: the icon of each kind of entry, and a file's detail: its card (name, type, size, version,
 * where its text stands, its download), replacing it with a new version, a failure explained with Parse again, and its
 * preview and extracted text.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  DownloadIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  RefreshCwIcon,
  ReplaceIcon,
} from 'lucide-react';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from './ui/alert.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Card, CardContent } from './ui/card.js';
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
import {
  FilePreview,
  type FileRecord,
} from '../extensions/file-preview/file-preview.js';
import { useNotify } from '../hooks/use-notify.js';
import { fileSize } from '../lib/format.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';
import { KnowledgeMarkdown } from './markdown.js';
import { ProposeFileDialog } from './propose-file.js';

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

/** A file as the preview components read it. */
function recordOf(file: KnowledgeFileInfo, at: string): FileRecord {
  return {
    id: file.id,
    disk: '',
    key: '',
    filename: file.filename,
    ext: file.ext,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: at,
    updatedAt: at,
    contentUrl: file.contentUrl,
  };
}

function download(file: KnowledgeFileInfo): void {
  const link = document.createElement('a');
  link.href = file.downloadUrl;
  link.download = file.filename;
  link.rel = 'noopener';
  link.click();
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

/** A file's preview with the file plugin's components. */
export function FilePreviewBox({
  file,
  at,
}: {
  readonly file: KnowledgeFileInfo;
  readonly at: string;
}): ReactElement {
  return (
    <div className='overflow-hidden rounded-lg border p-3'>
      <FilePreview
        file={recordOf(file, at)}
        onDownload={() => download(file)}
      />
    </div>
  );
}

/**
 * A file as a card: its name, type, size and version, where its text stands, its download and the actions given, and
 * its preview unless left out.
 */
export function FileCard({
  file,
  at,
  version = null,
  actions,
  preview = true,
}: {
  readonly file: KnowledgeFileInfo;
  readonly at: string;
  readonly version?: number | null;
  readonly actions?: ReactNode;
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
        <div className='flex flex-wrap gap-2'>
          {actions}
          <Button variant='outline' onClick={() => download(file)}>
            <DownloadIcon data-icon='inline-start' />
            {t('knowledge.files.download')}
          </Button>
        </div>
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
 * A file entry's file (at `content`'s version): its card, with Replace (or, for someone who may only propose, Propose a
 * replacement), a failure explained with Parse again, and its preview and extracted text in tabs.
 */
export function FileBody({
  doc,
  file,
  content,
  version = doc.version,
  editable,
  proposable = false,
  highlight = null,
}: {
  readonly doc: KnowledgeDoc;
  readonly file: KnowledgeFileInfo;
  /** The version's extracted text. */
  readonly content: string;
  /** The version shown. */
  readonly version?: number;
  /** Whether the current version is shown to someone who may edit it. */
  readonly editable: boolean;
  /** Whether it is shown to someone who may propose a replacement but not edit it. */
  readonly proposable?: boolean;
  /** Lines of its text to highlight: the text is shown instead of the preview. */
  readonly highlight?: readonly [number, number] | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [proposing, setProposing] = useState(false);
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: knowledgeKeys.all });
  const replace = useMutation({
    mutationFn: (next: File) => api.replaceFile(doc.id, next, doc.version),
    onSuccess: (saved) => {
      notify.success(t('knowledge.files.replaced', { version: saved.version }));
      refresh();
    },
    onError: (error) => notify.error(error),
  });
  const reparse = useMutation({
    mutationFn: () => api.reparse(doc.id),
    onSuccess: refresh,
    onError: (error) => notify.error(error),
  });
  return (
    <div className='space-y-4'>
      <FileCard
        file={file}
        at={doc.updatedAt}
        version={version}
        preview={false}
        actions={
          editable ? (
            <>
              <Button
                variant='outline'
                disabled={replace.isPending}
                onClick={() => inputRef.current?.click()}
              >
                {replace.isPending ? (
                  <Spinner data-icon='inline-start' />
                ) : (
                  <ReplaceIcon data-icon='inline-start' />
                )}
                {t('knowledge.files.replace')}
              </Button>
              <input
                ref={inputRef}
                type='file'
                className='hidden'
                aria-label={t('knowledge.files.replace')}
                onChange={(event) => {
                  const next = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  if (next) replace.mutate(next);
                }}
              />
            </>
          ) : proposable ? (
            <Button variant='outline' onClick={() => setProposing(true)}>
              <ReplaceIcon data-icon='inline-start' />
              {t('knowledge.files.proposeReplace')}
            </Button>
          ) : null
        }
      />
      {proposing ? (
        <ProposeFileDialog
          open
          onOpenChange={setProposing}
          target={{ kind: 'update', doc }}
        />
      ) : null}
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
      <Tabs
        key={highlight ? 'lines' : 'preview'}
        defaultValue={highlight ? 'text' : 'preview'}
      >
        <TabsList variant='line'>
          <TabsTrigger value='preview'>
            {t('knowledge.files.preview')}
          </TabsTrigger>
          <TabsTrigger value='text'>{t('knowledge.files.text')}</TabsTrigger>
        </TabsList>
        <TabsContent value='preview'>
          <FilePreviewBox file={file} at={doc.updatedAt} />
        </TabsContent>
        <TabsContent value='text'>
          {file.parseStatus === 'ready' && content.trim() ? (
            <KnowledgeMarkdown content={content} highlight={highlight} />
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t(`knowledge.files.noText.${file.parseStatus ?? 'unsupported'}`)}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
