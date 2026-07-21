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
import { sortLightExtensionProblems } from '../../shared/problems';
import type { LightExtensionProblem } from '../../shared/types';
import { getWorkspaceProblemRowKey } from '../problems/workspaceProblemStore';

export interface ProblemsPanelProps {
  problems?: readonly LightExtensionProblem[];
  staleProblems?: readonly LightExtensionProblem[];
  title?: string;
  onOpenProblem?: (problem: LightExtensionProblem) => void;
}

interface ProblemListItem {
  problem: LightExtensionProblem;
  stale: boolean;
}

export function ProblemsPanel(props: ProblemsPanelProps) {
  const { problems = [], staleProblems = [], onOpenProblem, title } = props;
  const { t } = useTranslation(NAMESPACE);
  const items = useMemo<ProblemListItem[]>(() => {
    const currentFingerprints = new Set(problems.map((problem) => problem.fingerprint));
    return [
      ...sortLightExtensionProblems(problems).map((problem) => ({ problem, stale: false })),
      ...sortLightExtensionProblems(staleProblems)
        .filter((problem) => !currentFingerprints.has(problem.fingerprint))
        .map((problem) => ({ problem, stale: true })),
    ];
  }, [problems, staleProblems]);
  const errorCount = problems.filter((item) => item.severity === 'error').length;
  const warningCount = problems.filter((item) => item.severity === 'warning').length;
  const staleCount = items.filter((item) => item.stale).length;

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
        {staleCount > 0 ? (
          <Tag>
            {t('Stale')}: {staleCount}
          </Tag>
        ) : null}
      </Space>

      {items.length === 0 ? <Empty description={t('No problems')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}

      {items.length > 0 ? (
        <List
          dataSource={items}
          rowKey={(item) => `${item.stale ? 'stale' : 'current'}:${getWorkspaceProblemRowKey(item.problem)}`}
          size="small"
          renderItem={({ problem, stale }) => {
            const location = formatProblemLocation(problem, t);
            const canOpen = Boolean(onOpenProblem && problem.path && problem.range?.start);
            return (
              <List.Item style={{ paddingInline: 0 }}>
                <Alert
                  description={
                    <Space direction="vertical" size={2}>
                      <Typography.Text>{problem.message}</Typography.Text>
                      {location ? (
                        canOpen ? (
                          <Button
                            aria-label={`${t('Open problem source')}: ${location}`}
                            icon={<AimOutlined />}
                            onClick={() => onOpenProblem?.(problem)}
                            size="small"
                            type="link"
                          >
                            {location}
                          </Button>
                        ) : (
                          <Typography.Text type="secondary">{location}</Typography.Text>
                        )
                      ) : null}
                    </Space>
                  }
                  message={
                    <Space wrap>
                      <Tag color={problem.severity === 'error' ? 'error' : 'warning'}>{t(problem.severity)}</Tag>
                      <Tag>{t(problem.phase)}</Tag>
                      <Tag>{t(problem.source)}</Tag>
                      {stale ? <Tag>{t('Stale')}</Tag> : null}
                      <Typography.Text code>{problem.code}</Typography.Text>
                    </Space>
                  }
                  showIcon
                  style={{ opacity: stale ? 0.68 : 1, width: '100%' }}
                  type={problem.severity === 'error' ? 'error' : 'warning'}
                />
              </List.Item>
            );
          }}
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
