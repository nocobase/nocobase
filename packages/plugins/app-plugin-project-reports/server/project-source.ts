/** The only report module aware of Projects' stored activity schema. It never writes project data. */
import type { Projects, ProjectsAccess, Viewer } from '@nocobase/app-plugin-projects/server/tokens';
import type { ProjectDetail, ProjectListItem } from '@nocobase/app-plugin-projects/shared/projects';
import { reaches } from '@nocobase/app-plugin-projects/shared/access';
import type { IssueEvent, IssueMetrics, ReportRepository } from '../shared/reports.js';
import { safeRemote } from '../runner/collector.js';
import { reportError } from './errors.js';
import { iso, json } from './store.js';

export function manages(viewer: Viewer, project: Pick<ProjectListItem, 'leadUserId'>): boolean {
  return reaches(viewer.permissions.scopes['pm.projects/manage'], project.leadUserId);
}
export function readsIssues(viewer: Viewer, project: ProjectDetail): boolean {
  const scope = viewer.permissions.scopes['pm.issues/view'];
  if (scope === 'none') return false;
  if (scope === 'all') return true;
  return scope.users.length > 0 && (project.visibility === 'everyone' || reaches(scope, project.leadUserId, ...project.members.map((member) => member.id)));
}

export async function viewerForUser(access: ProjectsAccess, userId: string): Promise<Viewer> {
  if (!access.permissionsOfUser) throw reportError('FAILED_PRECONDITION', 'REPORT_ACCESS_UNAVAILABLE', 'Background reporting needs the Projects user permission source.');
  return { userId, actor: { type: 'user', id: userId }, permissions: await access.permissionsOfUser(userId) };
}
export async function readableProject(projects: Projects, viewer: Viewer, projectId: string): Promise<ProjectDetail> {
  const project = await projects.projects.get(viewer, projectId);
  if (!readsIssues(viewer, project)) throw reportError('PERMISSION_DENIED', 'REPORT_PROJECT_FORBIDDEN', 'Reading a project report also requires access to its issues.');
  return project;
}
export function repositoriesOf(project: ProjectDetail): ReportRepository[] {
  const result: ReportRepository[] = [];
  const seen = new Set<string>();
  for (const resource of project.resources) {
    if (resource.type !== 'gitRepo') continue;
    if (!resource.url || !safeRemote(resource.url)) throw reportError('FAILED_PRECONDITION', 'REPORT_REPOSITORY_INVALID', 'Reports need an HTTPS or SSH repository URL without embedded credentials.');
    const key = `${resource.url.replace(/\.git$/u, '')}\n${resource.defaultRef ?? 'HEAD'}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ resourceId: resource.id, url: resource.url, ref: resource.defaultRef });
  }
  if (result.length > 20) throw reportError('FAILED_PRECONDITION', 'REPORT_REPOSITORY_LIMIT', 'A report supports up to twenty distinct project repositories.');
  return result;
}

/** Counts unique issues per event, not updatedAt or today's final status. */
export function summarizeIssueEvents(events: readonly IssueEvent[]): IssueMetrics {
  const byEvent = { created: new Set<string>(), completed: new Set<string>(), cancelled: new Set<string>(), reopened: new Set<string>() };
  for (const event of events) byEvent[event.event].add(event.id);
  return { created: byEvent.created.size, completed: byEvent.completed.size, cancelled: byEvent.cancelled.size, reopened: byEvent.reopened.size };
}

export async function projectActivity(projects: Projects, viewer: Viewer, projectId: string, window: { start: string; end: string }): Promise<{ issues: IssueMetrics; issueEvents: IssueEvent[]; issueEventsTruncated: boolean }> {
  await readableProject(projects, viewer, projectId);
  const conn = projects.tx.read();
  const from = new Date(window.start);
  const to = new Date(window.end);
  const created = await conn.query.selectFrom('pmIssues').select(['id', 'identifier', 'title', 'createdAt']).where('projectId', '=', projectId).where('createdAt', '>=', from).where('createdAt', '<', to).where('deletedAt', 'is', null).limit(100_001).execute();
  const moves = await conn.query.selectFrom('pmActivities as activity').innerJoin('pmIssues as issue', 'issue.id', 'activity.issueId').select(['issue.id', 'issue.identifier', 'issue.title', 'activity.details', 'activity.createdAt']).where('issue.projectId', '=', projectId).where('issue.deletedAt', 'is', null).where('activity.action', '=', 'status_changed').where('activity.createdAt', '>=', from).where('activity.createdAt', '<', to).limit(100_001).execute();
  if (created.length > 100_000 || moves.length > 100_000) throw reportError('FAILED_PRECONDITION', 'REPORT_ACTIVITY_LIMIT', 'The daily activity budget was exceeded; no truncated task counts were published.');
  const events: IssueEvent[] = created.map((row) => ({ id: String(row.id), identifier: String(row.identifier), title: String(row.title).slice(0, 1000), event: 'created', at: iso(row.createdAt) }));
  for (const row of moves) {
    const details = json(row.details);
    if (!details || typeof details !== 'object' || !('from' in details) || !('to' in details)) continue;
    const previous = String(details.from);
    const next = String(details.to);
    const event = next === 'done' && previous !== 'done' ? 'completed' : next === 'cancelled' && previous !== 'cancelled' ? 'cancelled' : ['done', 'cancelled'].includes(previous) && !['done', 'cancelled'].includes(next) ? 'reopened' : null;
    if (event) events.push({ id: String(row.id), identifier: String(row.identifier), title: String(row.title).slice(0, 1000), event, at: iso(row.createdAt) });
  }
  events.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
  return { issues: summarizeIssueEvents(events), issueEvents: events.slice(0, 1000), issueEventsTruncated: events.length > 1000 };
}
