/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DetailsItemModel, FieldModel, TableColumnModel, css } from '@nocobase/client';
import { tExpr, DisplayItemModel } from '@nocobase/flow-engine';
import { Image, Space, Tooltip } from 'antd';
import { castArray } from 'lodash';
import React from 'react';
import {
  FilePreviewRenderer,
  getFallbackIcon,
  getFileExt,
  getFileName,
  getPreviewThumbnailUrl,
  getPreviewFileUrl,
  normalizePreviewFile,
} from '../previewer/filePreviewTypes';

const FilePreview = ({
  file,
  size,
  showFileName,
  onClick,
}: {
  file: any;
  size: number;
  showFileName: boolean;
  onClick?: () => void;
}) => {
  const previewFile = normalizePreviewFile(file);
  const src = getPreviewFileUrl(previewFile);
  if (!src) {
    return;
  }
  const fileName = getFileName(previewFile, src);
  const fallback = getFallbackIcon(previewFile, src);
  const thumbnail = getPreviewThumbnailUrl(previewFile) || fallback;
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
        src={thumbnail}
        fallback={fallback}
        width={size}
        height={size}
        preview={false}
        style={{
          borderRadius: 4,
          objectFit: 'cover',
          boxShadow: '0 0 0 2px #fff',
        }}
      />
    </div>
  );
  return (
    <div
      onClick={onClick}
      style={{
        textAlign: 'center',
        width: size,
        wordBreak: 'break-all',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
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
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const list = React.useMemo(
    () =>
      castArray(value)
        .filter(Boolean)
        .map(normalizePreviewFile)
        .filter((file) => getPreviewFileUrl(file)),
    [value],
  );
  React.useEffect(() => {
    if (current >= list.length && list.length) {
      setCurrent(0);
    }
  }, [current, list.length]);
  React.useEffect(() => {
    if (!list.length && previewOpen) {
      setPreviewOpen(false);
    }
  }, [list.length, previewOpen]);
  const onDownload = React.useCallback(
    (fileOverride?: any) => {
      const file = fileOverride || list[current];
      if (!file) {
        return;
      }
      const url = file.url || file.preview;
      if (!url) {
        return;
      }
      let filename = getFileName(file, url);
      const ext = getFileExt(file, url);
      if (filename && ext && !filename.toLowerCase().endsWith(`.${ext}`)) {
        filename = `${filename}.${ext}`;
      }
      const downloadName = `${Date.now()}_${filename || 'file'}`;
      // eslint-disable-next-line promise/catch-or-return
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(new Blob([blob]));
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          URL.revokeObjectURL(blobUrl);
          link.remove();
        });
    },
    [current, list],
  );
  const onOpenAtIndex = React.useCallback((index: number) => {
    setCurrent(index);
    setPreviewOpen(true);
  }, []);
  const onSwitchIndex = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= list.length) {
        return;
      }
      setCurrent(index);
    },
    [list.length],
  );
  return (
    <>
      <Space wrap={true}>
        {list.map((file, index) => (
          <FilePreview
            file={file}
            size={size}
            key={index}
            showFileName={showFileName}
            onClick={() => onOpenAtIndex(index)}
          />
        ))}
      </Space>
      {list[current] ? (
        <FilePreviewRenderer
          open={previewOpen}
          file={list[current]}
          index={current}
          list={list}
          onOpenChange={setPreviewOpen}
          onClose={() => setPreviewOpen(false)}
          onSwitchIndex={onSwitchIndex}
          onDownload={onDownload}
        />
      ) : null}
    </>
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
