/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DeleteOutlined,
  ExperimentOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FolderAddOutlined,
  ReloadOutlined,
  SaveOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import { CodeEditor } from '@nocobase/client-v2';
import { Alert, Button, Empty, Flex, Form, Input, List, Modal, Space, Spin, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionDiagnostic,
  LightExtensionFileChange,
  LightExtensionPulledFile,
  LightExtensionRepoRecord,
} from '../../shared/types';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import { getLightExtensionErrorDiagnostics, useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import { settingsPath } from './LightExtensionListPage';

interface WorkspaceFile {
  path: string;
  content: string;
  language?: string;
}

interface NewFileFormValues {
  path: string;
  content?: string;
}

function NoEditorExtras() {
  return null;
}

function LightExtensionWorkspacePage() {
  const { t } = useTranslation(NAMESPACE);
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repoId') || '';
  const api = useLightExtensionRepo();
  const [newFileForm] = Form.useForm<NewFileFormValues>();
  const [repo, setRepo] = useState<LightExtensionRepoRecord | null>(null);
  const [baseCommitId, setBaseCommitId] = useState<string | null>(null);
  const [baseFiles, setBaseFiles] = useState<WorkspaceFile[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<LightExtensionDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(
    null,
  );

  const loadWorkspace = useCallback(async () => {
    if (!repoId) {
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const nextRepo = await api.getRepo(repoId);
      setRepo(nextRepo);
      if (nextRepo.lifecycleStatus === 'archived') {
        setBaseFiles([]);
        setFiles([]);
        setActivePath(null);
        setBaseCommitId(nextRepo.headCommitId);
        setNotice({ type: 'warning', message: t('Archived repositories are read-only') });
        return;
      }

      const pull = await api.pull({ repoId, includeContent: 'all' });
      const nextFiles = normalizeWorkspaceFiles(pull.files || []);
      setBaseCommitId(pull.commit?.id || null);
      setBaseFiles(nextFiles);
      setFiles(nextFiles);
      setActivePath((current) => resolveActivePath(nextFiles, current));
      setDiagnostics([]);
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load source') });
    } finally {
      setLoading(false);
    }
  }, [api, repoId, t]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const activeFile = files.find((file) => file.path === activePath) || null;
  const dirtyChanges = useMemo(() => buildFileChanges(baseFiles, files), [baseFiles, files]);
  const canWrite = Boolean(repo && repo.lifecycleStatus !== 'archived');

  const addTemplate = () => {
    const templateFiles = buildJsBlockTemplate(files);
    setFiles((current) => mergeFiles(current, templateFiles));
    setActivePath(templateFiles[0]?.path || activePath);
  };

  const createFile = async () => {
    const values = await newFileForm.validateFields();
    const path = values.path.trim();
    const nextFile = {
      path,
      content: values.content || '',
      language: languageFromPath(path),
    };
    setFiles((current) => mergeFiles(current, [nextFile]));
    setActivePath(path);
    setNewFileOpen(false);
    newFileForm.resetFields();
  };

  const updateActiveFile = (value: string) => {
    if (!activePath) {
      return;
    }

    setFiles((current) => current.map((file) => (file.path === activePath ? { ...file, content: value } : file)));
  };

  const removeFile = (path: string) => {
    setFiles((current) => {
      const nextFiles = current.filter((file) => file.path !== path);
      setActivePath(resolveActivePath(nextFiles, activePath === path ? null : activePath));
      return nextFiles;
    });
  };

  const saveChanges = async () => {
    if (!repoId || dirtyChanges.length === 0) {
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const result = await api.push({
        repoId,
        baseCommitId,
        message: t('Update light extension source'),
        files: dirtyChanges,
      });
      setBaseCommitId(result.commit.id);
      setBaseFiles(files);
      setNotice({ type: 'success', message: t('Source saved') });
      await loadWorkspace();
    } catch (error) {
      setDiagnostics(getLightExtensionErrorDiagnostics(error) as LightExtensionDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to save source') });
    } finally {
      setSaving(false);
    }
  };

  const scanEntries = async () => {
    if (!repoId) {
      return;
    }

    setScanning(true);
    setNotice(null);
    try {
      const result = await api.scanEntries(repoId);
      setDiagnostics(result.diagnostics);
      setNotice({
        type: result.accepted ? 'success' : 'warning',
        message: result.accepted ? t('Scan completed') : t('Scan completed with diagnostics'),
      });
      if (result.repo) {
        setRepo(result.repo);
      }
    } catch (error) {
      setDiagnostics(getLightExtensionErrorDiagnostics(error) as LightExtensionDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to scan entries') });
    } finally {
      setScanning(false);
    }
  };

  const compilePreview = async () => {
    if (!repoId) {
      return;
    }

    setPreviewing(true);
    setNotice(null);
    try {
      const result = await api.compilePreview({ repoId });
      const nextDiagnostics = [...result.diagnostics, ...result.entries.flatMap((entry) => entry.diagnostics || [])];
      setDiagnostics(nextDiagnostics);
      if (result.repo) {
        setRepo(result.repo);
      }
      setNotice({
        type: result.accepted ? 'success' : 'warning',
        message: result.accepted ? t('Compile preview completed') : t('Compile preview completed with diagnostics'),
      });
    } catch (error) {
      setDiagnostics(getLightExtensionErrorDiagnostics(error) as LightExtensionDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to compile preview') });
    } finally {
      setPreviewing(false);
    }
  };

  const openDiagnosticSource = useCallback(
    (diagnostic: LightExtensionDiagnostic) => {
      if (!diagnostic.path) {
        return;
      }
      if (!files.some((file) => file.path === diagnostic.path)) {
        setNotice({ type: 'warning', message: t('Diagnostic source is not loaded') });
        return;
      }

      setActivePath(diagnostic.path);
      setNotice({ type: 'info', message: t('Opened diagnostic source') });
    },
    [files, t],
  );

  if (!repoId) {
    return (
      <Flex vertical gap={16} style={{ padding: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('Source workspace')}
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
            {repo?.title || repo?.name || t('Source workspace')}
          </Typography.Title>
          <Typography.Text type="secondary">{repoId}</Typography.Text>
        </Space>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadWorkspace}>
            {t('Refresh')}
          </Button>
          <Button disabled={!canWrite} icon={<FolderAddOutlined />} onClick={addTemplate}>
            {t('Add JS Block template')}
          </Button>
          <Button disabled={!canWrite} icon={<FileAddOutlined />} onClick={() => setNewFileOpen(true)}>
            {t('New file')}
          </Button>
          <Button
            disabled={!canWrite || dirtyChanges.length === 0}
            icon={<SaveOutlined />}
            loading={saving}
            onClick={saveChanges}
            type="primary"
          >
            {t('Save')}
          </Button>
          <Button icon={<ScanOutlined />} loading={scanning} onClick={scanEntries}>
            {t('Scan')}
          </Button>
          <Button icon={<ExperimentOutlined />} loading={previewing} onClick={compilePreview}>
            {t('Compile preview')}
          </Button>
          <Button>
            <Link to={settingsPath.entries(repoId)}>{t('Entries')}</Link>
          </Button>
          <Button>
            <Link to={settingsPath.publications(repoId)}>{t('Publications')}</Link>
          </Button>
        </Space>
      </Flex>

      {notice ? (
        <Alert closable message={notice.message} onClose={() => setNotice(null)} showIcon type={notice.type} />
      ) : null}

      {loading ? (
        <div aria-live="polite" role="status" style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>{t('Loading source')}</Typography.Text>
        </div>
      ) : null}

      <Flex gap={16} style={{ alignItems: 'stretch', minHeight: 420 }}>
        <section aria-label={t('Files')} style={{ flex: '0 0 320px', minWidth: 260 }}>
          <Typography.Text strong>{t('Files')}</Typography.Text>
          {files.length === 0 ? (
            <Empty description={t('Empty repository')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : null}
          <List
            dataSource={files}
            rowKey="path"
            size="small"
            renderItem={(file) => (
              <List.Item
                actions={[
                  <Tooltip key="delete" title={t('Delete')}>
                    <Button
                      aria-label={t('Delete file')}
                      disabled={!canWrite}
                      icon={<DeleteOutlined />}
                      onClick={() => removeFile(file.path)}
                      size="small"
                      type="text"
                    />
                  </Tooltip>,
                ]}
                style={{ paddingInline: 0 }}
              >
                <Button
                  aria-pressed={activePath === file.path}
                  block
                  icon={<FileTextOutlined />}
                  onClick={() => setActivePath(file.path)}
                  style={{ justifyContent: 'flex-start' }}
                  type={activePath === file.path ? 'primary' : 'text'}
                >
                  {file.path}
                </Button>
              </List.Item>
            )}
          />
        </section>

        <section aria-label={t('Editor')} style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong>{t('Editor')}</Typography.Text>
          {!activeFile ? <Empty description={t('No open files')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null}
          {activeFile ? (
            <CodeEditor
              height={420}
              language={activeFile.language || languageFromPath(activeFile.path)}
              onChange={updateActiveFile}
              placeholder={t('Edit file content')}
              readonly={!canWrite}
              RightExtra={NoEditorExtras}
              showLogs={false}
              value={activeFile.content}
            />
          ) : null}
        </section>
      </Flex>

      <DiagnosticsPanel diagnostics={diagnostics} onOpenDiagnostic={openDiagnosticSource} />

      <Modal
        okText={t('Create')}
        onCancel={() => setNewFileOpen(false)}
        onOk={createFile}
        open={newFileOpen}
        title={t('New file')}
      >
        <Form form={newFileForm} layout="vertical">
          <Form.Item label={t('Path')} name="path" rules={[{ required: true, message: t('Path is required') }]}>
            <Input placeholder="src/client/js-blocks/sales-kpi/index.tsx" />
          </Form.Item>
          <Form.Item label={t('Content')} name="content">
            <Input.TextArea rows={8} />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}

function normalizeWorkspaceFiles(files: LightExtensionPulledFile[]): WorkspaceFile[] {
  return files
    .map((file) => ({
      path: file.path,
      content: file.content || '',
      language: file.language || languageFromPath(file.path),
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function resolveActivePath(files: WorkspaceFile[], current: string | null): string | null {
  if (current && files.some((file) => file.path === current)) {
    return current;
  }

  return files[0]?.path || null;
}

function mergeFiles(current: WorkspaceFile[], nextFiles: WorkspaceFile[]): WorkspaceFile[] {
  const byPath = new Map(current.map((file) => [file.path, file]));
  for (const file of nextFiles) {
    byPath.set(file.path, file);
  }

  return [...byPath.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function buildFileChanges(baseFiles: WorkspaceFile[], files: WorkspaceFile[]): LightExtensionFileChange[] {
  const baseByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const currentByPath = new Map(files.map((file) => [file.path, file]));
  const changes: LightExtensionFileChange[] = [];

  for (const file of files) {
    const baseFile = baseByPath.get(file.path);
    if (!baseFile || baseFile.content !== file.content) {
      changes.push({
        path: file.path,
        content: file.content,
        language: file.language || languageFromPath(file.path),
        operation: 'upsert',
      });
    }
  }

  for (const file of baseFiles) {
    if (!currentByPath.has(file.path)) {
      changes.push({
        path: file.path,
        operation: 'delete',
      });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

function buildJsBlockTemplate(files: WorkspaceFile[]): WorkspaceFile[] {
  const existing = new Set(files.map((file) => file.path));
  const entryName = nextEntryName(existing);
  const root = `src/client/js-blocks/${entryName}`;

  return [
    {
      path: `${root}/index.tsx`,
      content: 'export default function SalesKpiBlock() {\n  return null;\n}\n',
      language: 'typescript',
    },
    {
      path: `${root}/meta.json`,
      content:
        '{\n  "title": "Sales KPI",\n  "description": "Sales KPI block",\n  "category": "sales",\n  "tags": ["sales", "kpi"],\n  "sort": 10\n}\n',
      language: 'json',
    },
    {
      path: `${root}/settings.json`,
      content:
        '{\n  "type": "object",\n  "properties": {\n    "region": {\n      "type": "string",\n      "title": "Region",\n      "x-component": "Input"\n    }\n  }\n}\n',
      language: 'json',
    },
  ];
}

function nextEntryName(existing: Set<string>): string {
  let index = 1;
  let name = 'sales-kpi';
  while (existing.has(`src/client/js-blocks/${name}/index.tsx`)) {
    index += 1;
    name = `sales-kpi-${index}`;
  }

  return name;
}

function languageFromPath(path: string): string {
  if (path.endsWith('.tsx') || path.endsWith('.ts')) {
    return 'typescript';
  }
  if (path.endsWith('.jsx') || path.endsWith('.js')) {
    return 'javascript';
  }
  if (path.endsWith('.json')) {
    return 'json';
  }
  if (path.endsWith('.md')) {
    return 'markdown';
  }

  return 'text';
}

export default LightExtensionWorkspacePage;
