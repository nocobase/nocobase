/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { useAPIClient, useMobileLayout, useToken } from '@nocobase/client';
import { useT } from '../../locale';
import { Button, Popover, Card, App, Typography, Tooltip, Input, Space, Modal } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useChatBoxStore } from './stores/chat-box';
import { useAIConfigRepository } from '../../repositories/hooks/useAIConfigRepository';

export const UserPrompt: React.FC = () => {
  const t = useT();
  const { token } = useToken();
  const { isMobileLayout } = useMobileLayout();
  const { message } = App.useApp();
  const api = useAPIClient();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setCurrentEmployee = useChatBoxStore.use.setCurrentEmployee();
  const aiConfigRepository = useAIConfigRepository();
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState('');

  const open = isMobileLayout ? mobileOpen : desktopOpen;

  useEffect(() => {
    if (open) {
      setPrompt(currentEmployee?.userConfig?.prompt ?? '');
    }
  }, [open, currentEmployee?.userConfig?.prompt]);

  const closeEditor = () => {
    if (isMobileLayout) {
      setMobileOpen(false);
      return;
    }
    setDesktopOpen(false);
  };

  const savePrompt = async () => {
    if (!currentEmployee) {
      return;
    }
    setSaving(true);
    try {
      await api.resource('aiEmployees').updateUserPrompt({
        values: {
          aiEmployee: currentEmployee.username,
          prompt,
        },
      });
      await aiConfigRepository.refreshAIEmployees();
      setCurrentEmployee((prev) => ({
        ...prev,
        userConfig: {
          ...prev.userConfig,
          prompt,
        },
      }));
      message.success(t('Saved successfully'));
      closeEditor();
    } catch (error: any) {
      message.error(error?.message || t('Request failed'));
    } finally {
      setSaving(false);
    }
  };

  const editorCard = (
    <Card
      variant="borderless"
      size="small"
      styles={{
        body: {
          width: isMobileLayout ? 'auto' : '420px',
          maxWidth: 'calc(100vw - 32px)',
          padding: '16px',
        },
      }}
    >
      <Typography.Title
        level={5}
        style={{
          margin: 0,
          marginBottom: 12,
          fontSize: token.fontSizeLG,
          fontWeight: 500,
        }}
      >
        {t('Personalized prompt')}
      </Typography.Title>
      <Typography.Paragraph
        style={{
          marginBottom: 12,
          color: token.colorTextSecondary,
        }}
      >
        {t('Personalized prompt description')}
      </Typography.Paragraph>
      <Input.TextArea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        autoSize={{ minRows: 4, maxRows: 8 }}
        placeholder={t('Personalized prompt')}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: 12,
        }}
      >
        <Space>
          <Button onClick={closeEditor}>{t('Cancel')}</Button>
          <Button type="primary" loading={saving} onClick={savePrompt}>
            {t('Submit')}
          </Button>
        </Space>
      </div>
    </Card>
  );

  return (
    <>
      {isMobileLayout ? (
        <Tooltip arrow={false} title={t('Personalized prompt')}>
          <Button icon={<InfoCircleOutlined />} type="text" onClick={() => setMobileOpen(true)} />
        </Tooltip>
      ) : (
        <Tooltip arrow={false} title={t('Personalized prompt')}>
          <Popover
            zIndex={1101}
            placement="bottomRight"
            open={desktopOpen}
            onOpenChange={setDesktopOpen}
            trigger="click"
            styles={{
              body: {
                padding: 0,
                marginRight: '8px',
              },
            }}
            arrow={false}
            content={editorCard}
          >
            <Button icon={<InfoCircleOutlined />} type="text" />
          </Popover>
        </Tooltip>
      )}
      <Modal
        open={isMobileLayout && mobileOpen}
        onCancel={closeEditor}
        footer={null}
        centered
        width="calc(100vw - 32px)"
        styles={{ body: { padding: 0 } }}
        destroyOnClose
      >
        {editorCard}
      </Modal>
    </>
  );
};
