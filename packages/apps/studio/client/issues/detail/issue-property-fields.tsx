/**
 * The editable properties of an issue, each a label and its control over the projects plugin's headless hooks, in the
 * side column's order: what the task detail (`../groups/detail-pane.tsx`) draws as chips, or as a column of its own
 * when it is wide.
 */
import {
  canChangeIssueOwner,
  canCloseIssue,
  canEditIssues,
  isClosing,
  STAGE_MAX,
  statusTone,
  useExecutorOptions,
  useStatusName,
  type IssuePageActions,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  canUseSetting,
  pmKeys,
  usePmApi,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import {
  COLORS,
  PRIORITIES,
} from '@nocobase/app-plugin-projects/shared/common';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { enUS, zhCN } from 'date-fns/locale';
import type { ReactNode } from 'react';

import { IssuePriority, IssueStatusBadge } from '@/components/issue-table';
import { Button } from '@/components/ui/button';
import {
  AgentIcon,
  PersonValue,
  PropertyDate,
  PropertyMultiSelect,
  PropertyNumber,
  PropertySelect,
} from '@/components/property-fields';
import { PropertyColorPicker } from '@/extensions/nocobase-issue-detail/issue-properties';
import { cn } from 'cn';

import { useExecutorAgent } from '../../agents/executor-agent.js';
import { useInitExecutorLabel } from '../../projects/init-query.js';
import { toneColor } from '../rows.js';
import { useIssuePageWording } from './labels.js';

const DOT: Readonly<Record<string, string>> = {
  gray: 'bg-muted-foreground/50',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  green: 'bg-emerald-500 dark:bg-emerald-400',
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
};

const NONE = 'none';

/** One editable property: its label and its control. */
export interface IssuePropertyField {
  readonly key:
    | 'status'
    | 'priority'
    | 'owner'
    | 'assignToMe'
    | 'executor'
    | 'labels'
    | 'project'
    | 'stage'
    | 'start'
    | 'due';
  readonly label: string;
  readonly htmlFor?: string;
  readonly control: ReactNode;
}

/**
 * The editable properties of the issue, in the side column's order: what the task detail's chips and its properties
 * column both draw. `idPrefix` keeps the controls' ids apart when both are on one page.
 */
export function useIssuePropertyFields({
  detail,
  update,
  pageActions,
  idPrefix = 'pm-prop',
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly pageActions: IssuePageActions;
  readonly idPrefix?: string;
}): { readonly busy: boolean; readonly fields: readonly IssuePropertyField[] } {
  const { i18n, t: studioT } = useTranslation();
  const { t, detail: labels } = useIssuePageWording();
  const api = usePmApi();
  const viewer = useViewer();
  const statusName = useStatusName();
  const initExecutor = useInitExecutorLabel(detail);
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });
  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => api.projects(),
  });
  const allLabels = useQuery({
    queryKey: pmKeys.labels,
    queryFn: () => api.labels(),
  });
  const others = useExecutorOptions();
  const executorAgent = useExecutorAgent();

  const canEdit = canEditIssues(viewer);
  const canClose = canEdit && canCloseIssue(viewer, detail);
  const canReassign = canEdit && canChangeIssueOwner(viewer, detail);
  const busy = update.isPending;
  const disabled = busy || !canEdit;
  const you = (userId: string, name: string): string =>
    userId === viewer?.userId ? `${name} ${t('properties.you')}` : name;
  const dateLocale = i18n.language.startsWith('zh') ? zhCN : enUS;
  const status = (key: string) => ({
    name: statusName(detail.statuses, key),
    color: toneColor(statusTone(detail.statuses, key)),
  });
  const executorValue = detail.executor
    ? `${detail.executor.type}:${detail.executor.id}`
    : null;
  const executorName = (value: string): string =>
    others.find((option) => `${option.type}:${option.id}` === value)?.name ??
    members.data?.find((member) => `user:${member.userId}` === value)?.name ??
    detail.executorName ??
    value;

  const id = (name: string) => `${idPrefix}-${name}`;
  const fields: IssuePropertyField[] = [
    {
      key: 'status',
      label: t('properties.status'),
      htmlFor: id('status'),
      control: (
        <PropertySelect
          id={id('status')}
          options={detail.statuses.map((option) => ({
            value: option.key,
            label: statusName(detail.statuses, option.key),
            disabled:
              !canClose &&
              option.key !== detail.statusKey &&
              isClosing(option.category),
          }))}
          value={detail.statusKey}
          disabled={disabled}
          renderValue={(key) => <IssueStatusBadge status={status(key)} />}
          onChange={(statusKey) => {
            if (statusKey) update.mutate({ statusKey });
          }}
        />
      ),
    },
    {
      key: 'priority',
      label: t('properties.priority'),
      htmlFor: id('priority'),
      control: (
        <PropertySelect
          id={id('priority')}
          options={PRIORITIES.map((value) => ({
            value,
            label: t(`priority.${value}`),
          }))}
          value={detail.priority}
          disabled={disabled}
          renderValue={(value) => (
            <IssuePriority
              priority={detail.priority}
              label={t(`priority.${value}`)}
            />
          )}
          onChange={(value) => {
            const priority = PRIORITIES.find((item) => item === value);
            if (priority) update.mutate({ priority });
          }}
        />
      ),
    },
    {
      key: 'owner',
      label: t('properties.owner'),
      htmlFor: id('owner'),
      control: (
        <PropertySelect
          id={id('owner')}
          options={(members.data ?? []).map((member) => ({
            value: member.userId,
            label: you(member.userId, member.name),
          }))}
          value={detail.ownerUserId}
          disabled={busy || !canReassign || !members.data}
          renderValue={(value) => (
            <PersonValue
              name={
                value === detail.ownerUserId && detail.owner
                  ? you(detail.owner.id, detail.owner.name)
                  : (members.data?.find((member) => member.userId === value)
                      ?.name ?? value)
              }
            />
          )}
          onChange={(ownerUserId) => {
            if (ownerUserId) update.mutate({ ownerUserId });
          }}
        />
      ),
    },
    ...(viewer && detail.ownerUserId !== viewer.userId && canReassign
      ? [
          {
            key: 'assignToMe' as const,
            label: '',
            control: (
              <Button
                variant='ghost'
                size='xs'
                disabled={busy}
                onClick={() => update.mutate({ ownerUserId: viewer.userId })}
              >
                {t('properties.assignToMe')}
              </Button>
            ),
          },
        ]
      : []),
    {
      key: 'executor',
      label: studioT('issuePage.arrange'),
      htmlFor: id('executor'),
      control: (
        <PropertySelect
          id={id('executor')}
          noneLabel={initExecutor ?? t('executor.none')}
          options={[
            ...others.map((option) => ({
              value: `${option.type}:${option.id}`,
              label: option.name,
              icon: <AgentIcon />,
              render: executorAgent(option.id, option.name, 'menu'),
              ...(option.note ? { note: option.note } : {}),
              ...(option.disabled ? { disabled: true } : {}),
            })),
            ...(members.data ?? []).map((member) => ({
              value: `user:${member.userId}`,
              label: member.name,
            })),
          ]}
          value={executorValue}
          disabled={disabled}
          renderValue={(value) =>
            value.startsWith('user:') ? (
              <PersonValue name={executorName(value)} />
            ) : (
              executorAgent(
                value.slice(value.indexOf(':') + 1),
                executorName(value),
                'trigger',
              )
            )
          }
          onChange={(value) => {
            if (value === null || value === NONE) {
              update.mutate({ executor: null });
              return;
            }
            const separator = value.indexOf(':');
            update.mutate({
              executor: {
                type: value.slice(0, separator),
                id: value.slice(separator + 1),
              },
            });
          }}
        />
      ),
    },
    {
      key: 'labels',
      label: t('properties.labels'),
      htmlFor: id('labels'),
      control: (
        <PropertyMultiSelect
          id={id('labels')}
          aria-label={t('properties.labels')}
          options={(allLabels.data ?? detail.labels).map((label) => ({
            value: label.id,
            label: label.name,
            render: (
              <span className='inline-flex items-center gap-1.5'>
                <span
                  aria-hidden
                  className={cn('size-2 rounded-full', DOT[label.color])}
                />
                {label.name}
              </span>
            ),
          }))}
          value={detail.labels.map((label) => label.id)}
          disabled={disabled}
          placeholder={t('labels.placeholder')}
          {...(canUseSetting(viewer, 'pm.labels', 'update')
            ? { onCreate: pageActions.createLabel }
            : {})}
          onChange={(labelIds) => update.mutate({ labelIds })}
          labels={labels}
          action={
            canUseSetting(viewer, 'pm.labels', 'update') ? (
              <PropertyColorPicker
                items={detail.labels.map((label) => ({
                  value: label.id,
                  name: label.name,
                  color: label.color,
                }))}
                palette={COLORS.map((color) => ({
                  value: color,
                  label: t(`colors.${color}`),
                  className: DOT[color] ?? '',
                }))}
                onChange={(labelId, color) => {
                  const next = COLORS.find((item) => item === color);
                  if (next)
                    void pageActions
                      .recolorLabel(labelId, next)
                      .catch(() => undefined);
                }}
                labels={labels}
              />
            ) : null
          }
        />
      ),
    },
    {
      key: 'project',
      label: t('properties.project'),
      htmlFor: id('project'),
      control: (
        <PropertySelect
          id={id('project')}
          noneLabel={t('issueForm.noProject')}
          options={(projects.data ?? []).map((project) => ({
            value: project.id,
            label: project.name,
          }))}
          value={detail.projectId}
          disabled={disabled || !projects.data}
          renderValue={(value) => (
            <span className='truncate'>
              {value === detail.project?.id
                ? detail.project.name
                : (projects.data?.find((project) => project.id === value)
                    ?.name ?? value)}
            </span>
          )}
          onChange={(projectId) => update.mutate({ projectId })}
        />
      ),
    },
    ...(detail.parentIssueId
      ? [
          {
            key: 'stage' as const,
            label: t('subtasks.stageLabel'),
            htmlFor: id('stage'),
            control: (
              <PropertyNumber
                id={id('stage')}
                value={detail.stage}
                max={STAGE_MAX}
                disabled={disabled}
                placeholder={t('subtasks.noStage')}
                invalidText={t('subtasks.stageInvalid')}
                onChange={(stage) => update.mutate({ stage })}
              />
            ),
          },
        ]
      : []),
    {
      key: 'start',
      label: t('dates.start'),
      htmlFor: id('start'),
      control: (
        <PropertyDate
          id={id('start')}
          value={detail.startDate}
          disabled={disabled}
          clearLabel={t('dates.clearStart')}
          dateLocale={dateLocale}
          onChange={(startDate) => update.mutate({ startDate })}
        />
      ),
    },
    {
      key: 'due',
      label: t('dates.due'),
      htmlFor: id('due'),
      control: (
        <PropertyDate
          id={id('due')}
          value={detail.dueDate}
          disabled={disabled}
          clearLabel={t('dates.clearDue')}
          dateLocale={dateLocale}
          onChange={(dueDate) => update.mutate({ dueDate })}
        />
      ),
    },
  ];
  return { busy, fields };
}
