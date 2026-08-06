/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Empty, Flex, List, Modal, Pagination, Space, Spin, Tag, Typography, theme } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../../constants';
import type { JsTemplateCatalogEntry, JsTemplateUsageListResult } from '../../../shared/types';
import { listJsTemplateUsageLocations, type ApiClientLike } from '../../api/jsTemplatesRequests';

const USAGE_PAGE_SIZE = 10;

export interface JsTemplateUsageModalProps {
  api: ApiClientLike;
  entry: JsTemplateCatalogEntry | null;
  onClose: () => void;
}

export function JsTemplateUsageModal({ api, entry, onClose }: JsTemplateUsageModalProps) {
  const { t } = useTranslation(NAMESPACE);
  const { token } = theme.useToken();
  const [result, setResult] = useState<JsTemplateUsageListResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);
  const requestedPage = useRef(1);

  const loadUsageLocations = useCallback(
    async (targetEntry: JsTemplateCatalogEntry, page: number) => {
      const nextRequestSeq = requestSeq.current + 1;
      requestSeq.current = nextRequestSeq;
      requestedPage.current = page;
      setLoading(true);
      setError(null);
      try {
        const nextResult = await listJsTemplateUsageLocations(api, {
          templateId: targetEntry.id,
          page,
          pageSize: USAGE_PAGE_SIZE,
        });
        if (requestSeq.current === nextRequestSeq) {
          setResult(nextResult);
        }
      } catch (loadError) {
        if (requestSeq.current === nextRequestSeq) {
          setError(loadError instanceof Error ? loadError.message : t('Failed to load usage locations'));
        }
      } finally {
        if (requestSeq.current === nextRequestSeq) {
          setLoading(false);
        }
      }
    },
    [api, t],
  );

  useEffect(() => {
    requestSeq.current += 1;
    requestedPage.current = 1;
    setResult(null);
    setError(null);
    setLoading(false);
    if (entry) {
      loadUsageLocations(entry, 1);
    }
  }, [entry, loadUsageLocations]);

  const close = useCallback(() => {
    requestSeq.current += 1;
    requestedPage.current = 1;
    setResult(null);
    setError(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  return (
    <Modal
      footer={<Button onClick={close}>{t('Close')}</Button>}
      onCancel={close}
      open={Boolean(entry)}
      title={
        entry
          ? t('Usage locations for {{name}}').replace('{{name}}', entry.title || entry.templateName)
          : t('Usage locations')
      }
    >
      {entry?.status === 'disabled' || entry?.status === 'archived' ? (
        <Alert
          message={
            entry.status === 'archived'
              ? t('This JS Template belongs to an archived Source Project and is read-only.')
              : t('This JS Template belongs to a disabled Source Project.')
          }
          showIcon
          style={{ marginBottom: token.marginSM }}
          type="warning"
        />
      ) : null}
      {result?.meta.hiddenCount ? (
        <Alert
          message={t('{{count}} usage locations are hidden by permissions.').replace(
            '{{count}}',
            String(result.meta.hiddenCount),
          )}
          showIcon
          style={{ marginBottom: token.marginSM }}
          type="info"
        />
      ) : null}
      {error ? (
        <Alert
          action={
            entry ? (
              <Button onClick={() => loadUsageLocations(entry, requestedPage.current)} size="small">
                {t('Retry')}
              </Button>
            ) : null
          }
          message={error}
          showIcon
          type="error"
        />
      ) : entry && !result ? (
        <Flex align="center" justify="center" style={{ minHeight: 180 }}>
          <Spin aria-label={t('Loading usage locations')} />
        </Flex>
      ) : (
        <>
          <List
            dataSource={result?.data || []}
            locale={{ emptyText: <Empty description={t('No usage locations')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            loading={loading}
            renderItem={(usage) => (
              <List.Item key={usage.id}>
                <List.Item.Meta
                  description={
                    <Space size="small" wrap>
                      <Typography.Text type="secondary">{usage.ownerTitle}</Typography.Text>
                      <Tag>{t(usage.kind)}</Tag>
                      <Tag color={usage.resolvedStatus === 'active' ? 'success' : 'warning'}>
                        {t(usage.resolvedStatus)}
                      </Tag>
                    </Space>
                  }
                  title={usage.locationTitle}
                />
              </List.Item>
            )}
          />
          {result && result.meta.count > result.meta.pageSize ? (
            <Flex justify="flex-end" style={{ marginTop: token.marginSM }}>
              <Pagination
                current={result.meta.page}
                onChange={(page) => entry && loadUsageLocations(entry, page)}
                pageSize={result.meta.pageSize}
                showSizeChanger={false}
                total={result.meta.count}
              />
            </Flex>
          ) : null}
        </>
      )}
    </Modal>
  );
}
