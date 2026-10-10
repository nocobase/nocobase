/**
 * A project's Overview tab, drawn with the installed `project-detail` block and `property-fields` over the projects
 * plugin's headless hooks, in its words: the key numbers, the status distribution in workflow order and the description
 * on the left; the properties and the members as a row of avatars on the right. Whoever may manage the project edits
 * the description and the properties in place; while the project is being initialized, its initialization leads the
 * left column (`../init-card.tsx`), and for whoever manages the project, "Next steps" lists what is still to set up
 * (`next-steps.tsx`); switching the workflow is refused while an issue is in a status the new one lacks (the server
 * says why).
 */
import {
  statusTone,
  useStatusName,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  isProjectStatus,
  projectNumbers,
  projectStatusSuffix,
  projectStatusTone,
  useProjectUpdate,
  useProjectWorkflow,
  useWorkspaceMembers,
} from '@nocobase/app-plugin-projects/client/projects';
import { PRIORITIES } from '@nocobase/app-plugin-projects/shared/common';
import { PROJECT_STATUSES } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { enUS, zhCN } from 'date-fns/locale';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { IssuePriority, IssueStatusBadge } from '@/components/issue-table';
import {
  PersonValue,
  PropertyCard,
  PropertyDate,
  PropertyRow,
  PropertySelect,
} from '@/components/property-fields';
import {
  ProjectDescription,
  ProjectMembersRow,
  ProjectMetrics,
  ProjectOverviewLayout,
  ProjectStatusDistribution,
} from '@/extensions/nocobase-project-detail/project-detail';

import { IssueMarkdown } from '../../issues/markdown.js';
import { toneColor } from '../../issues/rows.js';
import { ProjectInitCard } from '../init-card.js';
import { useProjectPage } from './context.js';
import { useProjectPageWording } from './labels.js';
import { NextStepsCard } from './next-steps.js';

function RouterLink({
  href,
  className,
  children,
}: {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}

export function ProjectOverview(): ReactElement {
  const { project, statuses, canEdit } = useProjectPage();
  const { i18n } = useTranslation();
  const { t, detail: labels, fields, richText } = useProjectPageWording();
  const statusName = useStatusName();
  const members = useWorkspaceMembers();
  const workflow = useProjectWorkflow(project);
  const { update, isPending } = useProjectUpdate(project.id);
  const disabled = !canEdit || isPending;
  const save = (changes: Parameters<typeof update>[0]): void => {
    update(changes).catch(() => undefined);
  };
  const dateLocale = i18n.language.startsWith('zh') ? zhCN : enUS;

  const byStatus = project.issueCounts.byStatus;
  const numbers = projectNumbers(byStatus, statuses);
  const known = (statuses ?? []).map((status) => status.key);
  const rows = [
    ...known,
    ...Object.keys(byStatus).filter((key) => !known.includes(key)),
  ].map((key) => ({
    key,
    name: statusName(statuses, key),
    color: toneColor(statusTone(statuses, key)),
    count: byStatus[key] ?? 0,
  }));
  const projectStatus = (status: string) =>
    isProjectStatus(status)
      ? {
          name: t(`projectStatus.${projectStatusSuffix(status)}`),
          color: toneColor(projectStatusTone(status)),
        }
      : { name: status, color: 'gray' as const };
  const memberName = (userId: string): string =>
    members.data?.find((member) => member.userId === userId)?.name ??
    (project.lead?.id === userId ? project.lead.name : userId);

  return (
    <ProjectOverviewLayout
      asideLabel={t('projects.sidePanel')}
      main={
        <>
          <ProjectInitCard projectId={project.id} />
          {canEdit ? (
            <NextStepsCard
              projectId={project.id}
              resources={project.resources}
            />
          ) : null}
          <ProjectMetrics
            labels={labels}
            metrics={(['total', 'started', 'review', 'done'] as const).map(
              (key) => ({
                key,
                label: t(`projectPage.stats.${key}`),
                value: numbers[key],
              }),
            )}
          />
          <ProjectStatusDistribution rows={rows} labels={labels} />
          <ProjectDescription
            description={project.description ?? ''}
            renderMarkdown={(content) => <IssueMarkdown content={content} />}
            richTextLabels={richText}
            labels={labels}
            {...(canEdit
              ? {
                  onSave: (markdown: string) =>
                    update({ description: markdown || null }),
                }
              : {})}
          />
        </>
      }
      aside={
        <>
          <PropertyCard
            title={t('properties.title')}
            busy={isPending}
            labels={fields}
          >
            <PropertyRow
              label={t('projects.columns.status')}
              htmlFor='pm-project-status'
            >
              <PropertySelect
                id='pm-project-status'
                options={PROJECT_STATUSES.map((status) => ({
                  value: status,
                  label: t(`projectStatus.${projectStatusSuffix(status)}`),
                }))}
                value={project.status}
                disabled={disabled}
                renderValue={(status) => (
                  <IssueStatusBadge status={projectStatus(status)} />
                )}
                onChange={(value) => {
                  if (value && isProjectStatus(value)) save({ status: value });
                }}
              />
            </PropertyRow>
            <PropertyRow
              label={t('properties.priority')}
              htmlFor='pm-project-priority'
            >
              <PropertySelect
                id='pm-project-priority'
                options={PRIORITIES.map((value) => ({
                  value,
                  label: t(`priority.${value}`),
                }))}
                value={project.priority}
                disabled={disabled}
                renderValue={(value) => {
                  const priority = PRIORITIES.find((item) => item === value);
                  return priority ? (
                    <IssuePriority
                      priority={priority}
                      label={t(`priority.${priority}`)}
                    />
                  ) : (
                    value
                  );
                }}
                onChange={(value) => {
                  const priority = PRIORITIES.find((item) => item === value);
                  if (priority) save({ priority });
                }}
              />
            </PropertyRow>
            <PropertyRow
              label={t('projects.columns.lead')}
              htmlFor='pm-project-lead'
            >
              <PropertySelect
                id='pm-project-lead'
                options={(members.data ?? []).map((member) => ({
                  value: member.userId,
                  label: member.name,
                }))}
                value={project.leadUserId}
                noneLabel={t('projects.noLead')}
                disabled={disabled || !members.data}
                renderValue={(value) => (
                  <PersonValue name={memberName(value)} />
                )}
                onChange={(leadUserId) => save({ leadUserId })}
              />
            </PropertyRow>
            <PropertyRow
              label={t('projects.workflow')}
              htmlFor='pm-project-workflow'
            >
              <PropertySelect
                id='pm-project-workflow'
                options={workflow.options}
                value={workflow.value}
                {...(workflow.noneLabel
                  ? { noneLabel: workflow.noneLabel }
                  : {})}
                disabled={disabled || workflow.loading}
                onChange={(option) => {
                  const workflowId = workflow.toWorkflowId(option);
                  if (workflowId !== undefined) save({ workflowId });
                }}
              />
            </PropertyRow>
            <PropertyRow label={t('dates.start')} htmlFor='pm-project-start'>
              <PropertyDate
                id='pm-project-start'
                value={project.startDate}
                disabled={disabled}
                clearLabel={t('dates.clearStart')}
                dateLocale={dateLocale}
                onChange={(startDate) => save({ startDate })}
              />
            </PropertyRow>
            <PropertyRow label={t('dates.due')} htmlFor='pm-project-due'>
              <PropertyDate
                id='pm-project-due'
                value={project.dueDate}
                disabled={disabled}
                clearLabel={t('dates.clearDue')}
                dateLocale={dateLocale}
                onChange={(dueDate) => save({ dueDate })}
              />
            </PropertyRow>
          </PropertyCard>
          <ProjectMembersRow
            members={project.members.map((member) => ({
              id: member.id,
              name: member.name,
              ...(member.id === project.leadUserId
                ? { detail: t('projectMembers.role.lead') }
                : {}),
            }))}
            {...(canEdit
              ? {
                  manageHref: `/projects/${encodeURIComponent(project.id)}/members`,
                }
              : {})}
            link={RouterLink}
            labels={labels}
          />
        </>
      }
    />
  );
}
