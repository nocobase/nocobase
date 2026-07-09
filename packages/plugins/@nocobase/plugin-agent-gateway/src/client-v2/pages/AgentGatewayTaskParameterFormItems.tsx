/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Collapse, Form, Input, Select, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CSSMotionProps } from 'rc-motion';
import React from 'react';

export type AgentGatewayTFunction = (key: string, options?: Record<string, unknown>) => string;

export const OPENCODE_UI_BATCH_SKILL_KEY = 'nb-opencode-ui-batch';

export interface BuildRunnerProfileOption {
  id: string;
  nodeId: string;
  profileKey: string;
  displayName?: string;
  provider?: string | null;
  status?: string;
}

export interface BuildRunnerNodeOption {
  id: string;
  nodeKey: string;
  displayName?: string;
  status?: string;
  online?: boolean;
  onlineReason?: string | null;
  lastHeartbeatAt?: string | null;
  profiles?: BuildRunnerProfileOption[];
}

export interface BuildSkillVersionOption {
  id: string;
  skillId?: string;
  skillKey?: string;
  displayName?: string;
  versionLabel: string;
  status?: string;
}

export interface BuildTaskTemplateOption {
  id: string;
  templateKey: string;
  displayName?: string;
  description?: string;
  defaultTitle?: string;
  defaultPrompt?: string;
  cwd?: string;
  nodeId?: string | null;
  agentProfileId?: string | null;
  skillVersionIds?: string[];
  artifactRoot?: string;
  artifacts?: BuildTaskArtifactDeclarationPayload[];
}

export interface BuildRunOptions {
  defaultProfileKey?: string;
  defaultCwd?: string;
  nodes?: BuildRunnerNodeOption[];
  skillVersions?: BuildSkillVersionOption[];
  taskTemplates?: BuildTaskTemplateOption[];
}

export interface BuildTaskArtifactDeclarationFormValue {
  kind?: 'path' | 'glob';
  value?: string;
  groupLabel?: string;
}

export type BuildTaskArtifactDeclarationPayload =
  | {
      path: string;
      groupLabel?: string;
    }
  | {
      glob: string;
      groupLabel?: string;
    };

export interface AgentGatewayTaskParameterFormValues {
  title?: string;
  prompt?: string;
  skillVersionIds?: string[];
  runner?: string;
  cwd?: string;
  artifactRoot?: string;
  artifactDeclarations?: BuildTaskArtifactDeclarationFormValue[];
}

export function getOptionalFormString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function getBuildRunnerValue(nodeId: string, profileId: string) {
  return `${nodeId}:${profileId}`;
}

export function parseBuildRunnerValue(value?: string) {
  if (!value) {
    return {};
  }
  const [nodeId, agentProfileId] = value.split(':');
  return {
    nodeId: nodeId || undefined,
    agentProfileId: agentProfileId || undefined,
  };
}

function compareBuildRunnerNodes(first: BuildRunnerNodeOption, second: BuildRunnerNodeOption) {
  if (first.online !== second.online) {
    return first.online ? -1 : 1;
  }
  if (first.status !== second.status) {
    return first.status === 'active' ? -1 : 1;
  }
  if (Boolean(first.profiles?.length) !== Boolean(second.profiles?.length)) {
    return first.profiles?.length ? -1 : 1;
  }
  return (first.displayName || first.nodeKey).localeCompare(second.displayName || second.nodeKey);
}

function getSortedBuildRunnerNodes(options: BuildRunOptions | undefined) {
  return [...(options?.nodes || [])].sort(compareBuildRunnerNodes);
}

function isBuildRunnerProfileSelectable(node: BuildRunnerNodeOption, profile: BuildRunnerProfileOption) {
  return node.online === true && node.status !== 'disabled' && profile.status === 'active';
}

function getBuildRunnerConnectionText(node: BuildRunnerNodeOption, t: AgentGatewayTFunction) {
  if (node.online === true) {
    return t('Online');
  }
  if (node.onlineReason === 'heartbeat-stale') {
    return t('Offline - stale heartbeat');
  }
  if (node.onlineReason === 'missing-heartbeat') {
    return t('Offline - no heartbeat');
  }
  if (node.onlineReason === 'node-disabled' || node.status === 'disabled') {
    return t('Offline - disabled');
  }
  return t('Offline');
}

export function hasSelectableBuildRunner(options: BuildRunOptions | undefined) {
  return getSortedBuildRunnerNodes(options).some((node) =>
    (node.profiles || []).some((profile) => isBuildRunnerProfileSelectable(node, profile)),
  );
}

export function getDefaultBuildRunnerValue(options: BuildRunOptions | undefined) {
  const nodes = getSortedBuildRunnerNodes(options);
  const nodePool = nodes.filter((node) => node.online === true && node.status !== 'disabled');
  for (const node of nodePool) {
    const profile = (node.profiles || []).find(
      (item) =>
        item.profileKey === (options?.defaultProfileKey || 'codex') && isBuildRunnerProfileSelectable(node, item),
    );
    if (profile) {
      return getBuildRunnerValue(node.id, profile.id);
    }
  }
  for (const node of nodePool) {
    const profile = (node.profiles || []).find((item) => isBuildRunnerProfileSelectable(node, item));
    if (profile) {
      return getBuildRunnerValue(node.id, profile.id);
    }
  }
  return undefined;
}

export function getBuildRunnerSelectOptions(options: BuildRunOptions | undefined, t: AgentGatewayTFunction) {
  return getSortedBuildRunnerNodes(options).flatMap((node) =>
    (node.profiles || []).map((profile) => {
      const selectable = isBuildRunnerProfileSelectable(node, profile);
      return {
        value: getBuildRunnerValue(node.id, profile.id),
        label: [
          node.displayName || node.nodeKey,
          profile.displayName || profile.profileKey,
          getBuildRunnerConnectionText(node, t),
        ].join(' / '),
        disabled: !selectable,
      };
    }),
  );
}

export function getBuildSkillVersionSelectOptions(options: BuildRunOptions | undefined) {
  return (options?.skillVersions || []).map((skillVersion) => ({
    value: skillVersion.id,
    label: [skillVersion.displayName || skillVersion.skillKey || skillVersion.id, skillVersion.versionLabel]
      .filter(Boolean)
      .join(' / '),
  }));
}

export function getTaskArtifactFormValues(
  artifacts: BuildTaskArtifactDeclarationPayload[] | undefined,
): BuildTaskArtifactDeclarationFormValue[] {
  if (!Array.isArray(artifacts)) {
    return [];
  }
  return artifacts
    .map((artifact) => {
      if ('path' in artifact) {
        return {
          kind: 'path' as const,
          value: artifact.path,
          groupLabel: artifact.groupLabel,
        };
      }
      return {
        kind: 'glob' as const,
        value: artifact.glob,
        groupLabel: artifact.groupLabel,
      };
    })
    .filter((artifact) => Boolean(artifact.value));
}

export function getTaskArtifactDeclarations(
  values: BuildTaskArtifactDeclarationFormValue[] | undefined,
): BuildTaskArtifactDeclarationPayload[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const declarations: BuildTaskArtifactDeclarationPayload[] = [];
  for (const value of values) {
    const artifactPath = getOptionalFormString(value.value);
    if (!artifactPath) {
      continue;
    }
    const groupLabel = getOptionalFormString(value.groupLabel);
    declarations.push({
      ...(value.kind === 'path' ? { path: artifactPath } : { glob: artifactPath }),
      ...(groupLabel ? { groupLabel } : {}),
    });
  }
  return declarations;
}

const NO_COLLAPSE_MOTION: CSSMotionProps = {
  motionName: '',
  motionAppear: false,
  motionEnter: false,
  motionLeave: false,
};

const FastCollapse = Collapse as React.ComponentType<
  React.ComponentProps<typeof Collapse> & { openMotion?: CSSMotionProps }
>;

interface AgentGatewayTaskParameterFormItemsProps {
  t: AgentGatewayTFunction;
  loading?: boolean;
  runnerSelectOptions: Array<{ value: string; label: string; disabled?: boolean }>;
  skillVersionSelectOptions: Array<{ value: string; label: string }>;
  promptRequired?: boolean;
  runnerRequired?: boolean;
  onUploadSkill?: () => void;
}

type ArtifactDeclarationField = BuildTaskArtifactDeclarationFormValue & {
  key: number;
  name: number;
  remove?: () => void;
};

export function AgentGatewayTaskParameterFormItems({
  t,
  loading,
  runnerSelectOptions,
  skillVersionSelectOptions,
  promptRequired,
  runnerRequired,
  onUploadSkill,
}: AgentGatewayTaskParameterFormItemsProps) {
  const artifactDeclarationColumns: ColumnsType<ArtifactDeclarationField> = [
    {
      title: (
        <Space size={4}>
          <Typography.Text type="danger">*</Typography.Text>
          <span>{t('Match type')}</span>
        </Space>
      ),
      width: 150,
      onCell: () => ({ style: { verticalAlign: 'bottom' } }),
      render: (_value, field) => (
        <Form.Item
          name={[field.name, 'kind']}
          initialValue="glob"
          rules={[{ required: true, message: t('Match type is required') }]}
          style={{ marginBottom: 0 }}
        >
          <Select
            aria-label={t('Match type')}
            options={[
              { value: 'path', label: t('Path') },
              { value: 'glob', label: t('Glob') },
            ]}
          />
        </Form.Item>
      ),
    },
    {
      title: (
        <Space size={4}>
          <Typography.Text type="danger">*</Typography.Text>
          <span>{t('Artifact path or glob')}</span>
        </Space>
      ),
      onCell: () => ({ style: { verticalAlign: 'bottom' } }),
      render: (_value, field) => (
        <Form.Item
          name={[field.name, 'value']}
          rules={[{ required: true, message: t('Artifact path or glob is required') }]}
          style={{ marginBottom: 0 }}
        >
          <Input aria-label={t('Artifact path or glob')} placeholder="runs/example/**/*.html" />
        </Form.Item>
      ),
    },
    {
      title: t('Artifact group'),
      width: 220,
      onCell: () => ({ style: { verticalAlign: 'bottom' } }),
      render: (_value, field) => (
        <Form.Item name={[field.name, 'groupLabel']} style={{ marginBottom: 0 }}>
          <Input aria-label={t('Artifact group')} placeholder={t('Optional group')} />
        </Form.Item>
      ),
    },
    {
      title: '',
      width: 88,
      align: 'left',
      onCell: () => ({ style: { verticalAlign: 'bottom' } }),
      render: (_value, field) => (
        <Tooltip title={t('Remove artifact declaration')}>
          <Button
            aria-label={t('Remove artifact declaration')}
            danger
            icon={<DeleteOutlined />}
            onClick={() => field.remove?.()}
            type="text"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Form.Item label={t('Title')} name="title">
        <Input />
      </Form.Item>
      <Form.Item
        label={t('Instruction')}
        name="prompt"
        rules={promptRequired ? [{ required: true, message: t('Instruction is required') }] : []}
      >
        <Input.TextArea autoSize={{ minRows: 6, maxRows: 12 }} />
      </Form.Item>
      <Form.Item label={t('Skill versions')} name="skillVersionIds">
        <Select
          allowClear
          mode="multiple"
          showSearch
          loading={loading}
          options={skillVersionSelectOptions}
          optionFilterProp="label"
          placeholder={t('Select skill versions')}
        />
      </Form.Item>
      {onUploadSkill ? (
        <Button icon={<UploadOutlined />} onClick={onUploadSkill}>
          {t('Upload skill')}
        </Button>
      ) : null}
      <Form.Item
        label={t('Runner')}
        name="runner"
        rules={runnerRequired ? [{ required: true, message: t('Runner is required') }] : []}
      >
        <Select allowClear loading={loading} options={runnerSelectOptions} placeholder={t('Select runner')} />
      </Form.Item>
      <FastCollapse
        ghost
        size="small"
        openMotion={NO_COLLAPSE_MOTION}
        items={[
          {
            key: 'advanced',
            label: t('Advanced'),
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Form.Item label={t('Working directory')} name="cwd">
                  <Input />
                </Form.Item>
                <Form.Item label={t('Artifact root')} name="artifactRoot">
                  <Input placeholder={t('Defaults to working directory')} />
                </Form.Item>
                <Form.List name="artifactDeclarations">
                  {(fields, { add, remove }) => {
                    const dataSource: ArtifactDeclarationField[] = fields.map((field) => ({
                      ...field,
                      remove: () => remove(field.name),
                    }));

                    return (
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Typography.Text strong>{t('Artifact collection')}</Typography.Text>
                          <Button icon={<PlusOutlined />} onClick={() => add({ kind: 'glob' })}>
                            {t('Add artifact declaration')}
                          </Button>
                        </Space>
                        {fields.length ? (
                          <Table
                            columns={artifactDeclarationColumns}
                            dataSource={dataSource}
                            pagination={false}
                            rowKey="key"
                            scroll={{ x: 720 }}
                            size="small"
                          />
                        ) : null}
                      </Space>
                    );
                  }}
                </Form.List>
              </Space>
            ),
          },
        ]}
      />
    </>
  );
}
