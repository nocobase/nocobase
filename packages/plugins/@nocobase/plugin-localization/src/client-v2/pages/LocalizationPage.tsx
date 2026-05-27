/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ReloadOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Schema } from '@formily/react';
import { languageCodes } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import { AIEmployeeShortcut, formatModelLabel } from '@nocobase/plugin-ai/client-v2';
import type { AIEmployee, Task } from '@nocobase/plugin-ai/client-v2';
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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LOCALIZATION_RESOURCE,
  LOCALIZATION_TEXTS_RESOURCE,
  LOCALIZATION_TRANSLATIONS_RESOURCE,
} from '../common/constants';
import { useT } from '../locale';

const { Text } = Typography;

const editableRowClassName = css`
  .editable-cell {
    position: relative;
  }

  .editable-cell-value-wrap {
    min-height: 32px;
    padding: 5px 12px;
    cursor: pointer;
  }

  &:hover .editable-cell-value-wrap {
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    padding: 4px 11px;
  }

  [data-theme='dark'] &:hover .editable-cell-value-wrap {
    border: 1px solid #434343;
  }
`;

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
type TranslationScope = 'all' | 'builtIn' | 'custom';

type LocalizationTask = Task & {
  mode: TranslationMode;
  description?: string;
};

type ReferenceLocales = {
  builtIn: {
    primary: string;
    fallback: string;
  };
  custom: {
    primary: string;
    fallback: string;
  };
};

type TranslationTaskValues = {
  mode: TranslationMode;
  scope: TranslationScope;
  locale: string;
  employeeUsername: string;
  referenceLocales: ReferenceLocales;
  textIds?: React.Key[];
};

function TranslationTaskConfirmContent(props: {
  api: any;
  t: (key: string) => string;
  task: LocalizationTask;
  values: TranslationTaskValues;
  languageOptions: { value: string; label: string }[];
  onChange: (values: Partial<TranslationTaskValues>) => void;
  onPreviewChange: (previewState: { count: number; loading: boolean }) => void;
}) {
  const { api, t, task, values, languageOptions, onChange, onPreviewChange } = props;
  const [scope, setScope] = useState<TranslationScope>(values.scope || 'all');
  const [referenceLocales, setReferenceLocales] = useState<ReferenceLocales>(values.referenceLocales);
  const [preview, setPreview] = useState<any>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const isSelectedMode = task.mode === 'selected';
  const scopeOptions = useMemo(
    () => [
      { label: t('All'), value: 'all' },
      { label: t('Built-in entries'), value: 'builtIn' },
      { label: t('Custom entries'), value: 'custom' },
    ],
    [t],
  );
  const showBuiltInReferences = !isSelectedMode && scope !== 'custom';
  const showCustomReferences = !isSelectedMode && scope !== 'builtIn';
  const fieldLabel = (label: string) => <span style={{ fontWeight: 400 }}>{label}</span>;

  useEffect(() => {
    onChange({
      scope,
      referenceLocales,
    });
  }, [onChange, referenceLocales, scope]);

  useEffect(() => {
    let canceled = false;
    const previewValues = {
      ...values,
      scope,
    };
    setPreviewLoading(true);
    onPreviewChange({ count: 0, loading: true });
    void api
      .resource(LOCALIZATION_RESOURCE)
      .aiTranslatePreview({ values: previewValues })
      .then((response) => {
        if (canceled) {
          return;
        }
        const nextPreview = response?.data?.data || response?.data;
        setPreview(nextPreview);
        onPreviewChange({ count: nextPreview?.count ?? 0, loading: false });
      })
      .catch((error) => {
        if (canceled) {
          return;
        }
        message.error(error?.message || t('Failed to create async task'));
      })
      .finally(() => {
        if (!canceled) {
          setPreviewLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
  }, [api, onPreviewChange, scope, t, values]);

  const providerLabel = preview?.providerTitle ? Schema.compile(preview.providerTitle, { t }) : preview?.provider;
  const modelLabel = preview?.model ? formatModelLabel(preview.model) : undefined;

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Typography.Paragraph style={{ marginBottom: 0 }}>{task.description}</Typography.Paragraph>
      {!isSelectedMode ? (
        <div>
          <Text strong>{t('Translation scope')}</Text>
          <div style={{ marginTop: 8 }}>
            <Radio.Group value={scope} options={scopeOptions} onChange={(event) => setScope(event.target.value)} />
          </div>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            {t(
              'Built-in entries are system and plugin entries. Custom entries include route names, collection and field names, and UI content.',
            )}
          </Typography.Paragraph>
        </div>
      ) : null}
      <div>
        <Text strong>{t('Entries to translate')}</Text>: {previewLoading ? t('Loading...') : preview?.count ?? 0}
      </div>
      <div>
        <Text strong>{t('Provider')}</Text>: {providerLabel || '-'}
      </div>
      <div>
        <Text strong>{t('Model')}</Text>: {modelLabel || '-'}
      </div>
      <Form
        layout="vertical"
        initialValues={{
          referenceLocales: isSelectedMode
            ? { ...referenceLocales, common: referenceLocales.custom }
            : referenceLocales,
        }}
        onValuesChange={(_, allValues) => {
          const nextReferenceLocales = allValues.referenceLocales;
          if (isSelectedMode && nextReferenceLocales?.common) {
            setReferenceLocales({
              builtIn: nextReferenceLocales.common,
              custom: nextReferenceLocales.common,
            });
          } else {
            const { common, ...nextLocales } = nextReferenceLocales || {};
            setReferenceLocales(nextLocales as ReferenceLocales);
          }
        }}
      >
        {isSelectedMode ? (
          <div>
            <Text strong>{t('Reference translation')}</Text>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name={['referenceLocales', 'common', 'primary']} label={fieldLabel(t('Default language'))}>
                  <Select showSearch optionFilterProp="label" options={languageOptions} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['referenceLocales', 'common', 'fallback']} label={fieldLabel(t('Fallback language'))}>
                  <Select showSearch optionFilterProp="label" options={languageOptions} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        ) : null}
        {showBuiltInReferences ? (
          <div>
            <Text strong>{t('Built-in entries reference translation')}</Text>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name={['referenceLocales', 'builtIn', 'primary']} label={fieldLabel(t('Default language'))}>
                  <Select showSearch optionFilterProp="label" options={languageOptions} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['referenceLocales', 'builtIn', 'fallback']}
                  label={fieldLabel(t('Fallback language'))}
                >
                  <Select showSearch optionFilterProp="label" options={languageOptions} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        ) : null}
        {showCustomReferences ? (
          <div>
            <Text strong>{t('Custom entries reference translation')}</Text>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name={['referenceLocales', 'custom', 'primary']} label={fieldLabel(t('Default language'))}>
                  <Select showSearch optionFilterProp="label" options={languageOptions} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['referenceLocales', 'custom', 'fallback']} label={fieldLabel(t('Fallback language'))}>
                  <Select showSearch optionFilterProp="label" options={languageOptions} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        ) : null}
      </Form>
    </Space>
  );
}

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

const TranslationField: React.FC<{
  value?: string;
  record: LocalizationText;
  onSave: (record: LocalizationText, translation: string) => Promise<void>;
}> = ({ value, record, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<any>(null);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus?.();
    }
  }, [editing]);

  const toggleEdit = () => {
    skipSaveRef.current = false;
    setDraft(value || '');
    setEditing(true);
  };

  const cancel = () => {
    skipSaveRef.current = true;
    setDraft(value || '');
    setEditing(false);
  };

  const save = async () => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    if (draft === (value || '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(record, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        disabled={saving}
        onBlur={save}
        onChange={(event) => setDraft(event.target.value)}
        onPressEnter={(event) => event.currentTarget.blur()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            cancel();
          }
        }}
      />
    );
  }

  return (
    <div className="editable-cell">
      <div className="editable-cell-value-wrap" onClick={toggleEdit}>
        {value}
      </div>
    </div>
  );
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
    await saveTranslation(editingRecord, values.translation);
    setEditingRecord(null);
  };

  const saveTranslation = async (record: LocalizationText, translation: string) => {
    try {
      await api.resource(LOCALIZATION_TRANSLATIONS_RESOURCE).updateOrCreate({
        filterKeys: ['textId', 'locale'],
        values: {
          textId: record.id,
          locale: currentLocale,
          translation,
        },
      });
      refresh();
    } catch (error) {
      message.error(error?.message || t('Failed to save translation'));
    }
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
      render: (value, record) => <TranslationField value={value} record={record} onSave={saveTranslation} />,
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
          rowClassName={editableRowClassName}
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
  const ctx = useFlowContext<any>();
  const t = useT();
  const api = ctx.app.apiClient;
  const currentLocale = api.auth.getLocale?.() || api.auth.locale || 'en-US';
  const systemDefaultLocale = ctx.systemSettings?.data?.data?.enabledLanguages?.[0];
  const [loadingTaskTitle, setLoadingTaskTitle] = useState<string | undefined>();
  const lina: AIEmployee = {
    username: 'lina',
  };
  const languageOptions = useMemo(
    () =>
      Object.entries(languageCodes).map(([value, item]) => ({
        value,
        label: item.label || value,
      })),
    [],
  );

  const defaultReferenceLocales = useMemo(
    () => ({
      builtIn: {
        primary: 'zh-CN',
        fallback: 'ja-JP',
      },
      custom: {
        primary: systemDefaultLocale || 'en-US',
        fallback: 'zh-CN',
      },
    }),
    [systemDefaultLocale],
  );

  const createTask = async (task: LocalizationTask) => {
    const { mode } = task;
    if (mode === 'selected' && !selectedRowKeys.length) {
      message.error(t('Please select the records you want to translate'));
      return;
    }
    setLoadingTaskTitle(task.title as string);
    try {
      const systemSettings = await ctx.systemSettings?.load?.();
      const systemDefaultLocale = systemSettings?.data?.enabledLanguages?.[0] || defaultReferenceLocales.custom.primary;
      const referenceLocales = {
        ...defaultReferenceLocales,
        custom: {
          ...defaultReferenceLocales.custom,
          primary: systemDefaultLocale,
        },
      };
      const values = {
        mode,
        scope: 'all' as TranslationScope,
        locale: currentLocale,
        employeeUsername: 'lina',
        referenceLocales,
        textIds: mode === 'selected' ? selectedRowKeys : undefined,
      };
      const previewState = {
        count: 0,
        loading: true,
      };
      const confirmed = await new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: task.title,
          width: 640,
          content: (
            <TranslationTaskConfirmContent
              api={api}
              t={t}
              task={task}
              values={values}
              languageOptions={languageOptions}
              onChange={(nextValues) => {
                Object.assign(values, nextValues);
              }}
              onPreviewChange={(nextPreviewState) => {
                Object.assign(previewState, nextPreviewState);
              }}
            />
          ),
          okText: t('Confirm'),
          cancelText: t('Cancel'),
          onOk: () => {
            if (previewState.loading) {
              message.warning(t('Please wait for the translation preview to load'));
              return Promise.reject();
            }
            if (previewState.count <= 0) {
              message.warning(t('No entries to translate'));
              return Promise.reject();
            }
            resolve(true);
          },
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
      setLoadingTaskTitle(undefined);
    }
  };

  const tasks: LocalizationTask[] = [
    {
      mode: 'incremental',
      title: t('Incremental translation'),
      description: t('Translate entries that do not yet have a translation in the current language.'),
    },
    {
      mode: 'selected',
      title: t('Selected translation'),
      description: t('Translate only the selected entries in the table.'),
    },
    {
      mode: 'full',
      title: t('Full translation'),
      description: t('Translate all entries in the current language, including existing translations.'),
    },
  ];

  return (
    <AIEmployeeShortcut
      aiEmployee={lina}
      tasks={tasks}
      size={32}
      mask={false}
      onTaskClick={(task) => createTask(task as LocalizationTask)}
      loadingTaskTitle={loadingTaskTitle}
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
