/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { Alert, Image, Modal, Space } from 'antd';
import { matchMimetype } from '@nocobase/client';
import { Trans, useTranslation } from 'react-i18next';
import { NAMESPACE } from '../locale';

export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchIndex?: (index: number) => void;
  onClose?: () => void;
  onDownload: (file: any) => void;
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

const renderModalFooter = (props: FilePreviewerProps) => {
  const { index, list, onSwitchIndex, onDownload, file } = props;
  const canPrev = typeof index === 'number' && !!onSwitchIndex && index > 0;
  const canNext = typeof index === 'number' && !!onSwitchIndex && index < list.length - 1;
  return (
    <Space size={14} style={{ fontSize: '20px' }}>
      <LeftOutlined
        style={{ cursor: canPrev ? 'pointer' : 'not-allowed' }}
        disabled={!canPrev}
        onClick={() => canPrev && onSwitchIndex?.(index - 1)}
      />
      <RightOutlined
        style={{ cursor: canNext ? 'pointer' : 'not-allowed' }}
        disabled={!canNext}
        onClick={() => canNext && onSwitchIndex?.(index + 1)}
      />
      <DownloadOutlined onClick={() => onDownload(file)} />
    </Space>
  );
};

export const wrapWithModalPreviewer = (Previewer: React.ComponentType<FilePreviewerProps>) => {
  return function WrappedPreviewer(props: FilePreviewerProps) {
    const { open, onOpenChange, onClose, file } = props;
    if (typeof open !== 'boolean') {
      return <Previewer {...props} />;
    }
    const title = getFileName(file, getFileUrl(file));
    return (
      <Modal
        open={open}
        title={title}
        onCancel={() => {
          onOpenChange?.(false);
          onClose?.();
        }}
        footer={renderModalFooter(props)}
        width="90vw"
        centered={true}
      >
        <div
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 256px)',
            height: '80vh',
            width: '100%',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflowY: 'auto',
          }}
        >
          <Previewer {...props} />
        </div>
      </Modal>
    );
  };
};

const ImagePreviewer = (props: FilePreviewerProps) => {
  const { file, list, index, open, onOpenChange, onSwitchIndex, onClose, onDownload } = props;
  if (typeof open !== 'boolean') {
    return null;
  }
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  const canPrev = typeof index === 'number' && index > 0;
  const canNext = typeof index === 'number' && index < list.length - 1;
  return (
    <Image
      wrapperStyle={{ display: 'none' }}
      preview={{
        visible: open,
        onVisibleChange: (visible) => onOpenChange?.(visible),
        afterOpenChange: (visible) => {
          if (!visible) {
            onClose?.();
          }
        },
        toolbarRender: (
          _,
          {
            transform: { scale },
            actions: { onFlipY, onFlipX, onRotateLeft, onRotateRight, onZoomOut, onZoomIn, onReset },
          },
        ) => (
          <Space size={14} className="toolbar-wrapper" style={{ fontSize: '20px' }}>
            <LeftOutlined
              style={{ cursor: canPrev ? 'pointer' : 'not-allowed' }}
              disabled={!canPrev}
              onClick={() => canPrev && onSwitchIndex?.(index - 1)}
            />
            <RightOutlined
              style={{ cursor: canNext ? 'pointer' : 'not-allowed' }}
              disabled={!canNext}
              onClick={() => canNext && onSwitchIndex?.(index + 1)}
            />
            {onDownload ? <DownloadOutlined onClick={() => onDownload(file)} /> : null}
            <SwapOutlined rotate={90} onClick={onFlipY} />
            <SwapOutlined onClick={onFlipX} />
            <RotateLeftOutlined onClick={onRotateLeft} />
            <RotateRightOutlined onClick={onRotateRight} />
            <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
            <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
            <UndoOutlined onClick={onReset} />
          </Space>
        ),
      }}
      src={src}
    />
  );
};

const IframePreviewer = ({ file }: FilePreviewerProps) => {
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  return <iframe src={src} width="100%" height="100%" style={{ border: 'none' }} />;
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
    <video controls width="100%" height="100%">
      <source src={src} type={file?.type || file?.mimetype} />
      {t('Your browser does not support the video tag.')}
    </video>
  );
};

const UnsupportedPreviewer = (props: FilePreviewerProps) => {
  const { t } = useTranslation();
  const { file } = props;
  return (
    <Alert
      type="warning"
      description={
        <Trans ns={NAMESPACE}>
          {'File type is not supported for previewing, please '}
          {props.onDownload ? (
            <a onClick={() => props.onDownload?.(file)} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
              {'download it to preview'}
            </a>
          ) : (
            <span>{'download it to preview'}</span>
          )}
        </Trans>
      }
      showIcon
    />
  );
};

filePreviewTypes.add({
  match() {
    return true;
  },
  Previewer: wrapWithModalPreviewer(UnsupportedPreviewer),
});

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
    return ['text/plain', 'application/pdf', 'application/json'].some((type) => matchMimetype(file, type));
  },
  Previewer: wrapWithModalPreviewer(IframePreviewer),
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'audio/*');
  },
  Previewer: wrapWithModalPreviewer(AudioPreviewer),
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'video/*');
  },
  Previewer: wrapWithModalPreviewer(VideoPreviewer),
});

export const FilePreviewRenderer = (props: FilePreviewerProps) => {
  const normalized = normalizePreviewFile(props.file);
  if (!normalized) {
    return null;
  }
  const { Previewer } = filePreviewTypes.getTypeByFile(normalized) ?? {};
  if (!Previewer) {
    return null;
  }
  return <Previewer {...props} file={normalized} />;
};
