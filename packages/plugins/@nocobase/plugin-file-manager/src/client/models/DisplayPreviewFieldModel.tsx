/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined } from '@ant-design/icons';
import { DetailsItemModel, FieldModel, TableColumnModel, matchMimetype, css } from '@nocobase/client';
import { tExpr, DisplayItemModel } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';
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
import { Image, Space, Tooltip, Alert } from 'antd';
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
    <div
      className={css`
        .ant-image-img {
          border: 1px solid #d9d9d9;
          padding: 2px;
        }
      `}
    >
      <Image
        src={src}
        fallback={fallback}
        width={size}
        height={size}
        preview={{ mask: <EyeOutlined /> }}
        style={{
          borderRadius: 4,
          objectFit: 'cover',
          boxShadow: '0 0 0 2px #fff',
        }}
      />
    </div>
  );
  return (
    <div style={{ textAlign: 'center', width: size, wordBreak: 'break-all' }}>
      {imageNode}
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
  const [current, setCurrent] = React.useState(0);
  const { t } = useTranslation();
  const onDownload = (props) => {
    const url = value[current].url || value[current];
    const suffix = url.slice(url.lastIndexOf('.'));
    const filename = Date.now() + suffix;
    // eslint-disable-next-line promise/catch-or-return
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(blobUrl);
        link.remove();
      });
  };
  return (
    <Image.PreviewGroup
      preview={{
        toolbarRender: (
          _,
          {
            transform: { scale },
            actions: { onActive, onFlipY, onFlipX, onRotateLeft, onRotateRight, onZoomOut, onZoomIn, onReset },
          },
        ) => (
          <Space size={14} className="toolbar-wrapper" style={{ fontSize: '20px' }}>
            <LeftOutlined disabled={current === 0} onClick={() => onActive?.(-1)} />
            <RightOutlined disabled={current === value.length - 1} onClick={() => onActive?.(1)} />
            <DownloadOutlined onClick={onDownload} />
            <SwapOutlined rotate={90} onClick={onFlipY} />
            <SwapOutlined onClick={onFlipX} />
            <RotateLeftOutlined onClick={onRotateLeft} />
            <RotateRightOutlined onClick={onRotateRight} />
            <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
            <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
            <UndoOutlined onClick={onReset} />
          </Space>
        ),
        onChange: (index) => {
          setCurrent(index);
        },
        imageRender: (originalNode, info) => {
          setCurrent(info.current);
          const file: any = info.image;
          // 根据文件类型决定如何渲染预览
          if (matchMimetype(file, 'application/pdf')) {
            // PDF 文件的预览
            return <iframe src={file.url || file.preview} width="100%" height="600px" style={{ border: 'none' }} />;
          } else if (matchMimetype(file, 'audio/*')) {
            // 音频文件的预览
            return (
              <audio controls>
                <source src={file.url || file.preview} type={file.type} />
                您的浏览器不支持音频标签。
              </audio>
            );
          } else if (matchMimetype(file, 'video/*')) {
            // 视频文件的预览
            return (
              <video controls width="100%">
                <source src={file.url || file.preview} type={file.type} />
                您的浏览器不支持视频标签。
              </video>
            );
          } else if (matchMimetype(file, 'text/plain')) {
            // 文本文件的预览
            return <iframe src={file.url || file.preview} width="100%" height="600px" style={{ border: 'none' }} />;
          } else if (matchMimetype(file, 'image/*')) {
            // 图片文件的预览
            return originalNode;
          } else {
            return (
              <Alert
                type="warning"
                description={t('File type is not supported for previewing, please download it to preview.')}
                showIcon
              />
            );
          }
        },
      }}
    >
      <Space size={5} wrap={true}>
        {Array.isArray(value) &&
          value.map((file, index) => <FilePreview file={file} size={size} key={index} showFileName={showFileName} />)}
      </Space>
    </Image.PreviewGroup>
  );
};
export class DisplayPreviewFieldModel extends FieldModel {
  disableTitleField = true;
  render(): any {
    const { value, titleField, template, target } = this.props;
    if (titleField && template !== 'file' && target !== 'attachments') {
      return castArray(value).flatMap((v, idx) => {
        const result = v?.[titleField];
        const content = result ? (
          <Preview key={idx} {...this.props} value={castArray(result).filter(Boolean)} />
        ) : (
          <span key={idx}>N/A</span>
        );

        return idx === 0 ? [content] : [<span key={`sep-${idx}`}>, </span>, content];
      });
    } else {
      return <Preview {...this.props} value={castArray(value).filter(Boolean)} />;
    }
  }
}

DisplayPreviewFieldModel.registerFlow({
  key: 'previewReadPrettySetting',
  sort: 500,
  title: tExpr('Preview Settings'),
  steps: {
    size: {
      title: tExpr('Size'),
      uiMode: (ctx) => {
        const t = ctx.t;
        return {
          type: 'select',
          key: 'size',
          props: {
            options: [
              {
                value: 300,
                label: t('Large'),
              },
              {
                value: 100,
                label: t('Middle'),
              },
              {
                value: 28,
                label: t('Small'),
              },
            ],
          },
        };
      },
      hideInSettings(ctx) {
        return ctx.model.parent instanceof TableColumnModel;
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
      title: tExpr('Show file name'),
      uiMode: { type: 'switch', key: 'showFileName' },
      hideInSettings(ctx) {
        return ctx.model.parent instanceof TableColumnModel;
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
  label: tExpr('Preview'),
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
