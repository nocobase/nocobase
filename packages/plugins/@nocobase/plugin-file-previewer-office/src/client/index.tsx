/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useMemo } from 'react';
import { Modal, Button } from 'antd';
import { saveAs } from 'file-saver';

import { Plugin, attachmentFileTypes } from '@nocobase/client';
import { filePreviewTypes, wrapWithModalPreviewer } from '@nocobase/plugin-file-manager/client';
import { useT } from './locale';

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

function OfficeModalPreviewer({ index, list, onSwitchIndex }) {
  const t = useT();
  const file = list[index];
  const url = useMemo(() => {
    return getOfficePreviewUrl(file);
  }, [file]);
  const onOpen = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url);
    },
    [url],
  );
  const onDownload = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveAs(file.url, `${file.title}${file.extname}`);
    },
    [file.extname, file.title, file.url],
  );
  const onClose = useCallback(() => {
    onSwitchIndex(null);
  }, [onSwitchIndex]);
  return (
    <Modal
      open={index != null}
      title={file.title}
      onCancel={onClose}
      footer={[
        <Button key="open" onClick={onOpen}>
          {t('Open in new window')}
        </Button>,
        <Button key="download" onClick={onDownload}>
          {t('Download')}
        </Button>,
        <Button key="close" onClick={onClose}>
          {t('Close')}
        </Button>,
      ]}
      width={'85vw'}
      centered={true}
    >
      <div
        style={{
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 256px)',
          height: '100%',
          width: '100%',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflowY: 'auto',
        }}
      >
        <iframe
          src={url}
          style={{
            width: '100%',
            maxHeight: '100%',
            flex: '1 1 auto',
            border: 'none',
          }}
        />
      </div>
    </Modal>
  );
}

function OfficeInlinePreviewer({ file }) {
  const url = useMemo(() => getOfficePreviewUrl(file), [typeof file === 'string' ? file : file?.url]);
  if (!url) {
    return null;
  }
  return <iframe src={url} width="100%" height="100%" style={{ border: 'none' }} />;
}

export class PluginFilePreviewerOfficeClient extends Plugin {
  async load() {
    attachmentFileTypes.add({
      match: isOfficeFile,
      Previewer: OfficeModalPreviewer,
    });
    filePreviewTypes.add({
      match: isOfficeFile,
      Previewer: wrapWithModalPreviewer(OfficeInlinePreviewer),
    });
  }
}

export default PluginFilePreviewerOfficeClient;
