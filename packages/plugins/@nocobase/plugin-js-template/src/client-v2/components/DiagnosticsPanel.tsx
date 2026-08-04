/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AimOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, List, Space, Tag, Typography } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type { JsTemplateDiagnostic } from '../../shared/types';

export interface DiagnosticsPanelProps {
  diagnostics?: JsTemplateDiagnostic[];
  title?: string;
  onOpenDiagnostic?: (diagnostic: JsTemplateDiagnostic) => void;
}

export function DiagnosticsPanel(props: DiagnosticsPanelProps) {
  const { diagnostics = [], onOpenDiagnostic, title } = props;
  const { t } = useTranslation(NAMESPACE);
  const sortedDiagnostics = useMemo(
    () =>
      [...diagnostics].sort((left, right) =>
        [left.severity, left.path || '', left.kind || '', left.templateName || '', left.code, left.message]
          .join('\u0000')
          .localeCompare(
            [
              right.severity,
              right.path || '',
              right.kind || '',
              right.templateName || '',
              right.code,
              right.message,
            ].join('\u0000'),
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
          rowKey={(item) =>
            [
              item.severity,
              item.code,
              item.path || '',
              item.kind || '',
              item.templateName || '',
              item.line || '',
              item.column || '',
              item.message,
            ].join(':')
          }
          size="small"
          renderItem={(item) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Alert
                description={
                  <Space direction="vertical" size={2}>
                    <Typography.Text>{item.message}</Typography.Text>
                    {item.path ? (
                      onOpenDiagnostic ? (
                        <Button icon={<AimOutlined />} onClick={() => onOpenDiagnostic(item)} size="small" type="link">
                          {formatDiagnosticLocation(item, t)}
                        </Button>
                      ) : (
                        <Typography.Text type="secondary">{formatDiagnosticLocation(item, t)}</Typography.Text>
                      )
                    ) : null}
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

function formatDiagnosticLocation(diagnostic: JsTemplateDiagnostic, t: (key: string) => string): string {
  return [
    diagnostic.path,
    diagnostic.kind,
    diagnostic.templateName,
    diagnostic.line ? `${t('Line')} ${diagnostic.line}` : null,
    diagnostic.column ? `${t('Column')} ${diagnostic.column}` : null,
  ]
    .filter(Boolean)
    .join(' / ');
}
