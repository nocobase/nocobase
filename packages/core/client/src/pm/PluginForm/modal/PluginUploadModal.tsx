import { Modal } from 'antd';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PluginUploadForm } from '../form/PluginUploadForm';

interface IPluginUploadFormProps {
  onClose: (refresh?: boolean) => void;
  name: string;
  isShow: boolean;
}

export const PluginUploadModal: FC<IPluginUploadFormProps> = ({ onClose, name, isShow }) => {
  const { t } = useTranslation();
  return (
    <Modal open={isShow} onCancel={() => onClose()} footer={null} destroyOnClose title={t('Upload plugin')} width={580}>
      <PluginUploadForm onClose={onClose} name={name} isUpdate />
    </Modal>
  );
};
