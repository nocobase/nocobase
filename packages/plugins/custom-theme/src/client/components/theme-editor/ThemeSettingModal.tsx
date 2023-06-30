import { useAPIClient, useGlobalTheme } from '@nocobase/client';
import { Button, Input, Modal } from 'antd';
import React from 'react';
import { useTranslation } from '../../locale';
import { useThemeEditorContext } from '../ThemeEditorProvider';

interface Props {
  open: boolean;
  onOk?(data: { name: string }): void;
  onCancel?(): void;
}

const ThemeSettingModal = (props: Props) => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const { theme } = useGlobalTheme();
  const { open, onOk, onCancel } = props;
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { refreshRef } = useThemeEditorContext();

  const handleNameChange = React.useCallback((e) => {
    setName(e.target.value);
  }, []);
  const handleOk = React.useCallback(async () => {
    setLoading(true);
    await api.request({
      url: 'themeConfig:create',
      method: 'POST',
      data: {
        config: {
          name,
          ...theme,
        },
        optional: true,
        isBuiltIn: false,
      },
    });
    setLoading(false);
    onOk?.({ name });
    refreshRef.current?.();
  }, [name]);

  return (
    <Modal
      title={t('Save theme')}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
          {t('Save')}
        </Button>,
      ]}
    >
      <Input value={name} onChange={handleNameChange} placeholder={t('Please set a name for this theme')} />
    </Modal>
  );
};

ThemeSettingModal.displayName = 'ThemeSettingModal';

export default ThemeSettingModal;
