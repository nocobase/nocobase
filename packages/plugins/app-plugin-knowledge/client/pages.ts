/**
 * The page and its parts, for an application that routes the page itself (`knowledge({ routes: false })`) or composes
 * the knowledge view into pages of its own (a project's Knowledge tab, an inbox): the route definition with its page
 * grant, and the components bound to this plugin's namespace.
 */
import { withNamespace } from '@nocobase/i18n/client';
import type { ComponentType } from 'react';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import {
  KnowledgeView as View,
  type KnowledgeViewProps,
} from './components/knowledge-view.js';
import { KnowledgeMarkdown as Markdown } from './components/markdown.js';
import {
  ProposalActions as Actions,
  ProposalBody as Body,
  ProposalKindBadge as KindBadge,
} from './components/proposal-view.js';
import {
  KnowledgePage as Page,
  type KnowledgePageProps,
} from './pages/knowledge-page.js';

export { knowledgeDefinition } from './routes.js';
export type {
  KnowledgeViewLabels,
  KnowledgeViewProps,
} from './components/knowledge-view.js';
export type { KnowledgePageProps } from './pages/knowledge-page.js';
export type {
  KnowledgeAccessCell,
  KnowledgeAccessDetails,
  KnowledgeAccessReach,
  KnowledgeAccessRow,
} from './lib/access.js';

export const KnowledgePage: ComponentType<KnowledgePageProps> = withNamespace(
  ACCESS_NAMESPACE,
  Page,
);
export const KnowledgeView: ComponentType<KnowledgeViewProps> = withNamespace(
  ACCESS_NAMESPACE,
  View,
);
export const ProposalBody: ComponentType<Parameters<typeof Body>[0]> =
  withNamespace(ACCESS_NAMESPACE, Body);
export const ProposalActions: ComponentType<Parameters<typeof Actions>[0]> =
  withNamespace(ACCESS_NAMESPACE, Actions);
export const ProposalKindBadge: ComponentType<Parameters<typeof KindBadge>[0]> =
  withNamespace(ACCESS_NAMESPACE, KindBadge);
export const KnowledgeMarkdown: ComponentType<Parameters<typeof Markdown>[0]> =
  withNamespace(ACCESS_NAMESPACE, Markdown);
