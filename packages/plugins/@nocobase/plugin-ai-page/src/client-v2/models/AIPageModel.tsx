/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CodeEditor, useApp } from '@nocobase/client-v2';
import { ElementProxy, FlowModel } from '@nocobase/flow-engine';
import {
  App as AntdApp,
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  List,
  Modal,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tExpr, useT } from '../locale';

type AIPageData = {
  pageSchemaUid: string;
  title?: string;
  draftCode: string;
  publishedCode: string;
  draftRevision: number;
  publishedRevision: number;
  codeVersion?: string;
};

type AIPageSource = {
  pageSchemaUid: string;
  code: string;
  revision: number;
  publishedRevision: number;
  version?: string;
};

type AIPageSession = {
  sessionId: string;
  pageSchemaUid: string;
  pairingCode: string;
  expiresAt: string;
};

type AIPageRevision = {
  id: string | number;
  revision: number;
  summary?: string;
  published?: boolean;
  createdAt?: string;
};

type AIPageEvent = {
  type: string;
  pageSchemaUid?: string;
  body?: Record<string, unknown>;
};

type RuntimeState = {
  status: 'idle' | 'running' | 'success' | 'error';
  error?: string;
};

type AIPageModelProps = {
  pageSchemaUid?: string;
};

function getResponseData<T>(response: unknown): T {
  const axiosResponse = response as { data?: T };
  return axiosResponse.data as T;
}

function buildAgentPrompt(apiBaseUrl: string, session: AIPageSession) {
  return `You are developing a NocoBase AI Page through its independent HTTP API.

Connection:
- API base URL: ${apiBaseUrl}
- Page UID: ${session.pageSchemaUid}
- Session ID: ${session.sessionId}
- One-time pairing code: ${session.pairingCode}
- OpenAPI: ${apiBaseUrl}/openapi.json

Rules:
1. Do not use the nb CLI or nb api command. Call the HTTP endpoints below directly.
2. Pair once with POST ${apiBaseUrl}/sessions/${session.sessionId}/pair and JSON {"pairingCode":"${session.pairingCode}"}.
3. Keep the returned aip_* bearer token only in memory. Send it as Authorization: Bearer <token>.
4. Read the current draft first with GET ${apiBaseUrl}/pages/${session.pageSchemaUid}/source.
5. Save with PUT to the same source URL using {"code":"...","baseRevision":<revision>,"summary":"..."}, or PATCH using {"patch":"<unified diff>","baseRevision":<revision>,"summary":"..."}.
6. If the server returns 409, read the source again and rebase your change. Never overwrite a newer revision blindly.
7. Validate with POST ${apiBaseUrl}/pages/${session.pageSchemaUid}/validate and request live preview with POST ${apiBaseUrl}/pages/${session.pageSchemaUid}/preview.
8. Listen for browser runtime feedback with GET ${apiBaseUrl}/sessions/${session.sessionId}/events using an SSE-capable HTTP client.
9. Do not publish. Publishing is a deliberate action performed by the user in the NocoBase page.
10. Page code runs in the NocoBase RunJS v2 context. Render with ctx.render(...), and access NocoBase collections through ctx.api.resource('collectionName').

Start by pairing, reading the source, and briefly describing the change you plan to make.`;
}

const AIPageView: React.FC<{ model: AIPageModel }> = ({ model }) => {
  const app = useApp();
  const { message } = AntdApp.useApp();
  const t = useT();
  const pageSchemaUid = String((model.props as AIPageModelProps).pageSchemaUid || model.parentId || '');
  const [page, setPage] = useState<AIPageData>();
  const [source, setSource] = useState<AIPageSource>();
  const [loading, setLoading] = useState(true);
  const [runtime, setRuntime] = useState<RuntimeState>({ status: 'idle' });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorCode, setEditorCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [session, setSession] = useState<AIPageSession>();
  const [agentConnected, setAgentConnected] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [revisions, setRevisions] = useState<AIPageRevision[]>([]);
  const [previewDraft, setPreviewDraft] = useState(false);
  const sessionRef = useRef<AIPageSession | undefined>(undefined);

  const apiBaseUrl = useMemo(() => app.getApiUrl('ai-page/v1'), [app]);
  const agentPrompt = useMemo(() => (session ? buildAgentPrompt(apiBaseUrl, session) : ''), [apiBaseUrl, session]);

  const request = useCallback(
    async <T,>(url: string, options?: { method?: string; data?: Record<string, unknown> }) => {
      const response = await app.apiClient.request({ url: `ai-page/v1${url}`, ...options });
      return getResponseData<T>(response);
    },
    [app],
  );

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const loadPage = useCallback(async () => {
    const data = await request<AIPageData>(`/pages/${encodeURIComponent(pageSchemaUid)}`);
    setPage(data);
    return data;
  }, [pageSchemaUid, request]);

  const loadSource = useCallback(async () => {
    const data = await request<AIPageSource>(`/pages/${encodeURIComponent(pageSchemaUid)}/source`);
    setSource(data);
    setEditorCode(data.code);
    return data;
  }, [pageSchemaUid, request]);

  const reportRuntimeResult = useCallback(
    async (result: Record<string, unknown>) => {
      const activeSession = sessionRef.current;
      if (!activeSession) {
        return;
      }
      await request(`/sessions/${encodeURIComponent(activeSession.sessionId)}/runtime-results`, {
        method: 'POST',
        data: result,
      });
    },
    [request],
  );

  const executeCode = useCallback(
    async (code: string, revision: number, version = 'v2') => {
      const element = model.context.ref.current;
      if (!element) {
        return;
      }
      setRuntime({ status: 'running' });
      try {
        if (!model.context.getPropertyOptions('element')) {
          model.context.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
        }
        await model.context.runjs(code, undefined, { version });
        setRuntime({ status: 'success' });
        await reportRuntimeResult({ status: 'success', revision });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setRuntime({ status: 'error', error: errorMessage });
        await reportRuntimeResult({ status: 'error', revision, message: errorMessage });
      }
    },
    [model, reportRuntimeResult],
  );

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        await loadPage();
      } catch (error) {
        if (active) {
          setRuntime({ status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    initialize().catch((error) => console.error(error));
    return () => {
      active = false;
    };
  }, [loadPage]);

  useEffect(() => {
    if (loading || !page) {
      return;
    }
    executeCode(page.publishedCode, page.publishedRevision, page.codeVersion || 'v2').catch((error) => {
      setRuntime({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    });
  }, [executeCode, loading, page]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const eventSource = new EventSource(`${apiBaseUrl}/sessions/${encodeURIComponent(session.sessionId)}/events`, {
      withCredentials: true,
    });
    const handleMessage = async (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as AIPageEvent;
      if (data.type === 'agent.connected') {
        setAgentConnected(true);
        return;
      }
      if (data.type === 'source.changed' || data.type === 'preview.requested') {
        const nextSource = await loadSource();
        setPreviewDraft(true);
        await executeCode(nextSource.code, nextSource.revision, nextSource.version || 'v2');
      }
      if (data.type === 'page.published') {
        await loadPage();
      }
    };
    eventSource.onmessage = (event) => {
      handleMessage(event).catch((error) => console.error(error));
    };
    eventSource.onerror = () => setAgentConnected(false);
    return () => eventSource.close();
  }, [apiBaseUrl, executeCode, loadPage, loadSource, session]);

  const openEditor = async () => {
    const data = await loadSource();
    setEditorCode(data.code);
    setEditorOpen(true);
  };

  const saveSource = async () => {
    if (!source) {
      return;
    }
    setSaving(true);
    try {
      const result = await request<{ revision: number }>(`/pages/${encodeURIComponent(pageSchemaUid)}/source`, {
        method: 'PUT',
        data: {
          code: editorCode,
          baseRevision: source.revision,
          summary: t('Edited in NocoBase'),
        },
      });
      const nextSource = { ...source, code: editorCode, revision: result.revision };
      setSource(nextSource);
      setPreviewDraft(true);
      await executeCode(nextSource.code, nextSource.revision, nextSource.version || 'v2');
      message.success(t('Draft saved'));
    } finally {
      setSaving(false);
    }
  };

  const openAgent = async () => {
    if (!session) {
      const nextSession = await request<AIPageSession>(`/pages/${encodeURIComponent(pageSchemaUid)}/sessions`, {
        method: 'POST',
      });
      setSession(nextSession);
      const nextSource = await loadSource();
      setPreviewDraft(true);
      await executeCode(nextSource.code, nextSource.revision, nextSource.version || 'v2');
    }
    setAgentOpen(true);
  };

  const disconnectAgent = async () => {
    if (!session) {
      return;
    }
    await request(`/sessions/${encodeURIComponent(session.sessionId)}`, { method: 'DELETE' });
    setSession(undefined);
    setAgentConnected(false);
    setAgentOpen(false);
    setPreviewDraft(false);
    const nextPage = await loadPage();
    await executeCode(nextPage.publishedCode, nextPage.publishedRevision, nextPage.codeVersion || 'v2');
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(agentPrompt);
    message.success(t('Agent prompt copied'));
  };

  const publish = async () => {
    const result = await request<{ revision: number }>(`/pages/${encodeURIComponent(pageSchemaUid)}/publish`, {
      method: 'POST',
    });
    await loadPage();
    message.success(t('Published revision {{revision}}', { revision: result.revision }));
  };

  const openVersions = async () => {
    const data = await request<AIPageRevision[]>(`/pages/${encodeURIComponent(pageSchemaUid)}/revisions`);
    setRevisions(data);
    setVersionsOpen(true);
  };

  const rollback = async (revision: number) => {
    await request(`/pages/${encodeURIComponent(pageSchemaUid)}/rollback`, {
      method: 'POST',
      data: { revision },
    });
    const nextSource = await loadSource();
    setPreviewDraft(true);
    await executeCode(nextSource.code, nextSource.revision, nextSource.version || 'v2');
    setVersionsOpen(false);
    message.success(t('Rolled back to revision {{revision}} as a new draft', { revision }));
  };

  if (loading) {
    return <Skeleton active style={{ padding: 24 }} />;
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff' }}>
      <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={12}
        style={{ minHeight: 48, padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}
      >
        <Space wrap>
          <Typography.Text strong>{page?.title || t('AI Page')}</Typography.Text>
          {previewDraft ? <Tag color="processing">{t('Draft preview')}</Tag> : <Tag>{t('Published')}</Tag>}
          {runtime.status === 'running' ? <Tag color="blue">{t('Running')}</Tag> : null}
          {session ? (
            <Tag color={agentConnected ? 'success' : 'warning'}>
              {agentConnected ? t('Agent connected') : t('Waiting for agent')}
            </Tag>
          ) : null}
        </Space>
        <Space wrap>
          <Button type="link" onClick={openAgent} aria-label={t('Open Agent connection')}>
            {t('Agent')}
          </Button>
          <Button onClick={openEditor}>{t('Edit code')}</Button>
          <Button onClick={openVersions}>{t('Versions')}</Button>
          <Button
            type="primary"
            onClick={publish}
            disabled={!previewDraft && page?.draftRevision === page?.publishedRevision}
          >
            {t('Publish')}
          </Button>
        </Space>
      </Flex>

      {runtime.status === 'error' ? (
        <Alert type="error" showIcon message={t('Page runtime error')} description={runtime.error} closable />
      ) : null}
      <div ref={model.context.ref} aria-label={t('AI Page runtime')} style={{ minHeight: 320 }} />

      <Drawer
        title={t('Edit AI Page code')}
        width="min(960px, 92vw)"
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        extra={
          <Button type="primary" loading={saving} onClick={saveSource}>
            {t('Save draft')}
          </Button>
        }
      >
        <CodeEditor
          value={editorCode}
          onChange={setEditorCode}
          minHeight="calc(100vh - 180px)"
          theme="light"
          enableLinter
          version="v2"
          name={`ai-page-${pageSchemaUid}.js`}
        />
      </Drawer>

      <Modal
        title={t('Connect an AI agent')}
        width={760}
        open={agentOpen}
        onCancel={() => setAgentOpen(false)}
        footer={
          <Space>
            {session ? (
              <Button danger onClick={disconnectAgent}>
                {t('Disconnect')}
              </Button>
            ) : null}
            <Button onClick={() => setAgentOpen(false)}>{t('Close')}</Button>
            <Button type="primary" onClick={copyPrompt} disabled={!agentPrompt}>
              {t('Copy prompt')}
            </Button>
          </Space>
        }
      >
        {session ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={t('The pairing code and token expire after 6 hours')}
              description={t(
                'Give this prompt to Codex or another coding agent. The token is created only after pairing and is never shown here.',
              )}
            />
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label={t('Session ID')}>{session.sessionId}</Descriptions.Item>
              <Descriptions.Item label={t('Pairing code')}>
                <Typography.Text copyable strong>
                  {session.pairingCode}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>
            <Typography.Paragraph copyable={{ text: agentPrompt }}>
              <pre
                style={{ maxHeight: 360, overflow: 'auto', whiteSpace: 'pre-wrap', padding: 12, background: '#f6f8fa' }}
              >
                {agentPrompt}
              </pre>
            </Typography.Paragraph>
          </Space>
        ) : (
          <Skeleton active />
        )}
      </Modal>

      <Modal
        title={t('Version history')}
        open={versionsOpen}
        onCancel={() => setVersionsOpen(false)}
        footer={<Button onClick={() => setVersionsOpen(false)}>{t('Close')}</Button>}
      >
        {revisions.length ? (
          <List
            dataSource={revisions}
            renderItem={(revision) => (
              <List.Item
                actions={[
                  <Button key="rollback" type="link" onClick={() => rollback(revision.revision)}>
                    {t('Use as new draft')}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{t('Revision {{revision}}', { revision: revision.revision })}</span>
                      {revision.published ? <Tag color="success">{t('Published')}</Tag> : null}
                    </Space>
                  }
                  description={revision.summary || revision.createdAt}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description={t('No revisions')} />
        )}
      </Modal>
    </div>
  );
};

export class AIPageModel extends FlowModel {
  render() {
    return <AIPageView model={this} />;
  }
}

AIPageModel.define({
  label: tExpr('AI Page'),
});

export default AIPageModel;
