import { Modal } from 'antd';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PluginUrlForm } from '../form/PluginUrlForm';

interface IPluginUploadFormProps {
  onClose: (refresh?: boolean) => void;
  name: string;
  isShow: boolean;
  compressedFileUrl: string;
}

export const PluginUrlModal: FC<IPluginUploadFormProps> = ({ onClose, name, isShow, compressedFileUrl }) => {
  const { t } = useTranslation();
  return (
    <Modal open={isShow} onCancel={() => onClose()} footer={null} destroyOnClose title={t('Upload plugin')} width={580}>
      <PluginUrlForm onClose={onClose} compressedFileUrl={compressedFileUrl} name={name} isUpdate />
    </Modal>
  );
};
