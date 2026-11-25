/**
 * A skill's versions, newest first: who saved each and why. Any older version can be compared with the current one
 * (SKILL.md and each file, line by line) and restored, which saves it again as the newest version.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DownloadIcon, GitCompareIcon, HistoryIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import {
  formatBytes,
  type SkillDetail,
  type SkillFileEntry,
  type SkillVersion,
} from '../../../../shared/skills.js';
import { agentsKeys } from '../../../api/keys.js';
import { AgSection } from '../../../components/ag-section.js';
import { AgTag } from '../../../components/ag-tag.js';
import { DiffBlock } from '../../../components/diff-block.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog.js';
import { Button } from '../../../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import { Skeleton } from '../../../components/ui/skeleton.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { saveBlob } from '../../../lib/download.js';
import { useFormatters } from '../../../lib/format.js';
import { isRevisionConflict } from '../../../lib/revision.js';

export function SkillVersions({
  skill,
  canEdit,
}: {
  readonly skill: SkillDetail;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const format = useFormatters();
  const queryClient = useQueryClient();
  const [comparing, setComparing] = useState<number | null>(null);
  const [restoring, setRestoring] = useState<SkillVersion | null>(null);
  const versions = useQuery({
    queryKey: agentsKeys.skillVersions(skill.id),
    queryFn: () => api.skillVersions(skill.id),
  });
  const restore = useMutation({
    mutationFn: (version: number) =>
      api.restoreSkillVersion(skill.id, version, skill.version),
    onSuccess: (saved, version) => {
      notify.success(
        t('skills.versions.restored', { version, current: saved.version }),
      );
      queryClient.setQueryData(agentsKeys.skill(skill.id), saved);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.skills });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.skillVersions(skill.id),
      });
    },
    onError: (error) => {
      if (!isRevisionConflict(error)) {
        notify.error(error);
        return;
      }
      // Someone saved meanwhile: show the skill as it is now, and restore from there if still wanted.
      notify.error(error, t('skills.conflict'));
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.skill(skill.id),
      });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.skillVersions(skill.id),
      });
    },
  });

  return (
    <AgSection
      id='ag-skill-versions'
      title={t('skills.versions.title')}
      description={t('skills.versions.description')}
    >
      {!versions.data ? (
        <Skeleton className='h-16 w-full' />
      ) : (
        <ol className='divide-y rounded-lg border'>
          {versions.data.map((version) => (
            <li
              key={version.version}
              data-testid={`skill-version-${version.version}`}
              className='flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm'
            >
              <span className='font-mono text-xs'>v{version.version}</span>
              {version.version === skill.version ? (
                <AgTag tone='green'>{t('skills.versions.current')}</AgTag>
              ) : null}
              <span className='min-w-0 flex-1 truncate text-muted-foreground'>
                {version.note || '—'}
              </span>
              <span className='text-xs text-muted-foreground'>
                {[version.createdByName, format.relative(version.createdAt)]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              <Button
                variant='ghost'
                size='xs'
                aria-label={t('skills.exportVersion', {
                  version: version.version,
                })}
                onClick={() =>
                  void api
                    .exportSkill(skill.id, version.version)
                    .then((blob) =>
                      saveBlob(blob, `${skill.slug}-v${version.version}.zip`),
                    )
                    .catch((error: unknown) => notify.error(error))
                }
              >
                <DownloadIcon data-icon='inline-start' />
                {t('skills.export')}
              </Button>
              {version.version === skill.version ? null : (
                <>
                  <Button
                    variant='ghost'
                    size='xs'
                    onClick={() => setComparing(version.version)}
                  >
                    <GitCompareIcon data-icon='inline-start' />
                    {t('skills.versions.compare')}
                  </Button>
                  {canEdit ? (
                    <Button
                      variant='ghost'
                      size='xs'
                      disabled={restore.isPending}
                      onClick={() => setRestoring(version)}
                    >
                      <HistoryIcon data-icon='inline-start' />
                      {t('skills.versions.restore')}
                    </Button>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      <CompareDialog
        skill={skill}
        version={comparing}
        onClose={() => setComparing(null)}
      />
      <AlertDialog
        open={restoring !== null}
        onOpenChange={(open) => {
          if (!open) setRestoring(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('skills.versions.restoreTitle', {
                version: restoring?.version ?? '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('skills.versions.restoreDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const version = restoring?.version;
                setRestoring(null);
                if (version !== undefined) restore.mutate(version);
              }}
            >
              {t('skills.versions.restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AgSection>
  );
}

/** One file per entry: SKILL.md (with the name and description above it) first, then the files by path. */
function documents(
  name: string,
  description: string,
  content: string,
  files: readonly SkillFileEntry[],
): Map<string, string> {
  const result = new Map<string, string>([
    ['SKILL.md', `name: ${name}\ndescription: ${description}\n\n${content}`],
  ]);
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path)))
    result.set(
      file.path,
      `${file.content ?? `[binary · ${formatBytes(file.size)} · ${file.hash.slice(0, 12)}]`}${file.executable ? '\n[executable]' : ''}`,
    );
  return result;
}

function CompareDialog({
  skill,
  version,
  onClose,
}: {
  readonly skill: SkillDetail;
  readonly version: number | null;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const older = useQuery({
    queryKey: [...agentsKeys.skillVersions(skill.id), version],
    queryFn: () => api.skillVersion(skill.id, version ?? 0),
    enabled: version !== null,
  });
  const before = older.data
    ? documents(
        older.data.name,
        older.data.description,
        older.data.content,
        older.data.files,
      )
    : null;
  const after = documents(
    skill.name,
    skill.description,
    skill.content,
    skill.files,
  );
  const paths = before ? [...new Set([...before.keys(), ...after.keys()])] : [];
  return (
    <Dialog
      open={version !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>
            {t('skills.versions.compareTitle', {
              version: version ?? '',
              current: skill.version,
            })}
          </DialogTitle>
          <DialogDescription>
            {t('skills.versions.compareDescription')}
          </DialogDescription>
        </DialogHeader>
        {!before ? (
          <Skeleton className='h-32 w-full' />
        ) : (
          <div className='-mx-4 min-h-0 flex-1 space-y-4 overflow-y-auto px-4'>
            {paths.map((path) => {
              const old = before.get(path) ?? '';
              const now = after.get(path) ?? '';
              const changed = old !== now;
              return (
                <section key={path} className='space-y-1'>
                  <h3 className='font-mono text-xs font-semibold'>
                    {path}
                    {changed ? null : (
                      <span className='ml-2 font-sans font-normal text-muted-foreground'>
                        {t('skills.versions.unchanged')}
                      </span>
                    )}
                  </h3>
                  {changed ? <DiffBlock before={old} after={now} /> : null}
                </section>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
