import { useAPIClient, useGlobalTheme } from '@nocobase/client';
import { Button, Form, Input, Modal, Space } from 'antd';
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
  const [loading, setLoading] = React.useState(false);
  const { refreshRef } = useThemeEditorContext();

  const handleFormValue = React.useCallback(async (values) => {
    setLoading(true);
    await api.request({
      url: 'themeConfig:create',
      method: 'POST',
      data: {
        config: {
          name: values.name,
          ...theme,
        },
        optional: true,
        isBuiltIn: false,
      },
    });
    setLoading(false);
    onOk?.(values);
    refreshRef.current?.();
  }, []);

  return (
    <Modal title={t('Save theme')} open={open} onCancel={onCancel} footer={null}>
      <Form onFinish={handleFormValue} autoComplete="off">
        <Form.Item name="name" rules={[{ required: true, message: t('Please input the theme name') }]}>
          <Input placeholder={t('Please set a name for this theme')} />
        </Form.Item>
        <Space align="end" style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button key="back" onClick={onCancel}>
            {t('Cancel')}
          </Button>
          <Button key="submit" type="primary" loading={loading} htmlType="submit">
            {t('Save')}
          </Button>
        </Space>
      </Form>
    </Modal>
  );
};

ThemeSettingModal.displayName = 'ThemeSettingModal';

export default ThemeSettingModal;
