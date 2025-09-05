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
import { useT } from './locale';

function IframePreviewer({ index, list, onSwitchIndex }) {
  const t = useT();
  const file = list[index];
  const url = useMemo(() => {
    const u = new URL('https://view.officeapps.live.com/op/embed.aspx');
    const src =
      file.url.startsWith('https://') || file.url.startsWith('http://')
        ? file.url
        : `${location.origin}/${file.url.replace(/^\//, '')}`;
    u.searchParams.set('src', src);
    return u.href;
  }, [file.url]);
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
          height: '90vh',
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
            maxHeight: '90vh',
            flex: '1 1 auto',
            border: 'none',
          }}
        />
      </div>
    </Modal>
  );
}

export class PluginFilePreviewerOfficeClient extends Plugin {
  async load() {
    attachmentFileTypes.add({
      match(file) {
        if (
          file.mimetype &&
          [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ].includes(file.mimetype)
        ) {
          return true;
        }
        if (file.url) {
          const src =
            file.url.startsWith('https://') || file.url.startsWith('http://')
              ? file.url
              : `${location.origin}/${file.url.replace(/^\//, '')}`;
          const url = new URL(src);
          const parts = url.pathname.split('.');
          if (parts.length > 1) {
            const ext = parts[parts.length - 1].toLowerCase();
            return ['docx', 'xlsx', 'pptx', 'odt'].includes(ext);
          }
          return false;
        }
        return false;
      },
      Previewer: IframePreviewer,
    });
  }
}

export default PluginFilePreviewerOfficeClient;
