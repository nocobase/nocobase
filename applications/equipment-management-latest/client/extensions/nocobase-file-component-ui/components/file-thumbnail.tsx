import {
  FileAudio,
  FileCode2,
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { isSafeImagePreview } from '../lib/file-preview';
import type { FileThumbnailProps } from '../types';
import { resolveSafeFileUrl } from '../lib/file-url';

function extension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot < 0 ? '' : filename.slice(dot).toLowerCase();
}

function icon(file: FileThumbnailProps['file']): ReactElement {
  if (isSafeImagePreview(file)) return <FileImage aria-hidden='true' />;
  if (file.mimeType.startsWith('audio/'))
    return <FileAudio aria-hidden='true' />;
  if (file.mimeType.startsWith('video/'))
    return <FileVideo aria-hidden='true' />;
  if (
    file.mimeType.startsWith('text/') ||
    file.mimeType === 'application/json' ||
    ['.css', '.html', '.js', '.json', '.md', '.ts', '.tsx', '.xml'].includes(
      extension(file.filename),
    )
  ) {
    return <FileCode2 aria-hidden='true' />;
  }
  if (
    file.mimeType === 'application/pdf' ||
    extension(file.filename) === '.pdf'
  )
    return <FileText aria-hidden='true' />;
  return <FileIcon aria-hidden='true' />;
}

export function FileThumbnail({
  file,
  url,
  alt = file.filename,
  iconOnly = false,
}: FileThumbnailProps): ReactElement {
  const imageUrl = iconOnly
    ? undefined
    : resolveSafeFileUrl(
        url ?? (isSafeImagePreview(file) ? (file.contentUrl ?? '') : ''),
      );
  // Remember which URL failed rather than a flag, so a new URL is tried again.
  const [failedUrl, setFailedUrl] = useState<string>();
  return imageUrl && imageUrl !== failedUrl ? (
    <img
      data-slot='file-thumbnail'
      src={imageUrl}
      alt={alt}
      className='h-full w-full object-cover'
      onError={() => setFailedUrl(imageUrl)}
    />
  ) : (
    <span
      data-slot='file-thumbnail'
      aria-label={file.filename}
      className='flex h-full w-full items-center justify-center rounded-md bg-muted/50 p-3 text-muted-foreground'
    >
      {icon(file)}
    </span>
  );
}
