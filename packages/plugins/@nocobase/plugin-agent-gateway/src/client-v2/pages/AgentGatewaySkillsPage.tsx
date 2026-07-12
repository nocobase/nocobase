/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CopyOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayContext,
  formatDateTime,
  getRequiredResponseData,
  getResponseData,
  statusTag,
} from './AgentGatewayPageUtils';

interface SkillUploadFormValues {
  skillKey?: string;
  displayName?: string;
  versionLabel?: string;
}

interface SkillUploadResult {
  skillId?: string;
  skillKey?: string;
  skillVersionId: string;
  versionLabel?: string;
  status?: string;
  idempotent?: boolean;
}

interface SkillVersionRecord {
  id: string;
  skillVersionId?: string;
  skillId?: string | null;
  skillKey?: string | null;
  displayName?: string | null;
  skillStatus?: string | null;
  versionLabel?: string;
  status?: string;
  sourceType?: string | null;
  sourceSha256?: string | null;
  sourceSizeBytes?: number | null;
  sourceUploadedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

const DEFAULT_SKILL_UPLOAD_FORM_VALUES: SkillUploadFormValues = {
  skillKey: 'nb-opencode-ui-batch',
  displayName: 'NB OpenCode UI Batch',
  versionLabel: 'local',
};

const SKILL_VERSION_DETAIL_QUERY_PARAM = 'skillVersionId';
const SKILL_DETAIL_DRAWER_WIDTH = 720;

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',').pop() || '' : result);
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

function getSkillVersionIdFromLocationSearch() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return new URLSearchParams(window.location.search).get(SKILL_VERSION_DETAIL_QUERY_PARAM) || undefined;
}

function replaceSkillVersionIdInLocationSearch(skillVersionId?: string) {
  if (typeof window === 'undefined') {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (skillVersionId) {
    params.set(SKILL_VERSION_DETAIL_QUERY_PARAM, skillVersionId);
  } else {
    params.delete(SKILL_VERSION_DETAIL_QUERY_PARAM);
  }
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function getSkillVersionDisplayLabel(skillVersion: SkillVersionRecord) {
  return [
    skillVersion.displayName || skillVersion.skillKey || skillVersion.skillId || skillVersion.id,
    skillVersion.versionLabel,
  ]
    .filter(Boolean)
    .join(' / ');
}

export default function AgentGatewaySkillsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [skillUploadForm] = Form.useForm<SkillUploadFormValues>();
  const [selectedSkillVersionId, setSelectedSkillVersionId] = useState<string | undefined>(() =>
    getSkillVersionIdFromLocationSearch(),
  );
  const [skillDetailOpen, setSkillDetailOpen] = useState(() => Boolean(getSkillVersionIdFromLocationSearch()));
  const [skillUploadOpen, setSkillUploadOpen] = useState(false);
  const [skillZipContentBase64, setSkillZipContentBase64] = useState('');
  const [skillUploadResult, setSkillUploadResult] = useState<SkillUploadResult | null>(null);

  const skillVersionsRequest = useRequest(async () => {
    const response = await ctx.api.request<SkillVersionRecord[]>({
      url: 'agent-gateway/skill-versions:list',
      method: 'get',
    });
    return getResponseData(response, []);
  });

  const selectedSkillVersion = useMemo(
    () =>
      skillVersionsRequest.data?.find(
        (skillVersion) =>
          skillVersion.id === selectedSkillVersionId || skillVersion.skillVersionId === selectedSkillVersionId,
      ),
    [selectedSkillVersionId, skillVersionsRequest.data],
  );

  const uploadSkillVersionRequest = useRequest(
    async (values: SkillUploadFormValues & { contentBase64: string }) => {
      const response = await ctx.api.request<SkillUploadResult>({
        url: 'agent-gateway/skill-versions:upload-zip',
        method: 'post',
        data: { ...values },
      });
      return getRequiredResponseData(response, t('Failed to upload skill'));
    },
    {
      manual: true,
      onSuccess(result) {
        setSkillUploadResult(result);
        skillVersionsRequest.refresh();
        ctx.message?.success(t('Skill uploaded'));
      },
      onError() {
        ctx.message?.error(t('Failed to upload skill'));
      },
    },
  );

  const closeSkillUploadModal = useCallback(() => {
    setSkillUploadOpen(false);
    setSkillZipContentBase64('');
    setSkillUploadResult(null);
    skillUploadForm.resetFields();
  }, [skillUploadForm]);

  const openSkillUploadModal = useCallback(() => {
    setSkillZipContentBase64('');
    setSkillUploadResult(null);
    skillUploadForm.setFieldsValue(DEFAULT_SKILL_UPLOAD_FORM_VALUES);
    setSkillUploadOpen(true);
  }, [skillUploadForm]);

  const openSkillDetails = useCallback((skillVersion: SkillVersionRecord) => {
    const skillVersionId = skillVersion.skillVersionId || skillVersion.id;
    setSelectedSkillVersionId(skillVersionId);
    setSkillDetailOpen(true);
    replaceSkillVersionIdInLocationSearch(skillVersionId);
  }, []);

  const closeSkillDetails = useCallback(() => {
    setSkillDetailOpen(false);
    setSelectedSkillVersionId(undefined);
    replaceSkillVersionIdInLocationSearch();
  }, []);

  const syncSkillDetailFromLocation = useCallback(() => {
    const skillVersionId = getSkillVersionIdFromLocationSearch();
    setSelectedSkillVersionId(skillVersionId);
    setSkillDetailOpen(Boolean(skillVersionId));
  }, []);

  const submitSkillUpload = useCallback(async () => {
    const values = await skillUploadForm.validateFields();
    if (!skillZipContentBase64) {
      ctx.message?.error(t('Skill ZIP file is required'));
      return;
    }
    uploadSkillVersionRequest.run({
      ...values,
      contentBase64: skillZipContentBase64,
    });
  }, [ctx.message, skillUploadForm, skillZipContentBase64, t, uploadSkillVersionRequest]);

  const handleSkillZipBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(
    async (file) => {
      if (!file) {
        setSkillZipContentBase64('');
        return false;
      }
      try {
        setSkillZipContentBase64(await readFileAsBase64(file));
      } catch {
        setSkillZipContentBase64('');
        ctx.message?.error(t('Failed to read skill ZIP file'));
      }
      return false;
    },
    [ctx.message, t],
  );

  const handleSkillZipRemove = useCallback(() => {
    setSkillZipContentBase64('');
    return true;
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncSkillDetailFromLocation);
    return () => {
      window.removeEventListener('popstate', syncSkillDetailFromLocation);
    };
  }, [syncSkillDetailFromLocation]);

  const skillVersionColumns = useMemo<ColumnsType<SkillVersionRecord>>(
    () => [
      {
        title: t('Skill'),
        key: 'skill',
        render: (_value: unknown, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Link strong onClick={() => openSkillDetails(record)}>
              {record.displayName || record.skillKey || record.skillId || '-'}
            </Typography.Link>
            {record.skillKey ? <Typography.Text type="secondary">{record.skillKey}</Typography.Text> : null}
          </Space>
        ),
      },
      {
        title: t('Version label'),
        dataIndex: 'versionLabel',
        key: 'versionLabel',
        render: (value: string | undefined) => value || '-',
      },
      {
        title: t('Status'),
        key: 'status',
        render: (_value: unknown, record) => (
          <Space size={4} wrap>
            {statusTag(record.status)}
            {record.skillStatus && record.skillStatus !== record.status ? statusTag(record.skillStatus) : null}
          </Space>
        ),
      },
      {
        title: t('Source'),
        key: 'source',
        render: (_value: unknown, record) =>
          [record.sourceType, record.sourceSha256 ? `${record.sourceSha256.slice(0, 8)}...` : '']
            .filter(Boolean)
            .join(' / ') || '-',
      },
      {
        title: t('Updated at'),
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value: string | null | undefined) => formatDateTime(value || undefined),
      },
    ],
    [openSkillDetails, t],
  );

  return (
    <section aria-label={t('Agent Gateway Skills')}>
      <Card variant="borderless">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex justify="flex-end">
            <Space>
              <Button icon={<ReloadOutlined />} onClick={skillVersionsRequest.refresh}>
                {t('Refresh')}
              </Button>
              <Button type="primary" icon={<UploadOutlined />} onClick={openSkillUploadModal}>
                {t('Upload skill')}
              </Button>
            </Space>
          </Flex>

          <Table<SkillVersionRecord>
            columns={skillVersionColumns}
            dataSource={skillVersionsRequest.data || []}
            loading={skillVersionsRequest.loading}
            rowKey="id"
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No skills yet')} />,
            }}
            pagination={false}
          />
        </Space>
      </Card>

      <Drawer
        title={selectedSkillVersion ? getSkillVersionDisplayLabel(selectedSkillVersion) : t('Skill detail')}
        open={skillDetailOpen}
        onClose={closeSkillDetails}
        width={SKILL_DETAIL_DRAWER_WIDTH}
        destroyOnClose
      >
        {selectedSkillVersion ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label={t('Skill')}>{selectedSkillVersion.displayName || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('Skill key')}>{selectedSkillVersion.skillKey || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('Skill ID')}>{selectedSkillVersion.skillId || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('Skill version ID')}>
              {selectedSkillVersion.skillVersionId || selectedSkillVersion.id}
            </Descriptions.Item>
            <Descriptions.Item label={t('Version label')}>{selectedSkillVersion.versionLabel || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('Status')}>
              <Space size={4} wrap>
                {statusTag(selectedSkillVersion.status)}
                {selectedSkillVersion.skillStatus && selectedSkillVersion.skillStatus !== selectedSkillVersion.status
                  ? statusTag(selectedSkillVersion.skillStatus)
                  : null}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('Source')}>
              {[selectedSkillVersion.sourceType, selectedSkillVersion.sourceSha256].filter(Boolean).join(' / ') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('Content size')}>
              {selectedSkillVersion.sourceSizeBytes ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('Uploaded at')}>
              {formatDateTime(selectedSkillVersion.sourceUploadedAt || undefined)}
            </Descriptions.Item>
            <Descriptions.Item label={t('Created at')}>
              {formatDateTime(selectedSkillVersion.createdAt || undefined)}
            </Descriptions.Item>
            <Descriptions.Item label={t('Updated at')}>
              {formatDateTime(selectedSkillVersion.updatedAt || undefined)}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Skill details unavailable')} />
        )}
      </Drawer>

      <Modal
        title={t('Upload skill')}
        open={skillUploadOpen}
        onCancel={closeSkillUploadModal}
        onOk={submitSkillUpload}
        confirmLoading={uploadSkillVersionRequest.loading}
        okText={t('Upload')}
        cancelText={t('Close')}
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Form<SkillUploadFormValues>
            form={skillUploadForm}
            layout="vertical"
            initialValues={DEFAULT_SKILL_UPLOAD_FORM_VALUES}
          >
            <Form.Item
              label={t('Skill key')}
              name="skillKey"
              rules={[{ required: true, message: t('Skill key is required') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label={t('Display name')} name="displayName">
              <Input />
            </Form.Item>
            <Form.Item
              label={t('Version label')}
              name="versionLabel"
              rules={[{ required: true, message: t('Version label is required') }]}
            >
              <Input placeholder="v1" />
            </Form.Item>
            <Form.Item label={t('Skill ZIP file')} required>
              <Upload
                accept=".zip,application/zip"
                beforeUpload={handleSkillZipBeforeUpload}
                maxCount={1}
                onRemove={handleSkillZipRemove}
              >
                <Button icon={<UploadOutlined />}>{t('Select ZIP')}</Button>
              </Upload>
            </Form.Item>
          </Form>

          {skillUploadResult ? (
            <Alert
              type="success"
              showIcon
              message={t('Skill uploaded')}
              description={
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Typography.Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ margin: 0 }}>
                    {skillUploadResult.skillVersionId}
                  </Typography.Paragraph>
                  <Typography.Text type="secondary">
                    {[skillUploadResult.skillKey, skillUploadResult.versionLabel, skillUploadResult.status]
                      .filter(Boolean)
                      .join(' / ')}
                  </Typography.Text>
                </Space>
              }
            />
          ) : null}
        </Space>
      </Modal>
    </section>
  );
}
