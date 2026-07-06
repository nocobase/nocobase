/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Empty, Flex, Select, Space, Typography } from 'antd';
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFlowContext } from '@nocobase/flow-engine';

import { NAMESPACE } from '../../constants';
import type { LightExtensionPublicationMetadataRecord } from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import {
  listLightExtensionEntryPublications,
  listSelectableLightExtensionEntries,
} from '../api/lightExtensionEntriesRequests';
import { ReferenceImpactPanel } from '../components/ReferenceImpactPanel';
import { settingsPath } from './LightExtensionListPage';

type FlowContextWithApi = {
  api: ApiClientLike;
};

function EntryReferencesPanel() {
  const { t } = useTranslation(NAMESPACE);
  const ctx = useFlowContext<FlowContextWithApi>();
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repoId') || '';
  const entryId = searchParams.get('entryId') || undefined;
  const [publications, setPublications] = React.useState<LightExtensionPublicationMetadataRecord[]>([]);
  const [targetPublicationId, setTargetPublicationId] = React.useState<string>();
  const [loadingPublications, setLoadingPublications] = React.useState(false);
  const [publicationError, setPublicationError] = React.useState<string | null>(null);
  const selectablePublications = React.useMemo(
    () =>
      publications.filter(
        (publication) => publication.repoId === repoId && (!entryId || publication.entryId === entryId),
      ),
    [entryId, publications, repoId],
  );

  React.useEffect(() => {
    if (!repoId) {
      return;
    }
    let mounted = true;
    const loadPublications = async () => {
      setLoadingPublications(true);
      setPublicationError(null);
      try {
        const nextPublications = entryId
          ? (await listLightExtensionEntryPublications(ctx.api, entryId)).publications
          : await listRepoSelectablePublications(ctx.api, repoId);
        if (!mounted) {
          return;
        }
        setPublications(nextPublications);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setPublications([]);
        setPublicationError(error instanceof Error ? error.message : t('Failed to load publications'));
      } finally {
        if (mounted) {
          setLoadingPublications(false);
        }
      }
    };
    loadPublications();
    return () => {
      mounted = false;
    };
  }, [ctx.api, entryId, repoId, t]);

  React.useEffect(() => {
    setTargetPublicationId((current) => {
      if (current && selectablePublications.some((publication) => publication.id === current)) {
        return current;
      }
      return selectablePublications[0]?.id;
    });
  }, [selectablePublications]);

  if (!repoId) {
    return (
      <Flex vertical gap={16} style={{ padding: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('References')}
        </Typography.Title>
        <Empty description={t('Select a repository from the light extension list')} />
        <Button>
          <Link to={settingsPath.list}>{t('Back to list')}</Link>
        </Button>
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16} style={{ padding: 24 }}>
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <Space direction="vertical" size={0}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('References')}
          </Typography.Title>
          <Typography.Text type="secondary">{repoId}</Typography.Text>
        </Space>
        <Space wrap>
          <Select
            aria-label={t('Target publication')}
            loading={loadingPublications}
            placeholder={t('Target publication')}
            style={{ minWidth: 280 }}
            value={targetPublicationId}
            onChange={setTargetPublicationId}
            options={selectablePublications.map((publication) => ({
              label: publication.id,
              value: publication.id,
            }))}
          />
          <Button>
            <Link to={settingsPath.publications(repoId)}>{t('Publications')}</Link>
          </Button>
          <Button>
            <Link to={settingsPath.entries(repoId)}>{t('Entries')}</Link>
          </Button>
        </Space>
      </Flex>
      {targetPublicationId ? (
        <ReferenceImpactPanel
          input={{
            repoId,
            entryId,
            toPublicationId: targetPublicationId,
          }}
        />
      ) : publicationError ? (
        <Empty description={publicationError} />
      ) : (
        <Empty description={t('Select a target publication')} />
      )}
    </Flex>
  );
}

async function listRepoSelectablePublications(
  api: ApiClientLike,
  repoId: string,
): Promise<LightExtensionPublicationMetadataRecord[]> {
  const entries = await listSelectableLightExtensionEntries(api, { repoId });
  const publicationGroups = await Promise.all(
    entries
      .filter((entry) => entry.kind === 'js-block')
      .map((entry) => listLightExtensionEntryPublications(api, entry.id)),
  );
  return publicationGroups.flatMap((group) => group.publications);
}

export default EntryReferencesPanel;
