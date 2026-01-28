/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Card, Select, Input, Button, Space, Spin, message, Alert } from 'antd';
import { useRequest, useAPIClient } from '@nocobase/client';
import { useT } from '../locale';
import { updatePreviewConfig } from '../index';
import { KKFILEVIEW_DEFAULT_EXTENSIONS } from '../utils';

const PREVIEW_TYPE_OPTIONS = [
  {
    label: 'Microsoft Online',
    value: 'microsoft',
  },
  {
    label: 'KKFileView',
    value: 'kkfileview',
  },
];

export const Configuration = () => {
  const t = useT();
  const api = useAPIClient();
  const [formData, setFormData] = useState({
    previewType: 'microsoft',
    kkFileViewUrl: 'http://localhost:8012',
    kkFileViewExtensions: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 获取配置数据
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await api.request({
          url: '/filePreviewer:list',
        });
        if (response.data?.data?.[0]) {
          const config = response.data.data[0];
          setFormData({
            previewType: config.previewType || 'microsoft',
            kkFileViewUrl: config.kkFileViewUrl || 'http://localhost:8012',
            kkFileViewExtensions: config.kkFileViewExtensions || '',
          });
        }
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [api]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 获取现有配置的 id
      const listResponse = await api.request({
        url: '/filePreviewer:list',
      });
      const configId = listResponse.data?.data?.[0]?.id;

      if (configId) {
        // 更新现有配置
        await api.request({
          url: `/filePreviewer:update?filterByTk=${configId}`,
          method: 'PATCH',
          data: formData,
        });
      } else {
        // 创建新配置
        await api.request({
          url: '/filePreviewer:create',
          method: 'POST',
          data: formData,
        });
      }

      // Update global preview config immediately after save
      updatePreviewConfig(formData);

      message.success(t('Settings saved successfully'));
    } catch (error) {
      console.error('Failed to save configuration:', error);
      message.error(t('Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Alert message={t('Configuration')} type="info" showIcon style={{ marginBottom: 24 }} />

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{t('Preview Type')}</label>
          <Select
            style={{ width: '100%' }}
            placeholder={t('Select preview type')}
            value={formData.previewType}
            onChange={(value) => setFormData({ ...formData, previewType: value })}
            options={PREVIEW_TYPE_OPTIONS.map((opt) => ({
              ...opt,
              label: t(opt.label),
            }))}
          />
        </div>

        {formData.previewType === 'microsoft' && (
          <div style={{ marginBottom: 24 }}>
            <Alert message={t('Microsoft Online Preview requires public network access')} type="warning" showIcon />
          </div>
        )}

        {formData.previewType === 'kkfileview' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{t('KKFileView URL')}</label>
              <Input
                placeholder="http://localhost:8012"
                value={formData.kkFileViewUrl}
                onChange={(e) => setFormData({ ...formData, kkFileViewUrl: e.target.value })}
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                {t('KKFileView server address (e.g., http://localhost:8012)')}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>{t('KKFileView Extensions')}</label>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder={t('Enter extensions (e.g. pdf, dwg)')}
                value={formData.kkFileViewExtensions ? formData.kkFileViewExtensions.split(',').filter(Boolean) : []}
                onChange={(values) => {
                  setFormData({ ...formData, kkFileViewExtensions: values.join(',') });
                }}
                tokenSeparators={[',', ' ']}
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                {t(
                  'Extensions to force use KKFileView. If empty, a default safe list (Office, PDF, Text, Code) will be used.',
                )}
                <br />
                {t('Default list')}: {KKFILEVIEW_DEFAULT_EXTENSIONS.slice(0, 10).join(', ')}...
              </div>
            </div>
          </div>
        )}

        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {t('Save')}
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default Configuration;
