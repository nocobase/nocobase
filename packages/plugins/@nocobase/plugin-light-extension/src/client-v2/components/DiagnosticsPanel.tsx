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
import type { LightExtensionProblem } from '../../shared/types';

export interface ProblemsPanelProps {
  problems?: LightExtensionProblem[];
  title?: string;
  onOpenProblem?: (problem: LightExtensionProblem) => void;
}

export function ProblemsPanel(props: ProblemsPanelProps) {
  const { problems = [], onOpenProblem, title } = props;
  const { t } = useTranslation(NAMESPACE);
  const sortedProblems = useMemo(
    () =>
      [...problems].sort((left, right) =>
        [left.severity, left.path || '', left.kind || '', left.entryName || '', left.code, left.message]
          .join('\u0000')
          .localeCompare(
            [right.severity, right.path || '', right.kind || '', right.entryName || '', right.code, right.message].join(
              '\u0000',
            ),
          ),
      ),
    [problems],
  );
  const errorCount = sortedProblems.filter((item) => item.severity === 'error').length;
  const warningCount = sortedProblems.filter((item) => item.severity === 'warning').length;

  return (
    <section aria-label={title || t('Problems')} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space align="center" wrap>
        <Typography.Text strong>{title || t('Problems')}</Typography.Text>
        <Tag color={errorCount > 0 ? 'error' : 'default'}>
          {t('Errors')}: {errorCount}
        </Tag>
        <Tag color={warningCount > 0 ? 'warning' : 'default'}>
          {t('Warnings')}: {warningCount}
        </Tag>
      </Space>

      {sortedProblems.length === 0 ? (
        <Empty description={t('No problems')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : null}

      {sortedProblems.length > 0 ? (
        <List
          dataSource={sortedProblems}
          rowKey={(item) =>
            [
              item.severity,
              item.code,
              item.path || '',
              item.kind || '',
              item.entryName || '',
              item.range?.start.line || '',
              item.range?.start.column || '',
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
                      onOpenProblem ? (
                        <Button icon={<AimOutlined />} onClick={() => onOpenProblem(item)} size="small" type="link">
                          {formatProblemLocation(item, t)}
                        </Button>
                      ) : (
                        <Typography.Text type="secondary">{formatProblemLocation(item, t)}</Typography.Text>
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

export default ProblemsPanel;

function formatProblemLocation(problem: LightExtensionProblem, t: (key: string) => string): string {
  return [
    problem.path,
    problem.kind,
    problem.entryName,
    problem.range?.start.line ? `${t('Line')} ${problem.range.start.line}` : null,
    problem.range?.start.column ? `${t('Column')} ${problem.range.start.column}` : null,
  ]
    .filter(Boolean)
    .join(' / ');
}
