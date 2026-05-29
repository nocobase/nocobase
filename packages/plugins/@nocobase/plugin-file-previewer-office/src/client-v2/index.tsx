/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';

import { Plugin } from '@nocobase/client-v2';
import { filePreviewTypes, wrapWithModalPreviewer } from '@nocobase/plugin-file-manager/client-v2';

const OFFICE_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.text',
];

const OFFICE_EXTS = ['docx', 'xlsx', 'pptx', 'odt', 'doc', 'xls', 'ppt'];

const getOfficeFileExt = (file: any) => {
  const value = typeof file === 'string' ? file : file?.extname || file?.name || file?.filename || file?.url || '';
  const clean = value.split('?')[0].split('#')[0];
  const index = clean.lastIndexOf('.');
  return index !== -1 ? clean.slice(index + 1).toLowerCase() : '';
};

const resolveFileUrl = (file: any) => {
  const url = typeof file === 'string' ? file : file?.url;
  if (!url) {
    return '';
  }
  return url.startsWith('https://') || url.startsWith('http://') ? url : `${location.origin}/${url.replace(/^\//, '')}`;
};

const getOfficePreviewUrl = (file: any) => {
  const src = resolveFileUrl(file);
  if (!src) {
    return '';
  }
  const url = new URL('https://view.officeapps.live.com/op/embed.aspx');
  url.searchParams.set('src', src);
  return url.href;
};

const isOfficeFile = (file: any) => {
  if (file?.mimetype && OFFICE_MIME_TYPES.includes(file.mimetype)) {
    return true;
  }
  const ext = getOfficeFileExt(file);
  return !!ext && OFFICE_EXTS.includes(ext);
};

function OfficeInlinePreviewer({ file }) {
  const fileUrl = typeof file === 'string' ? file : file?.url;
  const url = useMemo(() => getOfficePreviewUrl(fileUrl), [fileUrl]);
  if (!url) {
    return null;
  }
  return <iframe src={url} width="100%" height="100%" style={{ border: 'none' }} />;
}

export class PluginFilePreviewerOfficeClientV2 extends Plugin {
  async load() {
    filePreviewTypes.add({
      match: isOfficeFile,
      Previewer: wrapWithModalPreviewer(OfficeInlinePreviewer),
    });
  }
}

export default PluginFilePreviewerOfficeClientV2;
