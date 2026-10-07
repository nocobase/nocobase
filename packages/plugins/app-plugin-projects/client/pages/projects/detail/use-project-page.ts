/**
 * The headless parts of a project's page, for the application that presents it (for example, with the UI Library's
 * `project-detail` block): the project with its statuses, the workspace's members and the workflows, and every change
 * the page makes — its properties and description, its members and visibility, its working directories, deleting it.
 * Each change refreshes the project and the list and reports what failed as a toast; the returned promise then
 * rejects, so a presenter can keep its draft or dialog open.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { ACCESS_NAMESPACE } from '../../../../shared/access.js';
import type { StatusDefinition } from '../../../../shared/issues.js';
import type { Member } from '../../../../shared/members.js';
import {
  isAbsoluteDirectory,
  RESOURCE_INIT_PROMPT_MAX,
  type ProjectDetail,
  type ProjectResource,
  type ProjectResourceBinding,
  type ProjectResourceType,
  type ProjectVisibility,
  type UpdateProjectRequest,
} from '../../../../shared/projects.js';
import type { WorkflowListItem } from '../../../../shared/workflows.js';
import { pmKeys } from '../../../api/keys.js';
import { errorText, useNotify } from '../../../hooks/use-notify.js';
import { usePmApi } from '../../../hooks/use-pm-api.js';
import { workflowName } from '../../config/workflows/workflow-model.js';
import {
  isGitRepoUrl,
  reorderResources,
  sortResources,
} from './resource-rules.js';

/** One project. */
export function useProjectDetail(
  projectId: string,
): UseQueryResult<ProjectDetail> {
  const api = usePmApi();
  return useQuery({
    queryKey: pmKeys.project(projectId),
    queryFn: () => api.project(projectId),
  });
}

/** The statuses of the project's workflow, once `enabled` (the project has loaded). */
export function useProjectStatuses(
  projectId: string,
  enabled = true,
): UseQueryResult<StatusDefinition[]> {
  const api = usePmApi();
  return useQuery({
    queryKey: pmKeys.statuses(projectId),
    queryFn: () => api.statuses(projectId),
    enabled,
  });
}

/** Everyone in the workspace, for the lead and member pickers. */
export function useWorkspaceMembers(): UseQueryResult<Member[]> {
  const api = usePmApi();
  return useQuery({ queryKey: pmKeys.members, queryFn: () => api.members() });
}

export interface ProjectWorkflow {
  /** The workflow's name for the header: the default workflow's for a project without one, else the built-in statuses'; null until known. */
  readonly name: string | null;
  /** The workflow select's options, the default one marked. */
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  /** The option shown as chosen: the default workflow for a project without one. */
  readonly value: string | null;
  /** While no workflow is the default, the empty choice is the built-in statuses. */
  readonly noneLabel?: string;
  /** Until the workflows have loaded. */
  readonly loading: boolean;
  /** The `workflowId` to save for a chosen option, or undefined when nothing changes. Choosing the default by name is the same as choosing none. */
  readonly toWorkflowId: (option: string | null) => string | null | undefined;
}

/**
 * The project's workflow. `null` is the default workflow, and stays so when another one becomes the default; while no
 * workflow is the default, it is the built-in statuses.
 */
export function useProjectWorkflow(
  project: Pick<ProjectDetail, 'workflowId'>,
): ProjectWorkflow {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const workflows = useQuery<WorkflowListItem[]>({
    queryKey: pmKeys.workflows,
    queryFn: () => api.workflows(),
  });
  const { workflowId } = project;
  return useMemo(() => {
    const list = workflows.data;
    const defaultId = list?.find((item) => item.isDefault)?.id ?? null;
    const current = list?.find((item) =>
      workflowId === null ? item.isDefault : item.id === workflowId,
    );
    const builtIn = workflowId === null && list !== undefined && !defaultId;
    return {
      name: current
        ? workflowName(t, current)
        : builtIn
          ? t('workflows.builtInStatuses')
          : null,
      options: (list ?? []).map((item) => ({
        value: item.id,
        label: item.isDefault
          ? t('workflows.defaultOption', { name: workflowName(t, item) })
          : workflowName(t, item),
      })),
      value: workflowId ?? defaultId,
      ...(list && defaultId === null
        ? { noneLabel: t('workflows.builtInStatuses') }
        : {}),
      loading: !list,
      toWorkflowId: (option) => {
        const chosen = option === defaultId ? null : option;
        return chosen === workflowId ? undefined : chosen;
      },
    };
  }, [workflows.data, workflowId, t]);
}

/** A write against one project that reloads the project and the list, and reports a failure (then rejects). */
function useProjectWrite<Variables>(
  write: (variables: Variables) => Promise<unknown>,
  successTitle?: string,
): {
  readonly run: (variables: Variables) => Promise<void>;
  readonly isPending: boolean;
} {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: write,
    onSuccess: () => {
      if (successTitle) notify.success(successTitle);
    },
    onError: (error: unknown) => notify.error(error),
    // The list key prefixes the project key, so this reloads the list and the project together.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: pmKeys.projects }),
  });
  const { mutateAsync } = mutation;
  const run = useCallback(
    async (variables: Variables) => {
      await mutateAsync(variables);
    },
    [mutateAsync],
  );
  return { run, isPending: mutation.isPending };
}

export interface ProjectUpdate {
  /** Saves the changes; another workflow also reloads the statuses. Rejects when it fails. */
  readonly update: (changes: UpdateProjectRequest) => Promise<void>;
  readonly isPending: boolean;
}

/** Changes to the project's own fields: status, priority, lead, workflow, dates, description, visibility. */
export function useProjectUpdate(projectId: string): ProjectUpdate {
  const api = usePmApi();
  const queryClient = useQueryClient();
  const { run, isPending } = useProjectWrite(
    async (changes: UpdateProjectRequest) => {
      await api.updateProject(projectId, changes);
      // Another workflow: the project's statuses change.
      if (changes.workflowId !== undefined)
        await queryClient.invalidateQueries({ queryKey: ['pm', 'statuses'] });
    },
  );
  return { update: run, isPending };
}

export interface ProjectMembership {
  readonly setVisibility: (visibility: ProjectVisibility) => Promise<void>;
  readonly add: (userId: string) => Promise<void>;
  /** Makes a member the project's lead. */
  readonly setLead: (userId: string) => Promise<void>;
  /** Refused for the lead until another lead is chosen. */
  readonly remove: (userId: string) => Promise<void>;
  readonly isPending: boolean;
}

/**
 * The project's members, its lead among them, and visibility. `members` visibility hides the project and its issues from everyone but its
 * members and those who may see every project; the server enforces it.
 */
export function useProjectMembership(projectId: string): ProjectMembership {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const visibility = useProjectWrite((value: ProjectVisibility) =>
    api.updateProject(projectId, { visibility: value }),
  );
  const add = useProjectWrite((userId: string) =>
    api.addProjectMember(projectId, userId),
  );
  const lead = useProjectWrite(
    (userId: string) => api.updateProject(projectId, { leadUserId: userId }),
    t('projectMembers.leadSet'),
  );
  const remove = useProjectWrite(
    (userId: string) => api.removeProjectMember(projectId, userId),
    t('projectMembers.removed'),
  );
  return {
    setVisibility: visibility.run,
    add: add.run,
    setLead: lead.run,
    remove: remove.run,
    isPending:
      visibility.isPending ||
      add.isPending ||
      lead.isPending ||
      remove.isPending,
  };
}

/** What the working directory form holds, each as typed. */
export interface ResourceInput {
  readonly type: ProjectResourceType;
  readonly url: string;
  readonly defaultRef: string;
  /** A repository's binding to its host, as the application's picker chose it; left out keeps what is stored. */
  readonly binding?: ProjectResourceBinding | null;
  readonly runnerId: string;
  readonly path: string;
  readonly label: string;
  readonly initPrompt: string;
}

export type ResourceInputErrors = Partial<
  Record<'url' | 'runnerId' | 'path' | 'initPrompt', string>
>;

/** Checks the working directory form, answering each problem in this plugin's words. */
export function useResourceValidation(): (
  input: ResourceInput,
) => ResourceInputErrors {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useCallback(
    (input) => {
      const found: ResourceInputErrors = {};
      if (input.type === 'gitRepo') {
        if (!isGitRepoUrl(input.url))
          found.url = input.url.trim()
            ? t('resources.urlInvalid')
            : t('resources.urlRequired');
      } else {
        if (!input.runnerId.trim())
          found.runnerId = t('resources.runnerRequired');
        if (!isAbsoluteDirectory(input.path))
          found.path = input.path.trim()
            ? t('resources.pathInvalid')
            : t('resources.pathRequired');
      }
      if (input.initPrompt.length > RESOURCE_INIT_PROMPT_MAX)
        found.initPrompt = t('resources.initPromptTooLong');
      return found;
    },
    [t],
  );
}

export interface ProjectResources {
  /** In order: the first is the primary one, where work starts. */
  readonly sorted: readonly ProjectResource[];
  readonly remove: (resourceId: string) => Promise<void>;
  /** Moves the one at list position `from` to `to`. */
  readonly move: (from: number, to: number) => Promise<void>;
  /**
   * Adds a working directory (`existing` null) or saves one; empty fields are saved as none. Rejects with an `Error`
   * whose message says what failed, in this plugin's words, for the form to show.
   */
  readonly save: (
    input: ResourceInput,
    existing: ProjectResource | null,
  ) => Promise<void>;
  readonly isPending: boolean;
}

/** The project's working directories: git repositories and directories on a runner, in order. */
export function useProjectResources(
  projectId: string,
  resources: readonly ProjectResource[],
): ProjectResources {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const remove = useProjectWrite(
    (resourceId: string) => api.deleteProjectResource(projectId, resourceId),
    t('resources.removed'),
  );
  const move = useProjectWrite(
    async (change: { readonly from: number; readonly to: number }) => {
      for (const next of reorderResources(resources, change.from, change.to))
        await api.updateProjectResource(projectId, next.id, {
          position: next.position,
        });
    },
  );
  const save = useCallback(
    async (input: ResourceInput, existing: ProjectResource | null) => {
      const common = {
        label: input.label.trim() || null,
        initPrompt: input.initPrompt.trim() || null,
      };
      try {
        if (input.type === 'gitRepo') {
          const values = {
            ...common,
            url: input.url.trim(),
            defaultRef: input.defaultRef.trim() || null,
            ...(input.binding === undefined ? {} : { binding: input.binding }),
          };
          if (existing)
            await api.updateProjectResource(projectId, existing.id, values);
          else
            await api.addProjectResource(projectId, {
              type: 'gitRepo',
              ...values,
            });
        } else {
          const values = {
            ...common,
            runnerId: input.runnerId.trim(),
            path: input.path.trim(),
          };
          if (existing)
            await api.updateProjectResource(projectId, existing.id, values);
          else
            await api.addProjectResource(projectId, {
              type: 'directory',
              ...values,
            });
        }
      } catch (error) {
        throw new Error(errorText(t, error, t('common.requestFailed')), {
          cause: error,
        });
      }
      notify.success(existing ? t('resourceEdit.saved') : t('resources.added'));
      void queryClient.invalidateQueries({ queryKey: pmKeys.projects });
    },
    [api, notify, projectId, queryClient, t],
  );
  return {
    sorted: sortResources(resources),
    remove: remove.run,
    move: (from, to) => move.run({ from, to }),
    save,
    isPending: remove.isPending || move.isPending,
  };
}

/** Deletes the project; its issues stay and leave it. Reloads the projects and issues, and rejects when it fails. */
export function useDeleteProject(
  project: Pick<ProjectDetail, 'id' | 'name'>,
): () => Promise<void> {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    mutationFn: () => api.deleteProject(project.id),
    onSuccess: () => {
      notify.success(t('projectMore.deleted', { name: project.name }));
      void queryClient.invalidateQueries({ queryKey: pmKeys.projects });
      void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
    },
    onError: (error: unknown) => notify.error(error),
  });
  return useCallback(async () => {
    await mutateAsync();
  }, [mutateAsync]);
}
