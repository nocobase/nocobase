/**
 * The headless parts of a project's page, for an application that composes `/projects/:projectId` itself (for example, from
 * the UI Library's `project-detail` block and `property-fields`): the project with its statuses, the workspace's
 * members and the project's workflow, every change the page makes (properties, description, members and visibility,
 * working directories, deleting), and the numbers, tones and permission helpers it shows. The plugin keeps these
 * stable; the page built on them is the application's. The project list and "New project" stay the plugin's
 * (`client/pages.ts`, `projectsRoute`); the application routes a project's page as that route's child.
 */
export {
  useDeleteProject,
  useProjectDetail,
  useProjectMembership,
  useProjectResources,
  useProjectStatuses,
  useProjectUpdate,
  useProjectWorkflow,
  useResourceValidation,
  useWorkspaceMembers,
  type ProjectMembership,
  type ProjectResources,
  type ProjectUpdate,
  type ProjectWorkflow,
  type ResourceInput,
  type ResourceInputErrors,
} from './pages/projects/detail/use-project-page.js';
export {
  isProjectStatus,
  progressFromCounts,
  projectNumbers,
  projectStatusSuffix,
  projectStatusTone,
  type ProjectNumbers,
  type ProjectProgress,
} from './pages/projects/progress.js';
export {
  canCreateIssues,
  canDeleteProjects,
  canManageProject,
} from './lib/permissions.js';
