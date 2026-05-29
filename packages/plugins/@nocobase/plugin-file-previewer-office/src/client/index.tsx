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
// Core office logic + inline previewer live in client-v2; v1 reuses them via relative path
// so there is a single implementation shared by both runtimes.
import { getOfficePreviewUrl, isOfficeFile } from '../client-v2/utils';
import { OfficeInlinePreviewer } from '../client-v2/OfficeInlinePreviewer';
import { useT } from './locale';

interface OfficeModalPreviewerFile {
  url: string;
  title: string;
  extname: string;
}

interface OfficeModalPreviewerProps {
  index: number;
  list: OfficeModalPreviewerFile[];
  onSwitchIndex: (index: number | null) => void;
}

function OfficeModalPreviewer({ index, list, onSwitchIndex }: OfficeModalPreviewerProps) {
  const t = useT();
  const file = list[index];
  const url = useMemo(() => {
    return getOfficePreviewUrl(file);
  }, [file]);
  const onOpen = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url);
    },
    [url],
  );
  const onDownload = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
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
          width: '100%',
          height: 'calc(85vh - 120px)',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <iframe
          src={url}
          style={{
            width: '100%',
            height: '100%',
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
