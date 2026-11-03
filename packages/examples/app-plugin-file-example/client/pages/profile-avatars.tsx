import { useFileSubmission } from '../submission.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import { useApiClient, useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { clientFileRepositoryManagerToken } from '@nocobase/app-plugin-file/client';

import { FilePreviewDialog } from '../components/file-preview-dialog.js';
import { FileThumbnail } from '../components/file-thumbnail.js';
import { FileUploadField } from '../components/file-upload-field.js';
import {
  profilesRepository,
  resources,
  type BusinessFileRecord,
  type ProfileRecord,
} from '../lib/business.js';
import { useFileLabels } from '../lib/labels.js';

interface ProfileRow {
  readonly profile: ProfileRecord;
  readonly avatar?: BusinessFileRecord;
}

function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

/** One-to-one demo: every profile has at most one avatar file. */
export default function ProfileAvatarsPage(): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-file-example');
  const labels = useFileLabels();
  const api = useApiClient();
  const manager = useService(clientFileRepositoryManagerToken);
  const profiles = useMemo(() => profilesRepository(api), [api]);
  const avatars = useMemo(
    () => manager.repository(resources.profileAvatars),
    [manager],
  );
  const [rows, setRows] = useState<readonly ProfileRow[]>([]);
  const [busyId, setBusyId] = useState<string>();
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{
    readonly files: readonly BusinessFileRecord[];
    readonly index: number;
  }>({ files: [], index: -1 });

  const fetchRows = useCallback(async (): Promise<readonly ProfileRow[]> => {
    const [profileRows, fileRows] = await Promise.all([
      profiles.findMany({ limit: 50 }),
      avatars.findMany({ limit: 100 }),
    ]);
    const businessFiles: readonly BusinessFileRecord[] = fileRows;
    const byProfile = new Map<string, BusinessFileRecord>();
    for (const file of businessFiles)
      if (file.profileId) byProfile.set(file.profileId, file);
    return profileRows
      .map((profile) => ({
        profile,
        avatar: byProfile.get(profile.id),
      }))
      .sort((left, right) =>
        left.profile.name.localeCompare(right.profile.name),
      );
  }, [profiles, avatars]);

  useEffect(() => {
    let active = true;
    void fetchRows().then(
      (loaded) => {
        if (active) setRows(loaded);
      },
      (cause: unknown) => {
        if (active) setError(messageOf(cause));
      },
    );
    return () => {
      active = false;
    };
  }, [fetchRows]);

  const submission = useFileSubmission();
  const mutate = useCallback(
    async (
      profileId: string,
      values: Parameters<typeof profiles.updateOne>[0]['values'],
    ): Promise<void> => {
      setBusyId(profileId);
      setError('');
      try {
        await submission.run(
          { filter: { id: profileId }, values },
          (idempotencyKey, snapshot) =>
            profiles.updateOne({ ...snapshot, idempotencyKey }),
        );
        setRows(await fetchRows());
      } catch (cause) {
        setError(messageOf(cause));
      } finally {
        setBusyId(undefined);
      }
    },
    [profiles, fetchRows, submission],
  );

  return (
    <PageContainer>
      <PageHeader
        description={`${t('profilesDescription')} ${t('profilesRelationHint')}`}
        title={t('profilesTitle')}
      />
      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error}
          <button
            type='button'
            disabled={submission.submitting}
            onClick={() => {
              void (async () => {
                try {
                  await submission.retry();
                  setRows(await fetchRows());
                  setError('');
                } catch (cause) {
                  setError(messageOf(cause));
                }
              })();
            }}
          >
            {t('retrySubmission')}
          </button>
        </p>
      )}
      <ul className='divide-y divide-border/60 rounded-xl border bg-card shadow-2xs overflow-hidden'>
        {rows.map(({ profile, avatar }) => (
          <li
            key={profile.id}
            className='flex flex-wrap items-center gap-4 p-4 hover:bg-muted/30 transition-colors'
          >
            <button
              type='button'
              disabled={!avatar}
              aria-label={
                avatar ? `${labels.preview}: ${avatar.filename}` : t('noAvatar')
              }
              className='size-12 shrink-0 overflow-hidden rounded-full border bg-muted/40 shadow-2xs disabled:cursor-default cursor-pointer'
              onClick={() => setPreview({ files: [avatar!], index: 0 })}
            >
              {avatar ? (
                <FileThumbnail file={avatar} />
              ) : (
                <span className='flex h-full items-center justify-center text-[10px] text-muted-foreground font-medium'>
                  {t('noAvatar')}
                </span>
              )}
            </button>
            <div className='min-w-0 flex-1 space-y-0.5'>
              <p className='font-semibold text-foreground text-sm leading-tight'>
                {profile.name}
              </p>
              <p className='text-xs text-muted-foreground font-medium'>
                {profile.jobTitle}
              </p>
              <p className='text-[11px] text-muted-foreground/80 font-mono'>
                {avatar ? avatar.filename : t('profilesNoFile')}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <FileUploadField
                compact
                repository={avatars}
                accept={['image/*']}
                maxSize={5 * 1024 * 1024}
                disabled={
                  submission.submitting ||
                  submission.pending ||
                  busyId === profile.id
                }
                labels={{
                  ...labels,
                  choose: avatar ? t('replaceAvatar') : t('uploadAvatar'),
                }}
                onChange={(records) =>
                  mutate(profile.id, {
                    avatar: { connect: { id: records[0].id } },
                  })
                }
              />
              {avatar ? (
                <button
                  type='button'
                  className='rounded-lg border px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 cursor-pointer'
                  disabled={
                    submission.submitting ||
                    submission.pending ||
                    busyId === profile.id
                  }
                  onClick={() =>
                    void mutate(profile.id, { avatar: { disconnect: true } })
                  }
                >
                  {t('removeAvatar')}
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {!rows.length && (
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center bg-card/40'>
          <p role='status' className='text-xs text-muted-foreground'>
            {t('profilesEmpty')}
          </p>
        </div>
      )}
      <div className='flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3.5 text-xs text-muted-foreground leading-relaxed'>
        <p>{t('avatarHint')}</p>
      </div>
      <FilePreviewDialog
        files={preview.files}
        index={preview.index}
        labels={labels}
        onIndexChange={(index) =>
          setPreview((current) => ({ ...current, index }))
        }
        onClose={() => setPreview({ files: [], index: -1 })}
      />
    </PageContainer>
  );
}
