/**
 * The wording of the UI Library items on a project's page: the projects plugin's own translations (its namespace),
 * with i18next's `{{name}}` placeholders turned into the items' `{name}` ones, and Studio's for what is Studio's (the
 * tabs, the Releases tab).
 */
import { ACCESS_NAMESPACE as PROJECTS_NS } from '@nocobase/app-plugin-projects/shared/access';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import type { PropertyFieldLabels } from '@/components/property-fields';
import type { RichTextLabels } from '@/components/rich-text-editor';
import type { ProjectDetailLabels } from '@/extensions/nocobase-project-detail/labels';

import { keep, type Translate } from '../../issues/detail/labels.js';

export interface ProjectPageWording {
  /** The projects plugin's `t`. */
  readonly t: Translate;
  /** Studio's `t`. */
  readonly studio: Translate;
  readonly detail: ProjectDetailLabels;
  readonly fields: PropertyFieldLabels;
  readonly richText: RichTextLabels;
}

export function useProjectPageWording(): ProjectPageWording {
  const { t } = useTranslation(PROJECTS_NS);
  const { t: studio } = useTranslation();
  return useMemo(
    () => ({
      t,
      studio,
      fields: {
        saving: t('common.saving'),
        createNamed: t('common.createNamed', keep('name')),
        noOptions: t('common.noOptions'),
      },
      richText: {
        mentionList: t('richText.mentionList'),
        noMatches: t('richText.noMatches'),
        toolbar: t('richText.toolbar'),
        uploading: t('common.saving'),
        tools: {
          bold: t('richText.tools.bold'),
          italic: t('richText.tools.italic'),
          strike: t('richText.tools.strike'),
          code: t('richText.tools.code'),
          bulletList: t('richText.tools.bulletList'),
          orderedList: t('richText.tools.orderedList'),
          quote: t('richText.tools.quote'),
        },
      },
      detail: {
        header: {
          lead: t('projects.columns.lead'),
          noLead: t('projects.noLead'),
          private: t('projects.visibility.members'),
          workflow: t('projects.workflow'),
        },
        deletion: {
          more: t('projectMore.label'),
          delete: t('projectMore.delete'),
          title: t('projectMore.deleteTitle', keep('name')),
          description: t('projectMore.deleteDescription'),
          cancel: t('actions.cancel'),
        },
        overview: {
          numbers: t('projectPage.numbers'),
          distribution: t('projectPage.distribution'),
          noIssues: t('projectPage.noIssues'),
          description: t('projects.descriptionLabel'),
          noDescription: t('projects.noDescription'),
          descriptionHint: t('projectForm.descriptionHint'),
          editDescription: t('projects.editDescription'),
          descriptionPlaceholder: t('projectForm.descriptionPlaceholder'),
          save: t('common.save'),
          cancel: t('actions.cancel'),
          members: t('projectMembers.title'),
          noMembers: t('projectMembers.empty'),
          memberCount: studio('projectPage.memberCount', keep('count')),
          manageMembers: studio('projectPage.manageMembers'),
        },
        resources: {
          title: t('resources.title'),
          description: studio('projectPage.resourcesDescription'),
          add: t('resources.add'),
          empty: studio('projectPage.resources.emptyTitle'),
          emptyDescription: studio('projectPage.resources.emptyDescription'),
          primary: t('resources.primary'),
          gitRepo: t('resources.types.gitRepo'),
          directory: t('resources.types.directory'),
          actions: studio('projectPage.resources.actions', keep('name')),
          settings: studio('projectPage.resources.settings'),
          moveUp: studio('projectPage.resources.moveUp'),
          moveDown: studio('projectPage.resources.moveDown'),
          remove: studio('projectPage.resources.remove'),
          removeTitle: studio(
            'projectPage.resources.removeTitle',
            keep('name'),
          ),
          removeDescription: studio('projectPage.resources.removeDescription'),
          cancel: studio('projectPage.resources.cancel'),
        },
        resourceForm: {
          newTitle: t('resources.newTitle'),
          newDescription: t('resources.newDescription'),
          editTitle: t('resourceEdit.title'),
          editDirectoryTitle: t('resourceEdit.titleDirectory'),
          type: t('resources.type'),
          url: t('resources.url'),
          urlHint: t('resources.urlHint'),
          defaultRef: t('resources.defaultRef'),
          defaultRefHint: t('resources.defaultRefHint'),
          runner: t('resources.runner'),
          runnerHint: t('resources.runnerHint'),
          runnerPlaceholder: t('resources.runnerPlaceholder'),
          runnerIdPlaceholder: t('resources.runnerIdPlaceholder'),
          noRunners: t('resources.noRunners'),
          loading: t('common.loading'),
          path: t('resources.path'),
          pathHint: t('resources.pathHint'),
          label: t('resources.label'),
          initPrompt: t('resources.initPrompt'),
          initPromptPlaceholder: t('resources.initPromptPlaceholder'),
          initPromptHint: t('resources.initPromptHint'),
          requestFailed: t('common.requestFailed'),
          cancel: t('actions.cancel'),
          save: t('common.save'),
          saving: t('common.saving'),
          add: t('resources.addSubmit'),
          adding: t('resources.adding'),
        },
        members: {
          title: t('projectMembers.title'),
          visibility: t('projects.visibilityLabel'),
          everyone: t('projects.visibility.everyone'),
          membersOnly: t('projects.visibility.members'),
          everyoneHint: t('projects.visibilityHint.everyone'),
          membersOnlyHint: t('projects.visibilityHint.members'),
          empty: t('projectMembers.empty'),
          lead: t('projectMembers.role.lead'),
          actions: t('projectMembers.actions', keep('name')),
          setLead: t('projectMembers.setLead'),
          removeAction: t('projectMembers.removeAction'),
          removeTitle: t('projectMembers.removeTitle', keep('name')),
          removeDescription: t(
            'projectMembers.removeDescription',
            keep('name'),
          ),
          cancel: t('actions.cancel'),
          choose: t('projectMembers.choose'),
          noMatches: t('projectMembers.noMatches'),
        },
        unreleased: {
          title: studio('deploys.unreleased.title'),
          description: studio('deploys.unreleased.description'),
          empty: studio('deploys.unreleased.empty'),
          staging: studio('deploys.unreleased.staging'),
          loadFailed: studio('deploys.unreleased.loadFailed'),
        },
        previews: {
          title: studio('projectPage.previews.title'),
          description: studio('projectPage.previews.description'),
          empty: studio('projectPage.previews.empty'),
          loadFailed: studio('projectPage.previews.loadFailed'),
          open: studio('projectPage.previews.open', keep('identifier')),
        },
      },
    }),
    [t, studio],
  );
}
