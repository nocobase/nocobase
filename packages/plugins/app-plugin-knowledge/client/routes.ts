import {
  defineAppRoutes,
  type AppClientAppRoutesContribution,
  type AppClientRoutePageDefinition,
} from '@nocobase/app-client/plugins';
import { BookOpen } from 'lucide-react';
import { createElement, type ComponentType } from 'react';

import type { Page } from '../shared/access.js';
import { DEFAULT_SPACE, type SpaceRef } from '../shared/knowledge.js';

export interface KnowledgeRouteOptions {
  /** App-relative path of the knowledge page. Defaults to `/knowledge`. */
  readonly path?: string;
  /** The space the page shows, with what it inherits. Defaults to `DEFAULT_SPACE`. */
  readonly space?: SpaceRef;
}

const page = (id: Page) =>
  ({ resource: { type: 'page', id }, action: 'access' }) as const;

/** The knowledge page, behind the `knowledge` page grant. */
export function knowledgeDefinition(
  options: KnowledgeRouteOptions = {},
): AppClientRoutePageDefinition {
  const space = options.space ?? DEFAULT_SPACE;
  return {
    name: 'knowledge',
    path: normalizePath(options.path ?? '/knowledge'),
    auth: 'required',
    authz: page('knowledge'),
    navigation: { title: 'ui.nav.knowledge', icon: BookOpen },
    componentLoader: async () => {
      const { KnowledgePage } = await import('./pages.js');
      const Page: ComponentType = () => createElement(KnowledgePage, { space });
      return { default: Page };
    },
  };
}

/** The plugin's page at the given path. */
export function createKnowledgeRoutes(
  options: KnowledgeRouteOptions = {},
): AppClientAppRoutesContribution {
  return defineAppRoutes([knowledgeDefinition(options)]);
}

function normalizePath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed)
    throw new TypeError('A knowledge route path must contain a path segment');
  return `/${trimmed}`;
}

const routes: AppClientAppRoutesContribution = createKnowledgeRoutes();

export default routes;
