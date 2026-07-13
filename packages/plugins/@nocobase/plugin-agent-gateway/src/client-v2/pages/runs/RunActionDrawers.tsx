/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UploadOutlined } from '@ant-design/icons';
import { Alert, Button, Collapse, Drawer, Form, Input, Modal, Select, Space, Upload } from 'antd';
import type { FormInstance, UploadProps } from 'antd';
import type { CSSMotionProps } from 'rc-motion';
import React from 'react';

import { AgentGatewayTaskParameterFormItems, OPENCODE_UI_BATCH_SKILL_KEY } from '../AgentGatewayTaskParameterFormItems';
import type {
  BuildTaskFormValues,
  ExternalRunImportFormValues,
  SkillUploadFormValues,
  SkillUploadResult,
  TFunction,
} from './types';

const TASK_RUN_DRAWER_WIDTH = 1040;
const NO_COLLAPSE_MOTION: CSSMotionProps = {
  motionName: '',
  motionAppear: false,
  motionEnter: false,
  motionLeave: false,
};
const FastCollapse = Collapse as React.ComponentType<
  React.ComponentProps<typeof Collapse> & { openMotion?: CSSMotionProps }
>;

export const DEFAULT_SKILL_UPLOAD_FORM_VALUES: SkillUploadFormValues = {
  skillKey: OPENCODE_UI_BATCH_SKILL_KEY,
  displayName: 'NB OpenCode UI Batch',
  versionLabel: 'local',
};

export const DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES: ExternalRunImportFormValues = {
  provider: 'codex',
  format: 'codex-jsonl',
  status: 'succeeded',
  externalRunKey: '',
};

interface BuildTaskDrawerProps {
  t: TFunction;
  open: boolean;
  form: FormInstance<BuildTaskFormValues>;
  loading: boolean;
  optionsLoading: boolean;
  hasOnlineRunner: boolean;
  runnerOptions: Array<{ label: string; value: string; disabled?: boolean }>;
  skillVersionOptions: Array<{ label: string; value: string }>;
  taskTemplateOptions: Array<{ label: string; value: string }>;
  defaultCwd: string;
  defaultRunner?: string;
  onClose(): void;
  onSubmit(): void;
  onTemplateChange(value?: string): void;
  onUploadSkill(): void;
}

export function BuildTaskDrawer(props: BuildTaskDrawerProps) {
  return (
    <Drawer
      title={props.t('New task run')}
      open={props.open}
      onClose={props.onClose}
      width={TASK_RUN_DRAWER_WIDTH}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={props.onClose}>{props.t('Close')}</Button>
          <Button
            type="primary"
            loading={props.loading}
            disabled={props.optionsLoading || !props.hasOnlineRunner}
            onClick={props.onSubmit}
          >
            {props.t('Create')}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {props.runnerOptions.length ? null : (
          <Alert type="warning" showIcon message={props.t('No active runner profiles yet')} />
        )}
        {props.runnerOptions.length && !props.hasOnlineRunner ? (
          <Alert
            type="warning"
            showIcon
            message={props.t('No online runner is available. Start or reconnect the daemon.')}
          />
        ) : null}
        <Form<BuildTaskFormValues>
          form={props.form}
          layout="vertical"
          initialValues={{ cwd: props.defaultCwd, runner: props.defaultRunner }}
        >
          <Form.Item label={props.t('Task template')} name="taskTemplateId">
            <Select
              allowClear
              loading={props.optionsLoading}
              onChange={props.onTemplateChange}
              options={props.taskTemplateOptions}
              optionFilterProp="label"
              placeholder={props.t('Select task template')}
              showSearch
            />
          </Form.Item>
          <AgentGatewayTaskParameterFormItems
            t={props.t}
            loading={props.optionsLoading}
            runnerSelectOptions={props.runnerOptions}
            skillVersionSelectOptions={props.skillVersionOptions}
            promptRequired
            runnerRequired
            onUploadSkill={props.onUploadSkill}
          />
        </Form>
      </Space>
    </Drawer>
  );
}

interface ExternalRunImportDrawerProps {
  t: TFunction;
  open: boolean;
  form: FormInstance<ExternalRunImportFormValues>;
  loading: boolean;
  logContent: string;
  onClose(): void;
  onSubmit(): void;
  onLogContentChange(value: string): void;
  beforeUpload: NonNullable<UploadProps['beforeUpload']>;
  onRemove: NonNullable<UploadProps['onRemove']>;
}

export function ExternalRunImportDrawer(props: ExternalRunImportDrawerProps) {
  return (
    <Drawer
      title={props.t('Import external run')}
      open={props.open}
      onClose={props.onClose}
      width={TASK_RUN_DRAWER_WIDTH}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={props.onClose}>{props.t('Close')}</Button>
          <Button type="primary" loading={props.loading} onClick={props.onSubmit}>
            {props.t('Import')}
          </Button>
        </Space>
      }
    >
      <Form<ExternalRunImportFormValues>
        form={props.form}
        layout="vertical"
        initialValues={DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES}
      >
        <Form.Item
          label={props.t('Provider')}
          name="provider"
          rules={[{ required: true, message: props.t('Provider is required') }]}
        >
          <Select
            onChange={(provider) => {
              const defaultFormats: Record<string, string> = {
                codex: 'codex-jsonl',
                opencode: 'opencode-jsonl',
                'claude-code': 'claude-code-jsonl',
                'generic-cli': 'text',
              };
              props.form.setFieldValue('format', defaultFormats[String(provider)] || 'text');
            }}
            options={[
              { value: 'codex', label: 'Codex' },
              { value: 'opencode', label: 'OpenCode' },
              { value: 'claude-code', label: 'Claude Code' },
              { value: 'generic-cli', label: props.t('Generic CLI') },
            ]}
          />
        </Form.Item>
        <Form.Item
          label={props.t('Log format')}
          name="format"
          rules={[{ required: true, message: props.t('Log format is required') }]}
        >
          <Select
            options={[
              { value: 'codex-jsonl', label: 'Codex JSONL' },
              { value: 'opencode-jsonl', label: 'OpenCode JSONL' },
              { value: 'claude-code-jsonl', label: 'Claude Code JSONL' },
              { value: 'text', label: props.t('Plain text') },
            ]}
          />
        </Form.Item>
        <Form.Item label={props.t('Title')} name="title">
          <Input />
        </Form.Item>
        <Form.Item label={props.t('Prompt')} name="instruction">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>
        <Form.Item
          label={props.t('Status')}
          name="status"
          rules={[{ required: true, message: props.t('Status is required') }]}
        >
          <Select
            options={['running', 'succeeded', 'failed', 'canceled', 'timeout', 'abandoned'].map((status) => ({
              value: status,
              label: status,
            }))}
          />
        </Form.Item>
        <Form.Item
          label={props.t('External run key')}
          name="externalRunKey"
          rules={[{ required: true, whitespace: true, message: props.t('External run key is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={props.t('Log file')}>
          <Upload
            accept=".jsonl,.ndjson,.json,.log,.txt,text/plain,application/json,application/x-ndjson"
            beforeUpload={props.beforeUpload}
            maxCount={1}
            onRemove={props.onRemove}
          >
            <Button icon={<UploadOutlined />}>{props.t('Upload')}</Button>
          </Upload>
        </Form.Item>
        <Form.Item label={props.t('Raw log')}>
          <Input.TextArea
            aria-label={props.t('Raw log')}
            autoSize={{ minRows: 8, maxRows: 16 }}
            value={props.logContent}
            onChange={(event) => props.onLogContentChange(event.target.value)}
          />
        </Form.Item>
        <FastCollapse
          ghost
          size="small"
          openMotion={NO_COLLAPSE_MOTION}
          items={[
            {
              key: 'advanced',
              label: props.t('Advanced'),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Form.Item label={props.t('Provider session ID')} name="providerSessionId">
                    <Input />
                  </Form.Item>
                  <Form.Item label={props.t('Source collection')} name="sourceCollection">
                    <Input />
                  </Form.Item>
                  <Form.Item label={props.t('Source record ID')} name="sourceRecordId">
                    <Input />
                  </Form.Item>
                  <Form.Item label={props.t('Output Agent run field')} name="outputAgentRunField">
                    <Input />
                  </Form.Item>
                </Space>
              ),
            },
          ]}
        />
      </Form>
    </Drawer>
  );
}

interface SkillUploadModalProps {
  t: TFunction;
  open: boolean;
  form: FormInstance<SkillUploadFormValues>;
  loading: boolean;
  result: SkillUploadResult | null;
  onClose(): void;
  onSubmit(): void;
  beforeUpload: NonNullable<UploadProps['beforeUpload']>;
  onRemove: NonNullable<UploadProps['onRemove']>;
}

export function SkillUploadModal(props: SkillUploadModalProps) {
  return (
    <Modal
      title={props.t('Upload skill')}
      open={props.open}
      onCancel={props.onClose}
      onOk={props.onSubmit}
      confirmLoading={props.loading}
      okText={props.t('Upload')}
      cancelText={props.t('Close')}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Form<SkillUploadFormValues>
          form={props.form}
          layout="vertical"
          initialValues={DEFAULT_SKILL_UPLOAD_FORM_VALUES}
        >
          <Form.Item
            label={props.t('Skill key')}
            name="skillKey"
            rules={[{ required: true, message: props.t('Skill key is required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={props.t('Display name')} name="displayName">
            <Input />
          </Form.Item>
          <Form.Item
            label={props.t('Version label')}
            name="versionLabel"
            rules={[{ required: true, message: props.t('Version label is required') }]}
          >
            <Input placeholder="local" />
          </Form.Item>
          <Form.Item label={props.t('Skill ZIP file')} required>
            <Upload
              accept=".zip,application/zip"
              beforeUpload={props.beforeUpload}
              maxCount={1}
              onRemove={props.onRemove}
            >
              <Button icon={<UploadOutlined />}>{props.t('Select ZIP')}</Button>
            </Upload>
          </Form.Item>
        </Form>
        {props.result ? (
          <Alert
            type="success"
            showIcon
            message={props.t('Skill uploaded')}
            description={[props.result.skillKey, props.result.versionLabel, props.result.status]
              .filter(Boolean)
              .join(' / ')}
          />
        ) : null}
      </Space>
    </Modal>
  );
}
