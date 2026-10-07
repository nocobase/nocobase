/**
 * A signed-in user acting through the browser API, with what they may do. Every user-facing service method takes one;
 * the domain rules (who may see a project, who may close an issue) live with their domains and read it through the
 * helpers below.
 */
import {
  businessKey,
  settingsKey,
  type Business,
  type BusinessAction,
  type Permissions,
  type Scope,
  type SettingsAction,
  type SettingsItem,
} from '../../shared/access.js';
import type { Actor } from '../kernel/actor.js';
import { forbidden } from '../kernel/errors.js';

export interface Viewer {
  readonly userId: string;
  /** The same user as an actor, for the activity log and events. */
  readonly actor: Actor;
  readonly permissions: Permissions;
  /**
   * The projects a scoped API key is limited to (`keyScope.objects('pm.projects')`); undefined when every project is in
   * reach. A limited viewer sees no other project, no issue outside these projects and none without a project.
   */
  readonly projectIds?: readonly string[];
}

/** Whether a project, or no project (null), is within the viewer's key scope. */
export function inProjectScope(
  viewer: Pick<Viewer, 'projectIds'>,
  projectId: string | null,
): boolean {
  if (!viewer.projectIds) return true;
  return projectId !== null && viewer.projectIds.includes(projectId);
}

export function scopeOf<B extends Business>(
  viewer: Viewer,
  business: B,
  action: BusinessAction<B>,
): Scope {
  return viewer.permissions.scopes[businessKey(business, action)];
}

/** 403 unless the viewer holds the action at some scope. */
export function requireAction<B extends Business>(
  viewer: Viewer,
  business: B,
  action: BusinessAction<B>,
  message: string,
): void {
  if (scopeOf(viewer, business, action) === 'none') throw forbidden(message);
}

export function canUseSetting<S extends SettingsItem>(
  viewer: Viewer,
  item: S,
  action: SettingsAction<S>,
): boolean {
  return viewer.permissions.settings[settingsKey(item, action)];
}

/** 403 unless the viewer holds the settings capability. */
export function requireSetting<S extends SettingsItem>(
  viewer: Viewer,
  item: S,
  action: SettingsAction<S>,
  message: string,
): void {
  if (!canUseSetting(viewer, item, action)) throw forbidden(message);
}
