import { Modal, Radio } from 'antd';
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useStyles } from '../../style';
import { IPluginData } from '../../types';
import { PluginNpmForm } from '../form/PluginNpmForm';
import { PluginUploadForm } from '../form/PluginUploadForm';
import { PluginUrlForm } from '../form/PluginUrlForm';

interface IPluginUpgradeModalProps {
  onClose: (refresh?: boolean) => void;
  isShow: boolean;
  pluginData: IPluginData;
}

export const PluginUpgradeModal: FC<IPluginUpgradeModalProps> = ({ onClose, isShow, pluginData }) => {
  const { t } = useTranslation();
  const { theme } = useStyles();

  const [type, setType] = useState<'npm' | 'upload' | 'url'>('npm');

  return (
    <Modal onCancel={() => onClose()} footer={null} destroyOnClose title={t('Update plugin')} width={580} open={isShow}>
      {/* <label style={{ fontWeight: 'bold' }}>{t('Source')}:</label> */}
      <div style={{ marginTop: theme.marginLG, marginBottom: theme.marginLG }}>
        <Radio.Group optionType="button" defaultValue={type} onChange={(e) => setType(e.target.value)}>
          <Radio value="npm">{t('Npm package')}</Radio>
          <Radio value="upload">{t('Upload plugin')}</Radio>
          <Radio value="url">{t('Compressed file url')}</Radio>
        </Radio.Group>
      </div>
      {type === 'npm' && <PluginNpmForm isUpgrade onClose={onClose} pluginData={pluginData} />}
      {type === 'upload' && <PluginUploadForm isUpgrade onClose={onClose} pluginData={pluginData} />}
      {type === 'url' && <PluginUrlForm isUpgrade onClose={onClose} pluginData={pluginData} />}
    </Modal>
  );
};
