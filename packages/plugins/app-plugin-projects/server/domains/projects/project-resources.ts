/**
 * The working directories of a project, in their order: git repositories, and directories that already exist on one
 * runner. Each may carry an initialization prompt.
 */
import {
  isAbsoluteDirectory,
  RESOURCE_INIT_PROMPT_MAX,
  type CreateProjectResourceRequest,
  type ProjectResource,
  type ProjectResourceBinding,
  type UpdateProjectResourceRequest,
} from '../../../shared/projects.js';
import type { Viewer } from '../../access/viewer.js';
import { canManage, relationTo } from './project.access.js';
import { invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';
import { optionalText } from '../../kernel/validate.js';
import { managed } from './project.access.js';
import {
  deleteResource,
  findResource,
  findResourceById,
  insertResource,
  nextResourcePosition,
  updateResource,
} from './project.store.js';

/** What a viewer may do with a project: see it, and manage it (its settings, members and working directories). */
export interface ProjectAccessInfo {
  readonly projectId: string;
  readonly visible: boolean;
  readonly manage: boolean;
}

export interface ProjectResources {
  /**
   * What `viewer` may do with a project, or with the project a working directory belongs to; null when it does not
   * exist. For plugins that keep settings of a project or of one of its working directories (variables, skills).
   */
  accessTo(
    viewer: Viewer,
    target: { readonly projectId: string } | { readonly resourceId: string },
  ): Promise<ProjectAccessInfo | null>;
  addResource(
    viewer: Viewer,
    projectId: string,
    input: CreateProjectResourceRequest,
  ): Promise<ProjectResource>;
  updateResource(
    viewer: Viewer,
    projectId: string,
    resourceId: string,
    patch: UpdateProjectResourceRequest,
  ): Promise<ProjectResource>;
  removeResource(
    viewer: Viewer,
    projectId: string,
    resourceId: string,
  ): Promise<void>;
}

const REMOTE_URL = /^(https?:\/\/|ssh:\/\/|git@|file:\/\/)\S+$/u;

function validUrl(value: unknown): string {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url || url.length > 2000 || !REMOTE_URL.test(url))
    throw invalid(
      'INVALID_URL',
      'url must be a git remote (https://, ssh://, git@ or file://).',
    );
  return url;
}

function validRunner(value: unknown): string {
  const runnerId = typeof value === 'string' ? value.trim() : '';
  if (!runnerId || runnerId.length > 64)
    throw invalid('INVALID_RUNNER', 'runnerId is required for a directory.');
  return runnerId;
}

function validPath(value: unknown): string {
  const path = typeof value === 'string' ? value.trim() : '';
  if (!isAbsoluteDirectory(path))
    throw invalid('INVALID_PATH', 'path must be an absolute directory path.');
  return path;
}

const BINDING_FIELDS = [
  ['provider', 32],
  ['connectionId', 64],
  ['repoId', 64],
  ['fullName', 255],
] as const;

/** A repository's binding to its host: four short strings, stored as given; null unlinks it. */
function bindingOf(value: unknown): ProjectResourceBinding | null {
  if (value === null) return null;
  const record =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  const fields = BINDING_FIELDS.map(([key, max]) => {
    const field = record?.[key];
    return typeof field === 'string' &&
      field.trim() !== '' &&
      field.trim().length <= max
      ? field.trim()
      : null;
  });
  if (!record || fields.some((field) => field === null))
    throw invalid(
      'INVALID_BINDING',
      'binding is null or { provider, connectionId, repoId, fullName }, each a short string.',
    );
  const [provider, connectionId, repoId, fullName] = fields as string[];
  return {
    provider: provider,
    connectionId: connectionId,
    repoId: repoId,
    fullName: fullName,
  };
}

function initPromptOf(value: unknown): string | null {
  const text = optionalText(value, 'initPrompt', RESOURCE_INIT_PROMPT_MAX);
  return text?.trim() ? text.trim() : null;
}

export function createProjectResources(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
}): ProjectResources {
  return {
    accessTo: async (viewer, target) => {
      const conn = deps.tx.read();
      const projectId =
        'projectId' in target
          ? target.projectId
          : (await findResourceById(conn, target.resourceId))?.projectId;
      if (!projectId) return null;
      const relation = await relationTo(conn, viewer, projectId);
      if (!relation) return null;
      return {
        projectId,
        visible: relation.visible,
        manage: relation.visible && canManage(viewer, relation),
      };
    },

    addResource: (viewer, projectId, input) =>
      managed(deps.tx, viewer, projectId, async (tx) => {
        if (input.type !== 'gitRepo' && input.type !== 'directory')
          throw invalid(
            'INVALID_RESOURCE',
            'type must be gitRepo or directory.',
          );
        const git = input.type === 'gitRepo';
        const resource: ProjectResource = {
          id: deps.ids.next(),
          projectId,
          type: input.type,
          url: git ? validUrl(input.url) : null,
          defaultRef: git
            ? optionalText(input.defaultRef, 'defaultRef', 255)
            : null,
          binding:
            git && input.binding !== undefined
              ? bindingOf(input.binding)
              : null,
          runnerId: git ? null : validRunner(input.runnerId),
          path: git ? null : validPath(input.path),
          label: optionalText(input.label, 'label', 255),
          initPrompt: initPromptOf(input.initPrompt),
          position: await nextResourcePosition(tx.conn, projectId),
        };
        await insertResource(tx.conn, resource);
        return resource;
      }),

    updateResource: (viewer, projectId, resourceId, patch) =>
      managed(deps.tx, viewer, projectId, async (tx) => {
        const existing = await findResource(tx.conn, projectId, resourceId);
        if (!existing) throw notFound('Resource');
        if (patch.position !== undefined && !Number.isInteger(patch.position))
          throw invalid('INVALID_POSITION', 'position must be an integer.');
        const git = existing.type === 'gitRepo';
        if (
          git
            ? patch.runnerId !== undefined || patch.path !== undefined
            : patch.url !== undefined ||
              patch.defaultRef !== undefined ||
              patch.binding !== undefined
        )
          throw invalid(
            'INVALID_RESOURCE',
            git
              ? 'A git repository has no runner or path.'
              : 'A directory has no url, default branch or binding.',
          );
        await updateResource(tx.conn, resourceId, {
          ...(patch.url === undefined ? {} : { url: validUrl(patch.url) }),
          ...(patch.defaultRef === undefined
            ? {}
            : {
                defaultRef: optionalText(patch.defaultRef, 'defaultRef', 255),
              }),
          ...(patch.binding === undefined
            ? {}
            : { binding: bindingOf(patch.binding) }),
          ...(patch.runnerId === undefined
            ? {}
            : { runnerId: validRunner(patch.runnerId) }),
          ...(patch.path === undefined ? {} : { path: validPath(patch.path) }),
          ...(patch.label === undefined
            ? {}
            : { label: optionalText(patch.label, 'label', 255) }),
          ...(patch.initPrompt === undefined
            ? {}
            : { initPrompt: initPromptOf(patch.initPrompt) }),
          ...(patch.position === undefined ? {} : { position: patch.position }),
        });
        return (await findResource(
          tx.conn,
          projectId,
          resourceId,
        )) as ProjectResource;
      }),

    removeResource: (viewer, projectId, resourceId) =>
      managed(deps.tx, viewer, projectId, async (tx) => {
        if (!(await findResource(tx.conn, projectId, resourceId)))
          throw notFound('Resource');
        await deleteResource(tx.conn, resourceId);
      }),
  };
}
