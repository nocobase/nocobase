/**
 * The projects plugin's cards of an issue's side column, drawn with the installed `issue-detail` block over the
 * plugin's headless hooks, in its words: the editable properties, who follows the issue, and when it was created and
 * changed. Setting an agent as the executor, or moving an issue an agent executes out of backlog, asks "Start now?"
 * first (`useConfirmedUpdate`). Controls the server would refuse are disabled rather than hidden: every field without
 * `issues/edit`; the owner and the done or closed statuses also for anyone but the owner, the project lead and whoever
 * holds them on every issue.
 */
import {
  canChangeIssueOwner,
  canCloseIssue,
  canEditIssues,
  isClosing,
  STAGE_MAX,
  statusTone,
  useConfirmedUpdate,
  useExecutorOptions,
  useKindLabel,
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
import type { ReactElement } from 'react';

import { PreviewPreferenceField } from '../../previews/preference-field.js';

import { IssuePriority, IssueStatusBadge } from '@/components/issue-table';
import { Button } from '@/components/ui/button';
import {
  AgentIcon,
  PersonValue,
  PropertyCard,
  PropertyDate,
  PropertyMultiSelect,
  PropertyNumber,
  PropertyRow,
  PropertySelect,
} from '@/components/property-fields';
import {
  IssueDates,
  IssueFollowers,
  IssueStartDialog,
  PropertyColorPicker,
} from '@/extensions/nocobase-issue-detail/issue-properties';
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

/** The editable properties, then "Start now?" when a change would start an agent. */
export function IssuePropertiesCard({
  detail,
  update,
  pageActions,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly pageActions: IssuePageActions;
}): ReactElement {
  const { i18n } = useTranslation();
  const { t, detail: labels } = useIssuePageWording();
  const api = usePmApi();
  const viewer = useViewer();
  const statusName = useStatusName();
  const kindLabel = useKindLabel();
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
  const confirmed = useConfirmedUpdate({ issue: detail, others, update });

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
  const request = confirmed.startRequest;
  const requestKind = request ? kindLabel(request.kind) : '';

  return (
    <PropertyCard title={labels.properties} busy={busy} labels={labels}>
      <PreviewPreferenceField issueId={detail.id} />
      <PropertyRow label={t('properties.status')} htmlFor='pm-prop-status'>
        <PropertySelect
          id='pm-prop-status'
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
            if (statusKey) confirmed.apply({ statusKey });
          }}
        />
      </PropertyRow>
      <PropertyRow label={t('properties.priority')} htmlFor='pm-prop-priority'>
        <PropertySelect
          id='pm-prop-priority'
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
      </PropertyRow>
      <PropertyRow label={t('properties.owner')} htmlFor='pm-prop-owner'>
        <PropertySelect
          id='pm-prop-owner'
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
      </PropertyRow>
      {viewer && detail.ownerUserId !== viewer.userId && canReassign ? (
        <PropertyRow label=''>
          <Button
            variant='ghost'
            size='xs'
            disabled={busy}
            onClick={() => update.mutate({ ownerUserId: viewer.userId })}
          >
            {t('properties.assignToMe')}
          </Button>
        </PropertyRow>
      ) : null}
      <PropertyRow label={t('properties.executor')} htmlFor='pm-prop-executor'>
        <PropertySelect
          id='pm-prop-executor'
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
              confirmed.apply({ executor: null });
              return;
            }
            const separator = value.indexOf(':');
            confirmed.apply({
              executor: {
                type: value.slice(0, separator),
                id: value.slice(separator + 1),
              },
            });
          }}
        />
      </PropertyRow>
      <PropertyRow label={t('properties.labels')} htmlFor='pm-prop-labels'>
        <PropertyMultiSelect
          id='pm-prop-labels'
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
      </PropertyRow>
      <PropertyRow label={t('properties.project')} htmlFor='pm-prop-project'>
        <PropertySelect
          id='pm-prop-project'
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
      </PropertyRow>
      {detail.parentIssueId ? (
        <PropertyRow label={t('subtasks.stageLabel')} htmlFor='pm-prop-stage'>
          <PropertyNumber
            id='pm-prop-stage'
            value={detail.stage}
            max={STAGE_MAX}
            disabled={disabled}
            placeholder={t('subtasks.noStage')}
            invalidText={t('subtasks.stageInvalid')}
            onChange={(stage) => update.mutate({ stage })}
          />
        </PropertyRow>
      ) : null}
      <PropertyRow label={t('dates.start')} htmlFor='pm-prop-start'>
        <PropertyDate
          id='pm-prop-start'
          value={detail.startDate}
          disabled={disabled}
          clearLabel={t('dates.clearStart')}
          dateLocale={dateLocale}
          onChange={(startDate) => update.mutate({ startDate })}
        />
      </PropertyRow>
      <PropertyRow label={t('dates.due')} htmlFor='pm-prop-due'>
        <PropertyDate
          id='pm-prop-due'
          value={detail.dueDate}
          disabled={disabled}
          clearLabel={t('dates.clearDue')}
          dateLocale={dateLocale}
          onChange={(dueDate) => update.mutate({ dueDate })}
        />
      </PropertyRow>
      <IssueStartDialog
        open={request !== null}
        description={t('start.descriptionFor', {
          identifier: detail.identifier,
          kind: requestKind,
        })}
        workersTitle={t('start.workers', { kind: requestKind })}
        workers={request?.names ?? []}
        onDecide={confirmed.decide}
        onCancel={confirmed.cancel}
        labels={labels}
      />
    </PropertyCard>
  );
}

/** Who follows the issue, and the viewer's follow button. */
export function IssueFollowersCard({
  detail,
  pageActions,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
}): ReactElement {
  const { t, detail: labels } = useIssuePageWording();
  const viewer = useViewer();
  return (
    <IssueFollowers
      followers={detail.subscribers.map((subscriber) => ({
        id: subscriber.userId,
        name: subscriber.name,
        reason: t(`subscribers.reason.${subscriber.reason}`, {
          defaultValue: subscriber.reason,
        }),
      }))}
      following={detail.subscribers.some(
        (subscriber) => subscriber.userId === viewer?.userId,
      )}
      {...(viewer ? { onToggle: pageActions.setFollowing } : {})}
      labels={labels}
    />
  );
}

/** When the issue was created and last changed. */
export function IssueDatesCard({
  detail,
}: {
  readonly detail: IssueDetail;
}): ReactElement {
  const { i18n } = useTranslation();
  const { detail: labels } = useIssuePageWording();
  return (
    <IssueDates
      createdAt={detail.createdAt}
      updatedAt={detail.updatedAt}
      locale={i18n.language}
      labels={labels}
    />
  );
}
