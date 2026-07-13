/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Descriptions, Empty, Space, Spin, Tag, Typography } from 'antd';
import React from 'react';
import { BuildSkillVersionOption } from '../../../pages/AgentGatewayTaskParameterFormItems';
import { JsonPreview, formatDateTime, statusTag } from '../../../pages/AgentGatewayPageUtils';
import { RunRecord, SkillVersionDetailRecord, TaskTemplateDetailRecord, TFunction } from '../../../pages/runs/types';
import { getRunTaskTitle } from '../../../pages/runs/runFormatters';

export function RunTaskTitle({ run, t, onOpen }: { run: RunRecord; t: TFunction; onOpen?: (run: RunRecord) => void }) {
  const title = getRunTaskTitle(run, t);
  if (onOpen) {
    return (
      <Typography.Link
        href="#"
        strong
        aria-label={t('View run details')}
        ellipsis
        title={title}
        onClick={(event) => {
          event.preventDefault();
          onOpen(run);
        }}
        style={{ display: 'inline-block', maxWidth: 300 }}
      >
        {title}
      </Typography.Link>
    );
  }
  return (
    <Typography.Text strong ellipsis={{ tooltip: title }} style={{ display: 'inline-block', maxWidth: 300 }}>
      {title}
    </Typography.Text>
  );
}

export function RunTaskTemplateLink({ run, onOpen }: { run: RunRecord; onOpen: (templateId: string) => void }) {
  const template = run.taskTemplateJson;
  const label = template?.displayName || template?.templateKey || run.taskTemplateId || '';
  const templateId = template?.id || run.taskTemplateId || '';
  if (!label) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  if (!templateId) {
    return (
      <Typography.Text ellipsis={{ tooltip: label }} style={{ display: 'inline-block', maxWidth: 220 }}>
        {label}
      </Typography.Text>
    );
  }
  return (
    <Typography.Link
      href="#"
      ellipsis
      title={label}
      onClick={(event) => {
        event.preventDefault();
        onOpen(templateId);
      }}
      style={{ display: 'inline-block', maxWidth: 220 }}
    >
      {label}
    </Typography.Link>
  );
}

export function getSkillVersionLabel(skillVersion: BuildSkillVersionOption) {
  return [skillVersion.displayName || skillVersion.skillKey || skillVersion.id, skillVersion.versionLabel]
    .filter(Boolean)
    .join(' / ');
}

export function getSkillVersionDetailDisplayLabel(skillVersion: SkillVersionDetailRecord) {
  return [
    skillVersion.displayName || skillVersion.skillKey || skillVersion.skillId || skillVersion.id,
    skillVersion.versionLabel,
  ]
    .filter(Boolean)
    .join(' / ');
}

export function RunTaskTemplateSkills({ run, onOpen }: { run: RunRecord; onOpen: (skillVersionId: string) => void }) {
  const skills = run.taskTemplateJson?.skills || [];
  if (!skills.length) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  return (
    <Space wrap size={[4, 0]}>
      {skills.map((skillVersion) => {
        const label = getSkillVersionLabel(skillVersion);
        return (
          <Typography.Link
            key={skillVersion.id}
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onOpen(skillVersion.id);
            }}
          >
            {label}
          </Typography.Link>
        );
      })}
    </Space>
  );
}

export function TaskTemplateDetailDrawerContent({
  template,
  loading,
  error,
  t,
}: {
  template: TaskTemplateDetailRecord | null | undefined;
  loading: boolean;
  error?: string;
  t: TFunction;
}) {
  if (error) {
    return <Alert type="warning" showIcon message={t('Task template details unavailable')} description={error} />;
  }
  if (loading && !template) {
    return <Spin />;
  }
  if (!template) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Task template details unavailable')} />;
  }

  const skillVersionIds = Array.isArray(template.skillVersionIdsJson) ? template.skillVersionIdsJson : [];
  const artifacts = Array.isArray(template.artifactsJson) ? template.artifactsJson : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label={t('Template key')}>{template.templateKey || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Display name')}>{template.displayName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Description')}>{template.description || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Status')}>{statusTag(template.status || 'active')}</Descriptions.Item>
        <Descriptions.Item label={t('Default title')}>{template.defaultTitle || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Prompt')}>
          {template.defaultPrompt ? (
            <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {template.defaultPrompt}
            </Typography.Paragraph>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t('Working directory')}>{template.cwd || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Skills')}>
          {skillVersionIds.length ? (
            <Space size={[4, 4]} wrap>
              {skillVersionIds.map((skillVersionId) => (
                <Tag key={skillVersionId}>{skillVersionId}</Tag>
              ))}
            </Space>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t('Artifact root')}>{template.artifactRoot || '-'}</Descriptions.Item>
      </Descriptions>
      {artifacts.length ? (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('Artifacts')}
          </Typography.Title>
          <JsonPreview value={artifacts} />
        </Space>
      ) : null}
    </Space>
  );
}

export function SkillDetailDrawerContent({
  skillVersion,
  loading,
  error,
  t,
}: {
  skillVersion: SkillVersionDetailRecord | null | undefined;
  loading: boolean;
  error?: string;
  t: TFunction;
}) {
  if (error) {
    return <Alert type="warning" showIcon message={t('Skill details unavailable')} description={error} />;
  }
  if (loading && !skillVersion) {
    return <Spin />;
  }
  if (!skillVersion) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Skill details unavailable')} />;
  }

  return (
    <Descriptions bordered size="small" column={1}>
      <Descriptions.Item label={t('Skill')}>{skillVersion.displayName || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Skill key')}>{skillVersion.skillKey || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Skill ID')}>{skillVersion.skillId || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Skill version ID')}>
        {skillVersion.skillVersionId || skillVersion.id}
      </Descriptions.Item>
      <Descriptions.Item label={t('Version label')}>{skillVersion.versionLabel || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Status')}>
        <Space size={4} wrap>
          {statusTag(skillVersion.status)}
          {skillVersion.skillStatus && skillVersion.skillStatus !== skillVersion.status
            ? statusTag(skillVersion.skillStatus)
            : null}
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label={t('Source')}>
        {[skillVersion.sourceType, skillVersion.sourceSha256].filter(Boolean).join(' / ') || '-'}
      </Descriptions.Item>
      <Descriptions.Item label={t('Content size')}>{skillVersion.sourceSizeBytes ?? '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Uploaded at')}>
        {formatDateTime(skillVersion.sourceUploadedAt || undefined)}
      </Descriptions.Item>
      <Descriptions.Item label={t('Created at')}>
        {formatDateTime(skillVersion.createdAt || undefined)}
      </Descriptions.Item>
      <Descriptions.Item label={t('Updated at')}>
        {formatDateTime(skillVersion.updatedAt || undefined)}
      </Descriptions.Item>
    </Descriptions>
  );
}
