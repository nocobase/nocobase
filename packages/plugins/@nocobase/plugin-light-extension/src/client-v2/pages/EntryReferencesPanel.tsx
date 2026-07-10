/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Empty, Flex, Space, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import { NAMESPACE } from '../../constants';
import { ReferenceContractDiagnosticsPanel } from '../components/ReferenceContractDiagnosticsPanel';

interface EntryReferencesPanelProps {
  embedded?: boolean;
}

function EntryReferencesPanel({ embedded = false }: EntryReferencesPanelProps) {
  const { t } = useTranslation(NAMESPACE);
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repoId') || '';

  if (!repoId) {
    return (
      <Flex vertical gap={16} style={{ padding: embedded ? 0 : 24 }}>
        {!embedded ? (
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('References')}
          </Typography.Title>
        ) : null}
        <Empty description={t('Select a repository from the light extension list')} />
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16} style={{ padding: embedded ? 0 : 24 }}>
      <Space direction="vertical" size={0}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('References')}
        </Typography.Title>
        <Typography.Text type="secondary">{repoId}</Typography.Text>
      </Space>
      <ReferenceContractDiagnosticsPanel repoId={repoId} />
    </Flex>
  );
}

export default EntryReferencesPanel;
