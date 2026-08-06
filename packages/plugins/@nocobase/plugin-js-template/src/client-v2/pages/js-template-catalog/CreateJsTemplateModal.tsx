/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils/client';
import { Form, Input, Modal, Radio, Select } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  JS_TEMPLATE_KEY_PATTERN,
  JS_TEMPLATE_SUPPORTED_KINDS,
  NAMESPACE,
  type JsTemplateKind,
} from '../../../constants';
import { createJsTemplateEntryStarter } from '../../../shared/jsTemplateEntryStarter';
import type { JsTemplateCreateJobSummary, JsTemplateProject, SaveAsJsTemplateDestination } from '../../../shared/types';
import { useJsTemplateProject } from '../../hooks/useJsTemplateProject';
import type { JsTemplateCatalogNotice } from './useJsTemplateCatalog';

interface CreateJsTemplateFormValues {
  templateName: string;
  title: string;
  description?: string;
  kind: JsTemplateKind;
  destinationType: SaveAsJsTemplateDestination['type'];
  existingProjectId?: string;
  sourceProjectName?: string;
}

export interface CreateJsTemplateModalProps {
  destinationProjectId?: string;
  onAcceptedJob: (job: JsTemplateCreateJobSummary) => void;
  onClose: () => void;
  onNotice: (notice: JsTemplateCatalogNotice | null) => void;
  onRefreshCatalog: () => Promise<boolean>;
  open: boolean;
}

export function CreateJsTemplateModal(props: CreateJsTemplateModalProps) {
  const { destinationProjectId, onAcceptedJob, onClose, onNotice, onRefreshCatalog, open } = props;
  const { t } = useTranslation(NAMESPACE);
  const { addTemplate, createProject, listProjects } = useJsTemplateProject();
  const [form] = Form.useForm<CreateJsTemplateFormValues>();
  const [sourceProjects, setSourceProjects] = useState<JsTemplateProject[]>([]);
  const [sourceProjectsLoading, setSourceProjectsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const destinationType = Form.useWatch('destinationType', form);

  const resetCreateForm = useCallback(() => {
    form.resetFields();
    form.setFieldsValue({
      kind: 'js-block',
      destinationType: destinationProjectId ? 'existing' : 'new',
      existingProjectId: destinationProjectId,
      sourceProjectName: createSourceProjectName(),
    });
  }, [destinationProjectId, form]);

  const loadSourceProjects = useCallback(async () => {
    setSourceProjectsLoading(true);
    try {
      setSourceProjects(await listProjects());
    } catch (error) {
      onNotice({
        type: 'error',
        message: error instanceof Error ? error.message : t('Failed to load Source Projects'),
      });
    } finally {
      setSourceProjectsLoading(false);
    }
  }, [listProjects, onNotice, t]);

  useEffect(() => {
    if (!open) {
      return;
    }
    resetCreateForm();
    loadSourceProjects();
  }, [loadSourceProjects, open, resetCreateForm]);

  useEffect(() => {
    if (open && destinationType === 'existing' && destinationProjectId) {
      form.setFieldValue('existingProjectId', destinationProjectId);
    }
  }, [destinationProjectId, destinationType, form, open]);

  const finishClose = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  const cancelCreate = useCallback(() => {
    if (!creating) {
      finishClose();
    }
  }, [creating, finishClose]);

  const createTemplate = async () => {
    const values = await form.validateFields();
    setCreating(true);
    onNotice(null);
    try {
      const title = values.title.trim();
      const description = values.description?.trim() || null;
      const destination: SaveAsJsTemplateDestination =
        values.destinationType === 'existing'
          ? { type: 'existing', projectId: values.existingProjectId || '' }
          : {
              type: 'new',
              name: values.sourceProjectName?.trim() || '',
              title,
              description,
            };
      if (destination.type === 'existing') {
        const project = sourceProjects.find((candidate) => candidate.id === destination.projectId);
        if (!project || project.lifecycleStatus !== 'enabled') {
          throw new Error(t('Select an enabled Source Project'));
        }
        await addTemplate({
          destination,
          expectedHeadCommitId: project.headCommitId,
          kind: values.kind,
          templateName: values.templateName.trim(),
          title,
          description,
        });
        finishClose();
        const refreshed = await onRefreshCatalog();
        if (refreshed) {
          onNotice({
            type: 'success',
            message: t('JS Template added to Source Project: {{name}}').replace(
              '{{name}}',
              project.title || project.name,
            ),
          });
        }
      } else {
        const accepted = await createProject({
          name: destination.name,
          title: destination.title,
          description: destination.description,
          initialFiles: createJsTemplateEntryStarter({
            kind: values.kind,
            templateName: values.templateName.trim(),
            title,
            description,
          }),
          message: 'Create JS Template entry',
        });
        onAcceptedJob(accepted);
        finishClose();
        onNotice({ type: 'info', message: t('JS Template creation started') });
      }
    } catch (error) {
      onNotice({
        type: 'error',
        message: error instanceof Error ? error.message : t('JS Template creation failed'),
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      confirmLoading={creating}
      okText={t('Create')}
      onCancel={cancelCreate}
      onOk={createTemplate}
      open={open}
      title={t('Create JS Template')}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={t('Template name')}
          name="templateName"
          rules={[
            { required: true, message: t('Name is required') },
            { pattern: JS_TEMPLATE_KEY_PATTERN, message: t('Name format is invalid') },
          ]}
        >
          <Input autoFocus />
        </Form.Item>
        <Form.Item
          label={t('Template title')}
          name="title"
          rules={[{ required: true, whitespace: true, message: t('Title is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={t('Kind')} name="kind" rules={[{ required: true }]}>
          <Select options={JS_TEMPLATE_SUPPORTED_KINDS.map((value) => ({ label: t(value), value }))} />
        </Form.Item>
        <Form.Item label={t('Description')} name="description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item label={t('Source Project destination')} name="destinationType" rules={[{ required: true }]}>
          <Radio.Group
            aria-label={t('Source Project destination')}
            options={[
              { label: t('Create a new Source Project'), value: 'new' },
              { label: t('Add to an existing Source Project'), value: 'existing' },
            ]}
          />
        </Form.Item>
        {destinationType === 'existing' ? (
          <Form.Item
            label={t('Existing Source Project')}
            name="existingProjectId"
            rules={[{ required: true, message: t('Select a Source Project') }]}
          >
            <Select
              aria-label={t('Existing Source Project')}
              loading={sourceProjectsLoading}
              options={sourceProjects.map((project) => ({
                disabled: project.lifecycleStatus !== 'enabled',
                label: `${project.title || project.name} (${project.name})${
                  project.lifecycleStatus === 'enabled' ? '' : ` - ${t(project.lifecycleStatus)}`
                }`,
                value: project.id,
              }))}
              optionFilterProp="label"
              placeholder={t('Select a Source Project')}
              showSearch
            />
          </Form.Item>
        ) : (
          <Form.Item
            extra={t('The Source Project name is generated automatically and can be changed if needed.')}
            label={t('Source Project name')}
            name="sourceProjectName"
            rules={[
              { required: true, message: t('Name is required') },
              { pattern: /^[a-z][a-z0-9._-]*$/, message: t('Name format is invalid') },
            ]}
          >
            <Input />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}

function createSourceProjectName(): string {
  return `jt_${uid()}`;
}
