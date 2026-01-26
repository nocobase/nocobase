/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert } from 'antd';
import { matchMimetype } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
  originalNode: React.ReactNode;
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  types: FilePreviewType[] = [];
  add(type: FilePreviewType) {
    // NOTE: use unshift to make sure the custom type has higher priority
    this.types.unshift(type);
  }
  getTypeByFile(file: any): Omit<FilePreviewType, 'match'> | undefined {
    const normalized = normalizePreviewFile(file);
    return this.types.find((type) => type.match(normalized));
  }
}

export const filePreviewTypes = new FilePreviewTypes();

export function normalizePreviewFile(file: any) {
  if (!file) {
    return file;
  }
  if (typeof file === 'string') {
    return { url: file };
  }
  return file;
}

export function getPreviewFileUrl(file: any) {
  if (!file) {
    return '';
  }
  if (typeof file === 'string') {
    return file;
  }
  return file.preview || file.url || '';
}

export function getFileUrl(file: any) {
  if (!file) {
    return '';
  }
  if (typeof file === 'string') {
    return file;
  }
  return file.url || file.preview || '';
}

const FALLBACK_ICON_MAP: Record<string, string> = {
  pdf: '/file-placeholder/pdf-200-200.png',
  mp4: '/file-placeholder/video-200-200.png',
  mov: '/file-placeholder/video-200-200.png',
  avi: '/file-placeholder/video-200-200.png',
  wmv: '/file-placeholder/video-200-200.png',
  flv: '/file-placeholder/video-200-200.png',
  mkv: '/file-placeholder/video-200-200.png',
  mp3: '/file-placeholder/audio-200-200.png',
  wav: '/file-placeholder/audio-200-200.png',
  aac: '/file-placeholder/audio-200-200.png',
  ogg: '/file-placeholder/audio-200-200.png',
  doc: '/file-placeholder/docx-200-200.png',
  docx: '/file-placeholder/docx-200-200.png',
  odt: '/file-placeholder/docx-200-200.png',
  xls: '/file-placeholder/xlsx-200-200.png',
  xlsx: '/file-placeholder/xlsx-200-200.png',
  csv: '/file-placeholder/xlsx-200-200.png',
  ppt: '/file-placeholder/pptx-200-200.png',
  pptx: '/file-placeholder/pptx-200-200.png',
  jpg: '/file-placeholder/jpeg-200-200.png',
  jpeg: '/file-placeholder/jpeg-200-200.png',
  png: '/file-placeholder/png-200-200.png',
  gif: '/file-placeholder/gif-200-200.png',
  webp: '/file-placeholder/png-200-200.png',
  bmp: '/file-placeholder/png-200-200.png',
  svg: '/file-placeholder/svg-200-200.png',
  default: '/file-placeholder/unknown-200-200.png',
};

const stripQueryAndHash = (url: string) => url.split('?')[0].split('#')[0];

const getExtFromName = (value?: string) => {
  if (!value) {
    return '';
  }
  const clean = stripQueryAndHash(value);
  const index = clean.lastIndexOf('.');
  return index !== -1 ? clean.slice(index + 1).toLowerCase() : '';
};

const getNameFromUrl = (url?: string) => {
  if (!url) {
    return '';
  }
  const clean = stripQueryAndHash(url);
  const index = clean.lastIndexOf('/');
  return index !== -1 ? clean.slice(index + 1) : clean;
};

export const getFileExt = (file: any, url?: string) => {
  if (file && typeof file === 'object') {
    if (file.extname) {
      return String(file.extname).replace(/^\./, '').toLowerCase();
    }
    const nameExt = getExtFromName(file.name || file.filename || file.title);
    if (nameExt) {
      return nameExt;
    }
  }
  return getExtFromName(url);
};

export const getFileName = (file: any, url?: string) => {
  const nameFromUrl = getNameFromUrl(url);
  if (!file || typeof file === 'string') {
    return nameFromUrl;
  }
  return file.name || file.filename || file.title || nameFromUrl;
};

export const getFallbackIcon = (file: any, url?: string) => {
  const ext = getFileExt(file, url);
  return FALLBACK_ICON_MAP[ext] || FALLBACK_ICON_MAP.default;
};

export const getPreviewThumbnailUrl = (file: any) => {
  const previewFile = normalizePreviewFile(file);
  const src = getPreviewFileUrl(previewFile);
  const { getThumbnailURL } = filePreviewTypes.getTypeByFile(previewFile) ?? {};
  const thumbnail = getThumbnailURL?.(previewFile);
  if (thumbnail) {
    return thumbnail;
  }
  if (matchMimetype(previewFile, 'image/*')) {
    return '';
  }
  return getFallbackIcon(previewFile, src);
};

const ImagePreviewer = ({ originalNode }: FilePreviewerProps) => <>{originalNode}</>;

const IframePreviewer = ({ file }: FilePreviewerProps) => {
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  return <iframe src={src} width="90%" height="80%" style={{ border: 'none' }} />;
};

const AudioPreviewer = ({ file }: FilePreviewerProps) => {
  const { t } = useTranslation();
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  return (
    <audio controls>
      <source src={src} type={file?.type || file?.mimetype} />
      {t('Your browser does not support the audio tag.')}
    </audio>
  );
};

const VideoPreviewer = ({ file }: FilePreviewerProps) => {
  const { t } = useTranslation();
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  return (
    <video controls width="90%">
      <source src={src} type={file?.type || file?.mimetype} />
      {t('Your browser does not support the video tag.')}
    </video>
  );
};

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'image/*');
  },
  getThumbnailURL(file) {
    return getPreviewFileUrl(file);
  },
  Previewer: ImagePreviewer,
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'application/pdf');
  },
  Previewer: IframePreviewer,
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'audio/*');
  },
  Previewer: AudioPreviewer,
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'video/*');
  },
  Previewer: VideoPreviewer,
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'text/plain');
  },
  Previewer: IframePreviewer,
});

export interface FilePreviewRendererProps {
  file: any;
  index: number;
  list: any[];
  originalNode: React.ReactNode;
  onDownload?: (file: any) => void;
}

export const FilePreviewRenderer = ({ file, index, list, originalNode, onDownload }: FilePreviewRendererProps) => {
  const { t } = useTranslation();
  const normalized = normalizePreviewFile(file);
  if (!normalized) {
    return <>{originalNode}</>;
  }
  const { Previewer } = filePreviewTypes.getTypeByFile(normalized) ?? {};
  if (Previewer) {
    return <Previewer file={normalized} index={index} list={list} originalNode={originalNode} />;
  }
  return (
    <Alert
      type="warning"
      description={
        <span>
          {t('File type is not supported for previewing,')}
          {onDownload ? (
            <a onClick={() => onDownload(normalized)} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
              {t('download it to preview')}
            </a>
          ) : null}
        </span>
      }
      showIcon
    />
  );
};
