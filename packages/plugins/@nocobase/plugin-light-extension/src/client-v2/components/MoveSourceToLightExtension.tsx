/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExportOutlined } from '@ant-design/icons';
import type { RunJSStudioToolbarContext, RunJSStudioToolbarContribution } from '@nocobase/plugin-vsc-file/client-v2';
import { Button, Form, Input, Modal, Radio, Select, Tooltip, message } from 'antd';
import React from 'react';

import type { LightExtensionKind, LightExtensionRepoRecord } from '../../shared/types';
import {
  type ApiClientLike,
  listLightExtensionRepos,
  moveSourceToLightExtension,
} from '../api/lightExtensionEntriesRequests';
import { useT } from '../locale';

type MoveDestinationType = 'existing' | 'new';

interface MoveSourceFormValues {
  destinationType: MoveDestinationType;
  repoId?: string;
  repoTitle?: string;
  entryTitle: string;
}

const DEFAULT_KIND_NAMES: Record<LightExtensionKind, string> = {
  'js-block': 'JS Block',
  'js-action': 'JS Action',
  'js-field': 'JS Field',
  'js-item': 'JS Item',
};

const KIND_NAME_LABELS: Record<LightExtensionKind, string> = {
  'js-block': 'JS Block name',
  'js-action': 'JS Action name',
  'js-field': 'JS Field name',
  'js-item': 'JS Item name',
};

const MODEL_USE_KIND = new Map<string, LightExtensionKind>([
  ['JSBlockModel', 'js-block'],
  ['JSFieldModel', 'js-field'],
  ['JSEditableFieldModel', 'js-field'],
  ['JSColumnModel', 'js-field'],
  ['JSActionModel', 'js-action'],
  ['JSRecordActionModel', 'js-action'],
  ['JSCollectionActionModel', 'js-action'],
  ['JSFormActionModel', 'js-action'],
  ['FilterFormJSActionModel', 'js-action'],
  ['JSItemModel', 'js-item'],
  ['JSItemActionModel', 'js-item'],
]);

export function createMoveSourceToLightExtensionContribution(api: ApiClientLike): RunJSStudioToolbarContribution {
  const Contribution: React.FC<{ context: RunJSStudioToolbarContext }> = ({ context }) => (
    <MoveSourceToLightExtension api={api} context={context} />
  );

  return {
    key: '@nocobase/plugin-light-extension/move-source',
    order: 50,
    isVisible: (context) => !context.readOnly && Boolean(resolveLightExtensionKind(context)),
    component: Contribution,
  };
}

export const MoveSourceToLightExtension: React.FC<{
  api: ApiClientLike;
  context: RunJSStudioToolbarContext;
}> = ({ api, context }) => {
  const t = useT();
  const [form] = Form.useForm<MoveSourceFormValues>();
  const [open, setOpen] = React.useState(false);
  const [loadingRepos, setLoadingRepos] = React.useState(false);
  const [moving, setMoving] = React.useState(false);
  const [repos, setRepos] = React.useState<LightExtensionRepoRecord[]>([]);
  const destinationType = Form.useWatch('destinationType', form) || 'existing';
  const kind = resolveLightExtensionKind(context);
  const entryNameLabel = kind ? t(KIND_NAME_LABELS[kind]) : '';

  const loadRepos = React.useCallback(async () => {
    setLoadingRepos(true);
    try {
      const items = await listLightExtensionRepos(api);
      setRepos(items.filter((repo) => repo.lifecycleStatus !== 'archived'));
      return items;
    } catch (error) {
      message.error(formatError(error, t('Failed to load repositories')));
      return [];
    } finally {
      setLoadingRepos(false);
    }
  }, [api, t]);

  const showModal = async () => {
    if (!kind) {
      return;
    }
    const suggestedName = suggestDisplayName(context, kind);
    form.setFieldsValue({
      destinationType: 'existing',
      entryTitle: suggestedName,
      repoTitle: suggestedName,
    });
    setOpen(true);
    const loadedRepos = await loadRepos();
    const selectableRepos = loadedRepos.filter((repo) => repo.lifecycleStatus !== 'archived');
    if (selectableRepos.length === 0) {
      form.setFieldValue('destinationType', 'new');
    }
  };

  const submit = async () => {
    if (!kind) {
      return;
    }
    const values = await form.validateFields();
    const entryTitle = values.entryTitle.trim();
    const technicalNameSalt = `${context.workspace.ownerFingerprint}:${context.workspace.repository.repoId}`;
    setMoving(true);
    try {
      const result = await moveSourceToLightExtension(api, {
        locator: context.locator,
        expectedOwnerFingerprint: context.workspace.ownerFingerprint,
        sourceRepoId: context.workspace.repository.repoId,
        sourceHeadCommitId: context.workspace.repository.headCommitId || null,
        entryPath: context.entryPath,
        version: context.version,
        files: context.files.map((file) => ({ ...file })),
        destination:
          values.destinationType === 'existing'
            ? {
                type: 'existing',
                repoId: String(values.repoId || ''),
              }
            : {
                type: 'new',
                name: createTechnicalName(String(values.repoTitle || ''), 'light-extension', technicalNameSalt),
                title: values.repoTitle?.trim() || null,
              },
        entryName: createTechnicalName(entryTitle, kind, technicalNameSalt),
        entryTitle,
      });
      setOpen(false);
      message.success(t('Moved to light extension'));
      await context.onExternalBindingPersisted({
        sourceMode: 'light-extension',
        sourceBinding: result.binding,
      });
    } catch (error) {
      message.error(formatError(error, t('Failed to move source to light extension')));
    } finally {
      setMoving(false);
    }
  };

  if (!kind) {
    return null;
  }

  return (
    <>
      <Tooltip title={t('Move to light extension')}>
        <Button aria-label={t('Move to light extension')} icon={<ExportOutlined />} onClick={showModal} size="small" />
      </Tooltip>
      <Modal
        destroyOnClose
        maskClosable={!moving}
        okButtonProps={{ loading: moving }}
        okText={t('Move')}
        onCancel={() => setOpen(false)}
        onOk={submit}
        open={open}
        title={t('Move to light extension')}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label={t('Destination')} name="destinationType">
            <Radio.Group>
              <Radio value="existing">{t('Existing light extension')}</Radio>
              <Radio value="new">{t('Create new light extension')}</Radio>
            </Radio.Group>
          </Form.Item>
          {destinationType === 'existing' ? (
            <Form.Item
              label={t('Light extension')}
              name="repoId"
              rules={[{ required: true, message: t('Select a light extension') }]}
            >
              <Select
                loading={loadingRepos}
                options={repos.map((repo) => ({
                  label: repo.title || repo.name,
                  value: repo.id,
                }))}
                placeholder={t('Select a light extension')}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          ) : (
            <Form.Item
              label={t('Light extension name')}
              name="repoTitle"
              rules={displayNameRules(t, t('Light extension name'))}
            >
              <Input autoComplete="off" />
            </Form.Item>
          )}
          <Form.Item label={entryNameLabel} name="entryTitle" rules={displayNameRules(t, entryNameLabel)}>
            <Input autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

function resolveLightExtensionKind(context: RunJSStudioToolbarContext): LightExtensionKind | null {
  if (context.locator.kind !== 'flowModel.step') {
    return null;
  }
  const modelUse = context.workspace.source.metadata?.modelUse;
  return typeof modelUse === 'string' ? MODEL_USE_KIND.get(modelUse) || null : null;
}

function suggestDisplayName(context: RunJSStudioToolbarContext, kind: LightExtensionKind): string {
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
