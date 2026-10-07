/**
 * A release's artifacts and what a deployment ran. An archive release lists its archive; an image release its OCI
 * images by platform and digest. A deployment shows the digest it pulled or the archive it ran in process.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { BoxIcon, PackageIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { DeploymentArtifact, ReleaseView } from '../../shared/releases.js';

/** `sha256:0123456789ab…` → `0123456789ab`. */
function shortDigest(digest: string): string {
  return digest.replace(/^sha256:/u, '').slice(0, 12);
}

export function ReleaseArtifacts({
  release,
}: {
  readonly release: ReleaseView;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const images = (release.artifacts ?? []).filter(
    (artifact) => artifact.kind === 'oci-image',
  );
  return (
    <ul className='flex min-w-0 flex-col gap-1' data-slot='release-artifacts'>
      {release.kind === 'archive' ? (
        <li
          className='flex items-center gap-1.5 text-xs'
          title={`${t('ui.artifacts.tarball')} sha256:${release.checksum}`}
        >
          <PackageIcon className='size-3.5 shrink-0 text-muted-foreground' />
          <span className='text-muted-foreground'>
            {t('ui.artifacts.tarball')}
          </span>
          <span className='font-mono'>{release.checksum.slice(0, 12)}</span>
        </li>
      ) : null}
      {images.map((image) => (
        <li
          key={image.id}
          className='flex min-w-0 items-center gap-1.5 text-xs'
          title={`${image.ref}@${image.digest}`}
          data-slot='release-image'
        >
          <BoxIcon className='size-3.5 shrink-0 text-muted-foreground' />
          <span className='text-muted-foreground'>
            {t('ui.artifacts.image')}
          </span>
          <span className='truncate font-mono'>
            {image.ref.split('/').slice(-1)[0]}@{shortDigest(image.digest)}
          </span>
          <span className='shrink-0 text-muted-foreground'>
            {image.platform}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DeploymentArtifactTag({
  artifact,
}: {
  readonly artifact: DeploymentArtifact | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (!artifact) return <span className='text-muted-foreground'>—</span>;
  if (artifact.kind === 'image')
    return (
      <span
        className='inline-flex min-w-0 items-center gap-1.5 text-xs'
        title={`${artifact.ref}@${artifact.digest} (${artifact.platform})`}
        data-slot='deployment-artifact'
        data-kind='image'
      >
        <BoxIcon className='size-3.5 shrink-0 text-muted-foreground' />
        <span className='font-mono'>{shortDigest(artifact.digest)}</span>
        <span className='text-muted-foreground'>{artifact.platform}</span>
      </span>
    );
  return (
    <span
      className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'
      data-slot='deployment-artifact'
      data-kind='tarball'
    >
      <PackageIcon className='size-3.5 shrink-0' />
      {t('ui.artifacts.ranTarball')}
    </span>
  );
}
