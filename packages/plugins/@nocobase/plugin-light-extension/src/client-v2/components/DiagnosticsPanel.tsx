/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Empty, List, Space, Tag, Typography } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type { LightExtensionDiagnostic } from '../../shared/types';

export interface DiagnosticsPanelProps {
  diagnostics?: LightExtensionDiagnostic[];
  title?: string;
}

export function DiagnosticsPanel(props: DiagnosticsPanelProps) {
  const { diagnostics = [], title } = props;
  const { t } = useTranslation(NAMESPACE);
  const sortedDiagnostics = useMemo(
    () =>
      [...diagnostics].sort((left, right) =>
        [left.severity, left.path || '', left.kind || '', left.entryName || '', left.code, left.message]
          .join('\u0000')
          .localeCompare(
            [right.severity, right.path || '', right.kind || '', right.entryName || '', right.code, right.message].join(
              '\u0000',
            ),
          ),
      ),
    [diagnostics],
  );
  const errorCount = sortedDiagnostics.filter((item) => item.severity === 'error').length;
  const warningCount = sortedDiagnostics.filter((item) => item.severity === 'warning').length;

  return (
    <section aria-label={title || t('Diagnostics')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space align="center" wrap>
        <Typography.Text strong>{title || t('Diagnostics')}</Typography.Text>
        <Tag color={errorCount > 0 ? 'error' : 'default'}>
          {t('Errors')}: {errorCount}
        </Tag>
        <Tag color={warningCount > 0 ? 'warning' : 'default'}>
          {t('Warnings')}: {warningCount}
        </Tag>
      </Space>

      {sortedDiagnostics.length === 0 ? (
        <Empty description={t('No diagnostics')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : null}

      {sortedDiagnostics.length > 0 ? (
        <List
          dataSource={sortedDiagnostics}
          rowKey={(item, index) => `${item.severity}:${item.code}:${item.path || ''}:${index}`}
          size="small"
          renderItem={(item) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Alert
                description={
                  <Space direction="vertical" size={2}>
                    <Typography.Text>{item.message}</Typography.Text>
                    <Typography.Text type="secondary">
                      {[item.path, item.kind, item.entryName, item.line ? `${t('Line')} ${item.line}` : null]
                        .filter(Boolean)
                        .join(' / ')}
                    </Typography.Text>
                  </Space>
                }
                message={
                  <Space wrap>
                    <Tag color={item.severity === 'error' ? 'error' : 'warning'}>{t(item.severity)}</Tag>
                    <Typography.Text code>{item.code}</Typography.Text>
                  </Space>
                }
                showIcon
                style={{ width: '100%' }}
                type={item.severity === 'error' ? 'error' : 'warning'}
              />
            </List.Item>
          )}
        />
      ) : null}
    </section>
  );
}

export default DiagnosticsPanel;
