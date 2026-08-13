/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExportOutlined } from '@ant-design/icons';
import type { RunJSStudioToolbarContext, RunJSStudioToolbarContribution } from '@nocobase/runjs/workspace/client-v2';
import { Button, Form, Input, Modal, Radio, Select, Tooltip, message } from 'antd';
import React from 'react';

import { JS_TEMPLATE_SUPPORTED_KINDS } from '../../constants';
import {
  createJsTemplateRuntimeSourceBinding,
  isJsTemplateRuntimeSourceBinding,
  serializeJsTemplateRunJSPersistence,
} from '../../shared/jsTemplateSourceBinding';
import type { JsTemplateKind, SaveAsJsTemplateOriginBinding, JsTemplateProject } from '../../shared/types';
import { type ApiClientLike, listJsTemplateProjects, saveAsJsTemplate } from '../api/jsTemplatesRequests';
import {
  JS_TEMPLATE_KIND_BY_MODEL_USE,
  JS_TEMPLATE_SOURCE_METADATA_KIND_KEY,
  JS_TEMPLATE_TOOLBAR_CONTRIBUTION_KEY,
} from '../jsTemplateRunJSIntegrationContract';
import { useT } from '../locale';

type SourceProjectDestinationType = 'existing' | 'new';

interface SaveAsJsTemplateFormValues {
  destinationType: SourceProjectDestinationType;
  projectId?: string;
  sourceProjectTitle?: string;
  templateTitle: string;
}

const DEFAULT_KIND_NAMES: Record<JsTemplateKind, string> = {
  'js-block': 'JS Block',
  'js-action': 'JS Action',
  'js-field': 'JS Field',
  'js-item': 'JS Item',
};

const KIND_NAME_LABELS: Record<JsTemplateKind, string> = {
  'js-block': 'JS Block name',
  'js-action': 'JS Action name',
  'js-field': 'JS Field name',
  'js-item': 'JS Item name',
};

export function createSaveAsJsTemplateContribution(api: ApiClientLike): RunJSStudioToolbarContribution {
  const Contribution: React.FC<{ context: RunJSStudioToolbarContext }> = ({ context }) => (
    <SaveAsJsTemplate api={api} context={context} />
  );

  return {
    key: JS_TEMPLATE_TOOLBAR_CONTRIBUTION_KEY,
    order: 50,
    isVisible: (context) =>
      !context.readOnly && context.workspace.permissions.canWrite && Boolean(resolveJsTemplateKind(context)),
    component: Contribution,
  };
}

export const SaveAsJsTemplate: React.FC<{
  api: ApiClientLike;
  context: RunJSStudioToolbarContext;
}> = ({ api, context }) => {
  const t = useT();
  const [form] = Form.useForm<SaveAsJsTemplateFormValues>();
  const [open, setOpen] = React.useState(false);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [projects, setProjects] = React.useState<JsTemplateProject[]>([]);
  const destinationType = Form.useWatch('destinationType', form) || 'existing';
  const kind = resolveJsTemplateKind(context);
  const templateNameLabel = kind ? t(KIND_NAME_LABELS[kind]) : '';

  const loadProjects = React.useCallback(async () => {
    setLoadingProjects(true);
    try {
      const items = await listJsTemplateProjects(api);
      setProjects(items.filter((project) => project.lifecycleStatus === 'enabled'));
      return items;
    } catch (error) {
      message.error(formatError(error, t('Failed to load projects')));
      return [];
    } finally {
      setLoadingProjects(false);
    }
  }, [api, t]);

  const showModal = async () => {
    if (!kind) {
      return;
    }
    const suggestedName = suggestDisplayName(context, kind);
    form.setFieldsValue({
      destinationType: 'existing',
      templateTitle: suggestedName,
      sourceProjectTitle: suggestedName,
    });
    setOpen(true);
    await loadProjects();
  };

  const submit = async () => {
    if (!kind) {
      return;
    }
    const values = await form.validateFields();
    const templateTitle = values.templateTitle.trim();
    const technicalNameSalt = `${context.workspace.ownerFingerprint}:${context.workspace.repository.repoId}`;
    const templateName = createTechnicalName(templateTitle, kind, technicalNameSalt);
    const destination =
      values.destinationType === 'existing'
        ? ({ type: 'existing', projectId: String(values.projectId || '') } as const)
        : ({
            type: 'new',
            name: createTechnicalName(String(values.sourceProjectTitle || ''), 'js-template', technicalNameSalt),
            title: values.sourceProjectTitle?.trim() || null,
          } as const);
    const saveInput = {
      locator: context.locator,
      expectedOwnerFingerprint: context.workspace.ownerFingerprint,
      sourceRepoId: context.workspace.repository.repoId,
      sourceHeadCommitId: context.workspace.repository.headCommitId || null,
      entryPath: context.entryPath,
      runtimeVersion: context.version,
      files: context.files.map((file) => ({ ...file })),
      originBinding: resolveOriginBinding(context.sourceBinding, kind),
      destination,
      templateName,
      templateTitle,
    };
    setSaving(true);
    try {
      const result = await saveAsJsTemplate(api, {
        ...saveInput,
        idempotencyKey: createSaveAsJsTemplateIdempotencyKey(saveInput),
      });
      setOpen(false);
      message.success(t('Saved as JS Template'));
      await context.onExternalBindingPersisted(serializeJsTemplateRunJSPersistence(result.binding));
    } catch (error) {
      message.error(formatError(error, t('Failed to save as JS Template')));
    } finally {
      setSaving(false);
    }
  };

  if (!kind) {
    return null;
  }

  return (
    <>
      <Tooltip title={t('Save as JS Template')}>
        <Button aria-label={t('Save as JS Template')} icon={<ExportOutlined />} onClick={showModal} size="small" />
      </Tooltip>
      <Modal
        destroyOnClose
        maskClosable={!saving}
        okButtonProps={{ loading: saving }}
        okText={t('Save')}
        onCancel={() => setOpen(false)}
        onOk={submit}
        open={open}
        title={t('Save as JS Template')}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label={t('Destination')} name="destinationType">
            <Radio.Group>
              <Radio value="existing">{t('Existing Source Project')}</Radio>
              <Radio value="new">{t('Create new Source Project')}</Radio>
            </Radio.Group>
          </Form.Item>
          {destinationType === 'existing' ? (
            <Form.Item
              label={t('Source Project')}
              name="projectId"
              rules={[{ required: true, message: t('Select a Source Project') }]}
            >
              <Select
                loading={loadingProjects}
                options={projects.map((project) => ({
                  label: project.title || project.name,
                  value: project.id,
                }))}
                placeholder={t('Select a Source Project')}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          ) : destinationType === 'new' ? (
            <Form.Item
              label={t('Source Project name')}
              name="sourceProjectTitle"
              rules={displayNameRules(t, t('Source Project name'))}
            >
              <Input autoComplete="off" />
            </Form.Item>
          ) : null}
          <Form.Item label={templateNameLabel} name="templateTitle" rules={displayNameRules(t, templateNameLabel)}>
            <Input autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

function resolveJsTemplateKind(context: RunJSStudioToolbarContext): JsTemplateKind | null {
  if (context.locator.kind !== 'flowModel.step') {
    return null;
  }
  const modelUse = context.workspace.source.metadata?.modelUse;
  const serverKind = typeof modelUse === 'string' ? JS_TEMPLATE_KIND_BY_MODEL_USE[modelUse] : undefined;
  if (serverKind) {
    return serverKind;
  }
  const declaredKind = context.sourceMetadata?.[JS_TEMPLATE_SOURCE_METADATA_KIND_KEY];
  if (isJsTemplateKind(declaredKind)) {
    return declaredKind;
  }
  return null;
}

function isJsTemplateKind(value: unknown): value is JsTemplateKind {
  return typeof value === 'string' && (JS_TEMPLATE_SUPPORTED_KINDS as readonly string[]).includes(value);
}

function resolveOriginBinding(value: unknown, kind: JsTemplateKind): SaveAsJsTemplateOriginBinding | undefined {
  if (!isJsTemplateRuntimeSourceBinding(value)) {
    return undefined;
  }
  if (value.kind !== kind) {
    return undefined;
  }
  return createJsTemplateRuntimeSourceBinding({
    projectId: value.projectId,
    templateId: value.templateId,
    kind,
  });
}

function suggestDisplayName(context: RunJSStudioToolbarContext, kind: JsTemplateKind): string {
  const label = context.workspace.source.label?.trim() || '';
  const candidate = label.split('/')[0]?.trim() || '';
  return candidate && !candidate.endsWith('Model') ? candidate : DEFAULT_KIND_NAMES[kind];
}

function createTechnicalName(displayName: string, fallbackPrefix: string, salt: string): string {
  const slug = displayName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
  if (slug) {
    return slug;
  }

  return `${fallbackPrefix}-${hashTechnicalName(`${displayName}:${salt}`)}`.slice(0, 63);
}

function hashTechnicalName(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createSaveAsJsTemplateIdempotencyKey(value: unknown): string {
  const serialized = JSON.stringify(sortObjectKeys(value));
  return `save-as-js-template-${hashStableValue(serialized, 2166136261)}-${hashStableValue(serialized, 3339675911)}`;
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => typeof entryValue !== 'undefined')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, sortObjectKeys(entryValue)]),
  );
}

function hashStableValue(value: string, seed: number): string {
  let hash = seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function displayNameRules(t: (key: string) => string, label: string) {
  return [
    { required: true, whitespace: true, message: t('Name is required') },
    { max: 120, message: `${label}: ${t('Too long')}` },
  ];
}

function formatError(error: unknown, fallback: string): string {
  const response = isRecord(error) ? (isRecord(error.response) ? error.response : null) : null;
  const data = response && isRecord(response.data) ? response.data : null;
  const errors = data && Array.isArray(data.errors) ? data.errors : [];
  const firstError = errors.length > 0 && isRecord(errors[0]) ? errors[0] : null;
  if (typeof firstError?.message === 'string' && firstError.message) {
    return firstError.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
