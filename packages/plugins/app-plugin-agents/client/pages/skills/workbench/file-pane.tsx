/**
 * The entry selected in the tree. `SKILL.md`: its front matter's problems above the source, written beside its preview
 * (in tabs on a narrow pane). A Markdown file: the same editor; another text file: its source in a monospace field. A
 * binary file: its preview when it is an image or a PDF, and its size with Download and Replace. Read-only, each shows
 * what it renders to.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { AlertCircleIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react';
import { useEffect, useMemo, type ReactElement, type ReactNode } from 'react';

import {
  formatBytes,
  parseSkillMarkdown,
  type SkillFrontMatterProblem,
} from '../../../../shared/skills.js';
import { agentsKeys } from '../../../api/keys.js';
import { AgMarkdown } from '../../../components/ag-markdown.js';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../../components/ui/alert.js';
import { Badge } from '../../../components/ui/badge.js';
import { Button } from '../../../components/ui/button.js';
import { Label } from '../../../components/ui/label.js';
import { Switch } from '../../../components/ui/switch.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../../components/ui/tabs.js';
import { Textarea } from '../../../components/ui/textarea.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { isMarkdown, isScript, SKILL_MD, type FileDraft } from './model.js';
import { useElementWidth } from './use-element-width.js';

/** Where a saved file's bytes are read from: the skill and the version the workbench opened. */
export interface SavedSkill {
  readonly id: string;
  readonly version: number;
}

function Preview({ markdown }: { readonly markdown: string }): ReactElement {
  const { t } = useTranslation();
  return markdown.trim() ? (
    <AgMarkdown content={markdown} />
  ) : (
    <p className='text-sm text-muted-foreground'>
      {t('skills.editor.nothingToPreview')}
    </p>
  );
}

/** Markdown beside its preview on a wide pane, in tabs on a narrow one. */
function SplitEditor({
  id,
  label,
  value,
  onChange,
  preview,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** What the preview renders: the body, for SKILL.md. */
  readonly preview: string;
}): ReactElement {
  const { t } = useTranslation();
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const field = (
    <Textarea
      id={id}
      value={value}
      aria-label={label}
      spellCheck={false}
      className='min-h-96 font-mono text-xs leading-5'
      onChange={(event) => onChange(event.target.value)}
    />
  );
  return (
    <div ref={ref} className='min-w-0'>
      {width >= 760 ? (
        <div className='grid grid-cols-2 gap-4'>
          {field}
          <section
            aria-label={t('skills.editor.preview')}
            className='min-w-0 overflow-auto rounded-lg border p-4'
          >
            <Preview markdown={preview} />
          </section>
        </div>
      ) : (
        <Tabs defaultValue='write'>
          <TabsList variant='line'>
            <TabsTrigger value='write'>{t('skills.editor.write')}</TabsTrigger>
            <TabsTrigger value='preview'>
              {t('skills.editor.preview')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value='write'>{field}</TabsContent>
          <TabsContent value='preview'>
            <div className='min-h-40 rounded-lg border p-4'>
              <Preview markdown={preview} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/** The front matter's problems, worded for the reader, with what the server refused. */
export function FrontMatterProblems({
  problems,
}: {
  readonly problems: readonly SkillFrontMatterProblem[];
}): ReactElement | null {
  const { t } = useTranslation();
  if (problems.length === 0) return null;
  return (
    <Alert variant='destructive' data-testid='skill-front-matter-problems'>
      <AlertCircleIcon />
      <AlertTitle>{t('skills.frontMatter.title')}</AlertTitle>
      <AlertDescription>
        <ul className='list-disc pl-4'>
          {problems.map((item) => (
            <li key={`${item.field}:${item.reason}`}>
              {t(`skills.frontMatter.reasons.${item.reason}`, {
                field: item.field,
                ...(item.max === undefined ? {} : { max: item.max }),
              })}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

/** The bytes of a binary file as an object URL: uploaded ones from the browser, saved ones from the server. */
function useFileUrl(
  file: Extract<FileDraft, { kind: 'binary' }>,
  saved: SavedSkill | null,
  enabled: boolean,
): string | null {
  const api = useAgentsApi();
  const remote = useQuery({
    queryKey: [
      ...agentsKeys.skill(saved?.id ?? ''),
      'file',
      saved?.version ?? 0,
      file.savedPath ?? '',
    ],
    queryFn: () => api.skillFile(saved!.id, saved!.version, file.savedPath!),
    enabled: enabled && !file.blob && saved !== null && file.savedPath !== null,
    staleTime: Infinity,
  });
  const blob = file.blob ?? remote.data ?? null;
  const url = useMemo(
    () =>
      blob && enabled && typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : null,
    [blob, enabled],
  );
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
}

const IMAGE = /\.(png|jpe?g|gif|webp|bmp|ico|avif)$/iu;
const PDF = /\.pdf$/iu;

function BinaryView({
  file,
  saved,
  onDownload,
  onReplace,
}: {
  readonly file: Extract<FileDraft, { kind: 'binary' }>;
  readonly saved: SavedSkill | null;
  readonly onDownload: (() => void) | null;
  readonly onReplace: (() => void) | null;
}): ReactElement {
  const { t } = useTranslation();
  const kind = IMAGE.test(file.path)
    ? 'image'
    : PDF.test(file.path)
      ? 'pdf'
      : null;
  const url = useFileUrl(file, saved, kind !== null);
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <p className='text-sm text-muted-foreground'>
          {t('skills.binaryFile', { size: formatBytes(file.size) })}
        </p>
        <span className='flex-1' />
        {onDownload ? (
          <Button variant='outline' size='sm' onClick={onDownload}>
            <DownloadIcon data-icon='inline-start' />
            {t('skills.tree.download')}
          </Button>
        ) : null}
        {onReplace ? (
          <Button variant='outline' size='sm' onClick={onReplace}>
            <RefreshCwIcon data-icon='inline-start' />
            {t('skills.tree.replace')}
          </Button>
        ) : null}
      </div>
      {kind === 'image' && url ? (
        <div className='flex justify-center rounded-lg border bg-muted/50 p-4'>
          <img
            src={url}
            alt={file.path}
            className='max-h-96 max-w-full object-contain'
          />
        </div>
      ) : kind === 'pdf' && url ? (
        // A viewport-relative height, so a PDF page is readable without the page scrolling twice.
        <object
          data={url}
          type='application/pdf'
          aria-label={file.path}
          className='h-[70vh] w-full rounded-lg border'
        >
          <p className='p-4 text-sm text-muted-foreground'>
            {t('skills.editor.noPreview')}
          </p>
        </object>
      ) : kind === null ? (
        <p className='text-sm text-muted-foreground'>
          {t('skills.editor.noPreview')}
        </p>
      ) : null}
    </div>
  );
}

function PaneHeader({
  path,
  children,
}: {
  readonly path: string;
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <div className='flex min-h-8 flex-wrap items-center gap-2'>
      <h2 className='truncate font-mono text-sm font-medium' title={path}>
        {path}
      </h2>
      {children}
    </div>
  );
}

export function FilePane({
  content,
  file,
  problems,
  editable,
  saved,
  onContentChange,
  onFileChange,
  onDownload,
  onReplace,
}: {
  /** The text of `SKILL.md`. */
  readonly content: string;
  /** The file selected; null for `SKILL.md`. */
  readonly file: FileDraft | null;
  /** Of `SKILL.md`'s front matter, the browser's and the server's. */
  readonly problems: readonly SkillFrontMatterProblem[];
  readonly editable: boolean;
  readonly saved: SavedSkill | null;
  readonly onContentChange: (content: string) => void;
  readonly onFileChange: (next: FileDraft) => void;
  readonly onDownload: (file: FileDraft) => void;
  readonly onReplace: (file: FileDraft) => void;
}): ReactElement {
  const { t } = useTranslation();
  if (!file) {
    const { body, frontMatter } = parseSkillMarkdown(content);
    return (
      <div className='flex min-w-0 flex-col gap-4'>
        <PaneHeader path={SKILL_MD}>
          {frontMatter.compatibility ? (
            <Badge variant='outline' className='max-w-full truncate'>
              {t('skills.compatibility', {
                value: frontMatter.compatibility,
              })}
            </Badge>
          ) : null}
        </PaneHeader>
        {editable ? (
          <>
            <FrontMatterProblems problems={problems} />
            <SplitEditor
              id='ag-skill-content'
              label={t('skills.content')}
              value={content}
              onChange={onContentChange}
              preview={body}
            />
            <p className='text-sm text-muted-foreground'>
              {t('skills.contentHint')}
            </p>
          </>
        ) : (
          <div className='rounded-lg border p-4'>
            {body.trim() ? (
              <AgMarkdown content={body} />
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t('skills.emptyContent')}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
  const header = (
    <PaneHeader path={file.path}>
      {isScript(file) ? (
        <Badge variant='secondary'>{t('skills.scriptBadge')}</Badge>
      ) : null}
      <span className='text-xs text-muted-foreground tabular-nums'>
        {formatBytes(
          file.kind === 'text'
            ? new TextEncoder().encode(file.content).length
            : file.size,
        )}
      </span>
      <span className='flex-1' />
      {editable ? (
        <div className='flex items-center gap-2'>
          <Switch
            id='ag-skill-file-executable'
            checked={file.executable}
            onCheckedChange={(checked) =>
              onFileChange({ ...file, executable: checked })
            }
          />
          <Label htmlFor='ag-skill-file-executable' className='font-normal'>
            {t('skills.executable')}
          </Label>
        </div>
      ) : null}
    </PaneHeader>
  );
  if (file.kind === 'binary')
    return (
      <div className='flex min-w-0 flex-col gap-4'>
        {header}
        <BinaryView
          file={file}
          saved={saved}
          onDownload={file.savedPath ? () => onDownload(file) : null}
          onReplace={editable ? () => onReplace(file) : null}
        />
      </div>
    );
  const label = t('skills.fileContent', { path: file.path });
  return (
    <div className='flex min-w-0 flex-col gap-4'>
      {header}
      {editable ? (
        isMarkdown(file.path) ? (
          <SplitEditor
            id='ag-skill-file-content'
            label={label}
            value={file.content}
            preview={file.content}
            onChange={(next) => onFileChange({ ...file, content: next })}
          />
        ) : (
          <Textarea
            value={file.content}
            aria-label={label}
            spellCheck={false}
            className='min-h-96 font-mono text-xs leading-5'
            onChange={(event) =>
              onFileChange({ ...file, content: event.target.value })
            }
          />
        )
      ) : isMarkdown(file.path) ? (
        <div className='rounded-lg border p-4'>
          <Preview markdown={file.content} />
        </div>
      ) : (
        <pre className='max-h-[70vh] overflow-auto rounded-lg border bg-muted/50 p-4 font-mono text-xs whitespace-pre-wrap'>
          {file.content}
        </pre>
      )}
    </div>
  );
}
