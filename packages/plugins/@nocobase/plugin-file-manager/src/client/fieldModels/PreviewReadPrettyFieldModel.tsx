/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReadPrettyFieldModel, TableColumnModel } from '@nocobase/client';
import { castArray } from 'lodash';
import React from 'react';
import { reactive, escapeT } from '@nocobase/flow-engine';
import { Image, Space, Tooltip } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

function getFileType(file: any): 'image' | 'video' | 'audio' | 'pdf' | 'file' {
  let mimetype = '';
  let ext = '';

  if (typeof file === 'string') {
    // 是字符串（直接是 URL）
    const cleanUrl = file.split('?')[0].split('#')[0];
    const lastDotIndex = cleanUrl.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      ext = cleanUrl.substring(lastDotIndex).toLowerCase();
    }
  } else if (typeof file === 'object' && file !== null) {
    // 是对象
    mimetype = file.mimetype || '';
    ext = (file.extname || '').toLowerCase();
    if (!ext && file.url) {
      const cleanUrl = file.url.split('?')[0].split('#')[0];
      const lastDotIndex = cleanUrl.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        ext = cleanUrl.substring(lastDotIndex).toLowerCase();
      }
    }
  }

  // 判断 mimetype
  if (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype === 'application/pdf') return 'pdf';
  }

  // 判断扩展名
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].includes(ext)) return 'image';
  if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.aac', '.ogg'].includes(ext)) return 'audio';
  if (['.pdf'].includes(ext)) return 'pdf';

  return 'file';
}

const FilePreview = ({ file, size, showFileName }: { file: any; size: number; showFileName: boolean }) => {
  const src = typeof file === 'string' ? file : file?.preview || file?.url;
  if (!src) {
    return;
  }
  const fileName =
    typeof file === 'string' ? src.split('/').pop() : file?.name || file?.filename || file?.url?.split('/').pop();
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
      width={size}
      height={size}
      preview={type === 'image' && { mask: <EyeOutlined /> }}
      style={{
        borderRadius: 4,
        objectFit: 'cover',
        boxShadow: '0 0 0 2px #fff',
      }}
    />
  );
  return (
    <div style={{ textAlign: 'center', width: size, wordBreak: 'break-all' }}>
      {type === 'image' ? (
        imageNode
      ) : (
        <a href={src} target="_blank" rel="noopener noreferrer">
          {imageNode}
        </a>
      )}
      {showFileName && (
        <Tooltip title={fileName}>
          <div
            style={{
              fontSize: 12,
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {fileName}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

const Preview = (props) => {
  const { value = [], size = 28, showFileName } = props;
  return (
    <Space size={5} wrap={true}>
      {Array.isArray(value) &&
        value.map((file, index) => <FilePreview file={file} size={size} key={index} showFileName={showFileName} />)}
    </Space>
  );
};
export class PreviewReadPrettyFieldModel extends ReadPrettyFieldModel {
  static supportedFieldInterfaces = [
    'url',
    'attachment',
    'attachmentURL',
    'm2m',
    'm2o',
    'o2o',
    'o2m',
    'oho',
    'obo',
    'mbm',
  ];

  public static filterSupportedFields(field): boolean {
    if (field.targetCollection) {
      return field.targetCollection.template === 'file';
    }
    return true;
  }

  @reactive
  public render() {
    const value = this.getValue();
    return <Preview value={castArray(value)} {...this.props} />;
  }
}

PreviewReadPrettyFieldModel.registerFlow({
  key: 'previewReadPrettySetting',
  sort: 500,
  auto: true,
  steps: {
    size: {
      title: escapeT('Size'),
      uiSchema: (ctx) => {
        if (ctx.model.parent instanceof TableColumnModel) {
          return null;
        }
        return {
          size: {
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              {
                value: 300,
                label: escapeT('Large'),
              },
              {
                value: 100,
                label: escapeT('Middle'),
              },
              {
                value: 28,
                label: escapeT('Small'),
              },
            ],
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          size: ctx.model.parent instanceof TableColumnModel ? 28 : 100,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('size', params.size);
      },
    },
    showFileName: {
      title: escapeT('Show file name'),
      uiSchema: (ctx) => {
        if (ctx.model.parent instanceof TableColumnModel) {
          return null;
        }
        return {
          showFileName: {
            'x-component': 'Switch',
            'x-decorator': 'FormItem',
          },
        };
      },
      defaultParams: {
        showFileName: false,
      },
      handler(ctx, params) {
        ctx.model.setProps('showFileName', params.showFileName);
      },
    },
  },
});
