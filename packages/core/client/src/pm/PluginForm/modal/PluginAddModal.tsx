/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Modal, Radio } from 'antd';
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../style';

import { PluginNpmForm } from '../form/PluginNpmForm';
import { PluginUploadForm } from '../form/PluginUploadForm';
import { PluginUrlForm } from '../form/PluginUrlForm';

interface IPluginFormProps {
  onClose: (refresh?: boolean) => void;
  isShow: boolean;
}

export const PluginAddModal: FC<IPluginFormProps> = ({ onClose, isShow }) => {
  const { t } = useTranslation();
  const { theme } = useStyles();
  const [type, setType] = useState<'npm' | 'upload' | 'url'>('npm');

  return (
    <Modal onCancel={() => onClose()} footer={null} destroyOnClose title={t('Add & Update')} width={580} open={isShow}>
      {/* <label style={{ fontWeight: 'bold' }}>{t('Source')}:</label> */}
      <div style={{ marginTop: theme.marginLG, marginBottom: theme.marginLG }}>
        <Radio.Group optionType="button" defaultValue={type} onChange={(e) => setType(e.target.value)}>
          <Radio value="npm">{t('Npm package')}</Radio>
          <Radio value="upload">{t('Upload plugin')}</Radio>
          <Radio value="url">{t('Compressed file url')}</Radio>
        </Radio.Group>
      </div>
      {type === 'npm' && <PluginNpmForm onClose={onClose} isUpgrade={false} />}
      {type === 'upload' && <PluginUploadForm onClose={onClose} isUpgrade={false} />}
      {type === 'url' && <PluginUrlForm onClose={onClose} />}
    </Modal>
  );
};
