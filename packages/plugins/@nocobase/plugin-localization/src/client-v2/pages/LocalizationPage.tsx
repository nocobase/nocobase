/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons';
import { Schema } from '@formily/react';
import { languageCodes } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { AIEmployeeShortcut, type AIEmployee, type Task } from '@nocobase/plugin-ai/client-v2';
import { useRequest } from 'ahooks';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Popover,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import {
  LOCALIZATION_RESOURCE,
  LOCALIZATION_TEXTS_RESOURCE,
  LOCALIZATION_TRANSLATIONS_RESOURCE,
} from '../common/constants';
import { useT } from '../locale';

const { Text } = Typography;

type LocalizationText = {
  id: number | string;
  text: string;
  translation?: string;
  translationId?: number | string;
  module?: string;
  moduleTitle?: string;
};

type ModuleOption = {
  value: string;
  label: string;
};

type SourceOption = {
  name: string;
  title: string;
};

type TranslationMode = 'full' | 'incremental' | 'selected';

type LocalizationTask = Task & {
  mode: TranslationMode;
};

type ListParams = {
  page: number;
  pageSize: number;
  module?: string;
  keyword?: string;
  hasTranslation?: boolean;
};

function normalizeListResponse(response: any) {
  const payload = response?.data;

  return {
    rows: payload?.data || [],
    modules: payload?.meta?.modules || [],
    count: payload?.meta?.count || 0,
    page: payload?.meta?.page,
    pageSize: payload?.meta?.pageSize,
  };
}

function compileLabel(label: string, t: (key: string) => string) {
  return Schema.compile(label, { t });
}

const TranslationField: React.FC<{ value?: string }> = ({ value }) => {
  if (value === undefined || value === null) {
    return null;
  }
  return <span>{value}</span>;
};

export default function LocalizationPage() {
  return <LocalizationPageContent />;
}

export function LocalizationPageContent() {
  const ctx = useFlowContext();
  const t = useT();
  const api = ctx.app.apiClient;
  const currentLocale = api.auth.getLocale?.() || api.auth.locale || 'en-US';
  const [form] = Form.useForm();
  const [params, setParams] = useState<ListParams>({ page: 1, pageSize: 50, hasTranslation: true });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [editingRecord, setEditingRecord] = useState<LocalizationText | null>(null);
  const localeLabel = languageCodes[currentLocale]?.label || currentLocale;

  const {
    data: listData,
    loading,
    refresh,
  } = useRequest(
    async () => {
      const response = await api.resource(LOCALIZATION_TEXTS_RESOURCE).list({
        ...params,
        hasTranslation: String(params.hasTranslation),
      });
      return normalizeListResponse(response);
    },
    {
      refreshDeps: [params],
    },
  );

  const { data: sources = [], loading: sourcesLoading } = useRequest(async (): Promise<SourceOption[]> => {
    const response = await api.resource(LOCALIZATION_RESOURCE).getSources();
    return response?.data?.data || [];
  });

  const rows: LocalizationText[] = listData?.rows || [];
  const modules: ModuleOption[] = useMemo(
    () =>
      (listData?.modules || []).map((module: ModuleOption) => ({
        value: module.value,
        label: compileLabel(module.label, t),
      })),
    [listData?.modules, t],
  );

  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue({
        translation: editingRecord.translation,
      });
    } else {
      form.resetFields();
    }
  }, [editingRecord, form]);

  const updateFilter = (values: Partial<ListParams>) => {
    setParams((previous) => ({ ...previous, ...values, page: 1 }));
  };

  const updateTranslation = async () => {
    const values = await form.validateFields();
    if (!editingRecord) {
      return;
    }
    await api.resource(LOCALIZATION_TRANSLATIONS_RESOURCE).updateOrCreate({
      filterKeys: ['textId', 'locale'],
      values: {
        textId: editingRecord.id,
        locale: currentLocale,
        translation: values.translation,
      },
    });
    setEditingRecord(null);
    refresh();
  };

  const destroyTranslation = async (record: LocalizationText) => {
    if (!record.translationId) {
      return;
    }
    await api.resource(LOCALIZATION_TRANSLATIONS_RESOURCE).destroy({ filterByTk: record.translationId });
    refresh();
  };

  const bulkDestroyTranslations = async () => {
    const selectedKeySet = new Set(selectedRowKeys.map((key) => String(key)));
    const translationIds = rows
      .filter((row) => selectedKeySet.has(String(row.id)))
      .map((row) => row.translationId)
      .filter(Boolean);

    if (!translationIds.length) {
      message.error(t('Please select the records you want to delete'));
      return;
    }

    await api.resource(LOCALIZATION_TRANSLATIONS_RESOURCE).destroy({ filterByTk: translationIds });
    setSelectedRowKeys([]);
    refresh();
  };

  const publish = async () => {
    await api.resource(LOCALIZATION_RESOURCE).publish();
    window.location.reload();
  };

  const columns: ColumnsType<LocalizationText> = [
    {
      title: t('Text'),
      dataIndex: 'text',
      ellipsis: true,
    },
    {
      title: t('Translation'),
      dataIndex: 'translation',
      ellipsis: true,
      render: (value) => <TranslationField value={value} />,
    },
    {
      title: t('Module'),
      dataIndex: 'moduleTitle',
      width: 220,
      render: (_, record) => {
        if (!record.moduleTitle) {
          return <Tag>{record.module}</Tag>;
        }
        return <Tag>{compileLabel(record.moduleTitle, t)}</Tag>;
      },
    },
    {
      title: t('Actions'),
      key: 'actions',
      width: 240,
      render: (_, record) => (
        <Space split={<Divider type="vertical" />} style={{ whiteSpace: 'nowrap' }}>
          <Button type="link" size="small" onClick={() => setEditingRecord(record)}>
            {t('Edit')}
          </Button>
          {record.translationId ? (
            <Popconfirm
              title={t('Delete translation')}
              description={t('Are you sure you want to delete it?')}
              onConfirm={() => destroyTranslation(record)}
            >
              <Button type="link" size="small">
                {t('Delete translation')}
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  const pagination: TablePaginationConfig = {
    current: listData?.page || params.page,
    pageSize: listData?.pageSize || params.pageSize,
    total: listData?.count || 0,
    showSizeChanger: true,
    onChange: (page, pageSize) => setParams((previous) => ({ ...previous, page, pageSize })),
  };

  return (
    <Card bordered={false}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col flex="auto">
            <Space wrap align="center">
              <Typography>
                <Text strong>{t('Current language')}</Text>
                <Tag style={{ marginLeft: 10 }}>{localeLabel}</Tag>
              </Typography>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder={t('Module')}
                style={{ minWidth: 220 }}
                options={modules}
                onChange={(module) => updateFilter({ module })}
              />
              <Input.Search
                allowClear
                placeholder={t('Keyword')}
                style={{ width: 220 }}
                onSearch={(keyword) => updateFilter({ keyword })}
              />
              <Radio.Group
                optionType="button"
                value={params.hasTranslation}
                onChange={(event) => updateFilter({ hasTranslation: event.target.value })}
                options={[
                  { label: t('All'), value: true },
                  { label: t('No translation'), value: false },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Space wrap align="center">
              <Popconfirm
                title={t('Delete translation')}
                description={t('Are you sure you want to delete it?')}
                onConfirm={bulkDestroyTranslations}
              >
                <Button danger disabled={!selectedRowKeys.length}>
                  {t('Delete translation')}
                </Button>
              </Popconfirm>
              <Button icon={<ReloadOutlined />} loading={loading} onClick={refresh}>
                {t('Refresh')}
              </Button>
              <SyncResources sources={sources} loading={sourcesLoading} refresh={refresh} />
              <Button type="primary" icon={<UploadOutlined />} onClick={publish}>
                {t('Publish')}
              </Button>
              <LinaEmployee selectedRowKeys={selectedRowKeys} />
            </Space>
          </Col>
        </Row>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={pagination}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
        />
      </Space>
      <Drawer
        title={t('Edit')}
        open={Boolean(editingRecord)}
        width={720}
        onClose={() => setEditingRecord(null)}
        footer={
          <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setEditingRecord(null)}>{t('Cancel')}</Button>
            <Button type="primary" onClick={updateTranslation}>
              {t('Submit')}
            </Button>
          </Space>
        }
      >
        {editingRecord ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text strong>{t('Module')}</Text>
              <div style={{ marginTop: 8 }}>
                {editingRecord.moduleTitle ? (
                  <Tag>{compileLabel(editingRecord.moduleTitle, t)}</Tag>
                ) : (
                  <Tag>{editingRecord.module}</Tag>
                )}
              </div>
            </div>
            <div>
              <Text strong>{t('Text')}</Text>
              <Typography.Paragraph style={{ marginTop: 8 }}>{editingRecord.text}</Typography.Paragraph>
            </div>
            <Form form={form} layout="vertical">
              <Form.Item
                name="translation"
                label={<Text strong>{t('Translation')}</Text>}
                rules={[{ required: true, message: t('Translation') }]}
              >
                <Input.TextArea autoSize={{ minRows: 4 }} />
              </Form.Item>
            </Form>
          </Space>
        ) : null}
      </Drawer>
    </Card>
  );
}

function LinaEmployee(props: { selectedRowKeys: React.Key[] }) {
  const { selectedRowKeys } = props;
  const ctx = useFlowContext();
  const t = useT();
  const api = ctx.app.apiClient;
  const currentLocale = api.auth.getLocale?.() || api.auth.locale || 'en-US';
  const [loadingMode, setLoadingMode] = useState<TranslationMode | null>(null);
  const lina: AIEmployee = {
    username: 'lina',
  };

  const createTask = async (mode: TranslationMode) => {
    if (mode === 'selected' && !selectedRowKeys.length) {
      message.error(t('Please select the records you want to translate'));
      return;
    }
    setLoadingMode(mode);
    try {
      const values = {
        mode,
        locale: currentLocale,
        employeeUsername: 'lina',
        textIds: mode === 'selected' ? selectedRowKeys : undefined,
      };
      const previewResponse = await api.resource(LOCALIZATION_RESOURCE).aiTranslatePreview({
        values,
      });
      const preview = previewResponse?.data?.data || previewResponse?.data;
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: t('Confirm translation task'),
          content: (
            <Space direction="vertical" size={8}>
              <div>
                {t('Entries to translate')}: {preview?.count ?? 0}
              </div>
              <div>
                {t('Provider')}: {preview?.providerTitle || preview?.provider || '-'}
              </div>
              <div>
                {t('Model')}: {preview?.model || '-'}
              </div>
            </Space>
          ),
          okText: t('Confirm'),
          cancelText: t('Cancel'),
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!confirmed) {
        return;
      }
      await api.resource(LOCALIZATION_RESOURCE).aiTranslate({
        values,
      });
      message.success(t('Async task created'));
    } catch (error) {
      message.error(error?.message || t('Failed to create async task'));
    } finally {
      setLoadingMode(null);
    }
  };

  const tasks: LocalizationTask[] = [
    { mode: 'incremental', title: t('Incremental translation') },
    { mode: 'selected', title: t('Selected translation') },
    { mode: 'full', title: t('Full translation') },
  ];

  return (
    <AIEmployeeShortcut
      aiEmployee={lina}
      tasks={tasks}
      size={32}
      mask={false}
      onTaskClick={(task) => createTask((task as LocalizationTask).mode)}
      loadingTaskTitle={tasks.find((task) => task.mode === loadingMode)?.title}
      taskLoadingTitle={t('Creating...')}
    />
  );
}

function SyncResources(props: { sources: SourceOption[]; loading?: boolean; refresh: () => void | Promise<void> }) {
  const { sources, loading, refresh } = props;
  const ctx = useFlowContext();
  const t = useT();
  const api = ctx.app.apiClient;
  const [checkedList, setCheckedList] = useState<string[]>([]);
  const [resetTranslations, setResetTranslations] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const sourceNames = useMemo(() => sources.map((item) => item.name), [sources]);

  useEffect(() => {
    setCheckedList(sourceNames);
  }, [sourceNames]);

  const indeterminate = checkedList.length > 0 && checkedList.length < sourceNames.length;
  const checkAll = sourceNames.length > 0 && checkedList.length === sourceNames.length;
  const onChange = (list: any[]) => {
    setCheckedList(list);
  };

  const onCheckAllChange = (event: any) => {
    setCheckedList(event.target.checked ? sourceNames : []);
  };

  if (loading) {
    return null;
  }

  const content = (
    <>
      <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
        {t('All')}
      </Checkbox>
      <Divider style={{ margin: '5px 0' }} />
      <Checkbox.Group onChange={onChange} value={checkedList}>
        <div>
          {sources.map((item) => (
            <div key={item.name}>
              <Checkbox value={item.name}>{compileLabel(item.title, t)}</Checkbox>
            </div>
          ))}
        </div>
      </Checkbox.Group>
      <Divider style={{ margin: '5px 0' }} />
      <Checkbox checked={resetTranslations} onChange={(event) => setResetTranslations(event.target.checked)}>
        {t('Reset built-in translations')}
      </Checkbox>
    </>
  );

  return (
    <Popover placement="bottomRight" content={content}>
      <Button
        icon={<SyncOutlined />}
        loading={syncing}
        onClick={async () => {
          if (!checkedList.length) {
            return message.error(t('Please select the resources you want to synchronize'));
          }
          setSyncing(true);
          try {
            await api.resource(LOCALIZATION_RESOURCE).sync({
              values: {
                types: checkedList,
                resetTranslations,
              },
            });
            refresh();
          } finally {
            setSyncing(false);
          }
        }}
      >
        {t('Sync')}
      </Button>
    </Popover>
  );
}
