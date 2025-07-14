/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReadPrettyFieldModel } from '@nocobase/client';
import { castArray } from 'lodash';
import React from 'react';
import { reactive } from '@nocobase/flow-engine';
import { Image, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

function getFileType(file) {
  const { mimetype, extname = '', url = '' } = file;
  if (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
  }

  let ext = extname && extname.toLowerCase();

  if (!ext && url) {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const lastDotIndex = cleanUrl.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      ext = cleanUrl.substring(lastDotIndex).toLowerCase();
    }
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].includes(ext)) return 'image';
  if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.aac', '.ogg'].includes(ext)) return 'audio';
  if (['.pdf'].includes(ext)) return 'pdf';
  return 'file';
}

const FilePreview = ({ file, width }: { file: any; width: number }) => {
  const src = typeof file === 'string' ? file : file?.preview || file?.url;
  if (!src) {
    return;
  }
  const ext = src.split('.').pop()?.toLowerCase() || '';
  const fallbackMap: Record<string, string> = {
    pdf: '/file-placeholder/pdf-200-200.png',
    mp4: '/file-placeholder/video-200-200.png',
    mov: '/file-placeholder/video-200-200.png',
    doc: '/file-placeholder/word-200-200.png',
    docx: '/file-placeholder/word-200-200.png',
    default: '/file-placeholder/file-200-200.png',
  };
  const type = getFileType(file);
  const fallback = fallbackMap[ext] || fallbackMap.default;
  const imageNode = (
    <Image
      src={src}
      fallback={fallback}
      width={width}
      height={width}
      preview={type === 'image' && { mask: <EyeOutlined /> }}
      style={{
        borderRadius: 4,
        objectFit: 'cover',
        boxShadow: '0 0 0 2px #fff',
      }}
    />
  );
  if (type !== 'image') {
    return (
      <a href={src} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
        {imageNode}
      </a>
    );
  }

  return imageNode;
};

const Preview = ({ value = [] }) => {
  return (
    <Space size={5} wrap={false}>
      {Array.isArray(value) && value.map((file, index) => <FilePreview file={file} width={28} key={index} />)}
    </Space>
  );
};
export class PreviewReadPrettyFieldModel extends ReadPrettyFieldModel {
  static supportedFieldInterfaces = ['url', 'attachment'];

  @reactive
  public render() {
    const value = this.getValue();
    return <Preview value={castArray(value)} />;
  }
}
