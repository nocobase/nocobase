/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Attachments } from '@ant-design/x';
import { Flex, Image, Tag, theme, type UploadFile } from 'antd';
import type { Attachment } from '../../types';
import { getFileIconByExt } from '../utils';

type AntAttachmentItem = NonNullable<React.ComponentProps<typeof Attachments>['items']>[number] & {
  source: Attachment;
};

export const AttachmentList: React.FC<{
  attachments?: Attachment[] | null;
  closable?: boolean;
  onRemove?: (filename: string) => void;
}> = ({ attachments, closable, onRemove }) => {
  const { token } = theme.useToken();
  const items = Array.isArray(attachments) ? attachments : [];

  if (!items.length) {
    return null;
  }

  return (
    <Flex wrap gap="small">
      {items.map((attachment, index) => {
        const filename = getAttachmentFilename(attachment) || String(index);
        const preview = getAttachmentPreview(attachment);
        const icon = preview ? (
          <Image
            alt={filename}
            preview={false}
            src={preview}
            width={token.controlHeightSM}
            height={token.controlHeightSM}
          />
        ) : (
          <Image
            alt={filename}
            preview={false}
            src={getFileIconByExt(filename)}
            width={token.controlHeightSM}
            height={token.controlHeightSM}
            fallback=""
          />
        );

        return (
          <Tag
            key={`${filename}-${index}`}
            closable={closable}
            onClose={() => {
              onRemove?.(filename);
            }}
            style={{
              padding: '2px 4px',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                gap: 4,
              }}
            >
              {icon}
              {filename}
            </span>
          </Tag>
        );
      })}
    </Flex>
  );
};

export const FileCardList: React.FC<{
  attachments?: Attachment[] | null;
  onRemove?: (attachment: Attachment) => void;
}> = ({ attachments, onRemove }) => {
  const items = useAttachmentFileCards(attachments);

  if (!items.length) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
      }}
    >
      {items.map((item) => (
        <Attachments.FileCard
          key={item.uid}
          item={item}
          onRemove={
            onRemove
              ? () => {
                  onRemove(item.source);
                }
              : undefined
          }
        />
      ))}
    </div>
  );
};

export const useAttachmentFileCards = (attachments: Attachment[] | null | undefined): AntAttachmentItem[] =>
  useMemo(
    () =>
      (Array.isArray(attachments) ? attachments : []).map((attachment, index) => ({
        ...attachment,
        uid: getAttachmentUid(attachment) || `${getAttachmentFilename(attachment) || 'file'}-${index}`,
        name: getAttachmentFilename(attachment) || String(index),
        status: getAttachmentStatus(attachment),
        url: getAttachmentUrl(attachment),
        size: typeof attachment.size === 'number' ? attachment.size : undefined,
        thumbUrl: getAttachmentPreview(attachment),
        response: attachment.response,
        source: attachment,
      })),
    [attachments],
  );

export const useUploadFileList = (attachments: Attachment[] | null | undefined): UploadFile[] =>
  useMemo(
    () =>
      (Array.isArray(attachments) ? attachments : []).map((attachment, index) => ({
        uid: getAttachmentUid(attachment) || `${getAttachmentFilename(attachment) || 'file'}-${index}`,
        name: getAttachmentFilename(attachment) || String(index),
        status: getAttachmentStatus(attachment),
        url: getAttachmentUrl(attachment),
        thumbUrl: getAttachmentPreview(attachment),
        response: attachment.response,
      })),
    [attachments],
  );

function getAttachmentFilename(attachment: Attachment) {
  return readString(attachment.filename) || readString(attachment.name);
}

function getAttachmentUid(attachment: Attachment) {
  return readString(attachment.uid);
}

function getAttachmentStatus(attachment: Attachment): UploadFile['status'] {
  const status = readString(attachment.status);
  return status === 'uploading' || status === 'error' || status === 'removed' ? status : 'done';
}

function getAttachmentUrl(attachment: Attachment) {
  return readString(attachment.url);
}

function getAttachmentPreview(attachment: Attachment) {
  return readString(attachment.preview) || readString(attachment.thumbUrl) || readString(attachment.url);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}
