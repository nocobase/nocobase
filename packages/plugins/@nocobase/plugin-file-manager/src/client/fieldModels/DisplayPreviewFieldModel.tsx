/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined } from '@ant-design/icons';
import { DetailsItemModel, FieldModel, TableColumnModel } from '@nocobase/client';
import { escapeT, DisplayItemModel } from '@nocobase/flow-engine';
import { Image, Space, Tooltip } from 'antd';
import { castArray } from 'lodash';
import React from 'react';
function getFileType(file: any): 'image' | 'video' | 'audio' | 'pdf' | 'excel' | 'file' | 'unknown' {
  let mimetype = '';
  let ext = '';

  if (typeof file === 'string') {
    const cleanUrl = file.split('?')[0].split('#')[0];
    const lastDotIndex = cleanUrl.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      ext = cleanUrl.substring(lastDotIndex).toLowerCase();
    }
  } else if (typeof file === 'object' && file !== null) {
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
    if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
  }

  // 判断扩展名
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].includes(ext)) return 'image';
  if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.aac', '.ogg'].includes(ext)) return 'audio';
  if (['.pdf'].includes(ext)) return 'pdf';
  if (['.xlsx'].includes(ext)) return 'excel';

  return 'unknown';
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
    doc: '/file-placeholder/docx-200-200.png',
    docx: '/file-placeholder/docx-200-200.png',
    xls: '/file-placeholder/xlsx-200-200.png',
    xlsx: '/file-placeholder/xlsx-200-200.png',
    ppt: '/file-placeholder/ppt-200-200.png',
    pptx: '/file-placeholder/ppt-200-200.png',
    jpg: '/file-placeholder/image-200-200.png',
    jpeg: '/file-placeholder/image-200-200.png',
    png: '/file-placeholder/image-200-200.png',
    gif: '/file-placeholder/image-200-200.png',
    default: '/file-placeholder/unknown-200-200.png',
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
export class DisplayPreviewFieldModel extends FieldModel {
  render(): any {
    const { value, titleField } = this.props;
    if (titleField && this.context.collectionField?.targetCollection?.template !== 'file') {
      return castArray(value).flatMap((v, idx) => {
        const content = v?.[titleField] ? (
          <Preview key={idx} {...this.props} value={castArray(v?.[titleField])} />
        ) : (
          <span key={idx}>N/A</span>
        );

        return idx === 0 ? [content] : [<span key={`sep-${idx}`}>, </span>, content];
      });
    } else {
      return <Preview {...this.props} value={castArray(value)} />;
    }
  }
}

DisplayPreviewFieldModel.registerFlow({
  key: 'previewReadPrettySetting',
  sort: 500,
  title: escapeT('Preview Settings'),
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
          size: ctx.model.parent instanceof DetailsItemModel ? 100 : 28,
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

DisplayPreviewFieldModel.define({
  label: escapeT('Preview'),
});

DisplayItemModel.bindModelToInterface(
  'DisplayPreviewFieldModel',
  ['url', 'attachment', 'attachmentURL', 'm2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'mbm'],
  {
    isDefault: true,
    when: (ctx, field) => {
      if (field.targetCollection) {
        return field.targetCollection.template === 'file';
      }
      return true;
    },
  },
);
