/**
 * Plans in words, shared by the card, the editor and the confirmation: the tones of statuses and risk flags, what a
 * row is about, where a plan comes from, a row's error, and a plan's title and description as the reader sees them.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type Context,
} from 'react';

import { ACCESS_NAMESPACE } from '../../../shared/access.js';
import type { Plan, PlanObjectRef } from '../../../shared/plans.js';
import { errorText } from '../../hooks/use-notify.js';
import {
  createdTitle,
  planObjectLabel as objectLabel,
  refOf,
  type RowView,
} from './model.js';

export { FLAG_TONE, PLAN_STATUS_TONE, type PlanTone } from './tones.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** An issue target as words: an earlier row by its title, the checked target, or the id as written. */
export function targetLabel(
  value: unknown,
  views: readonly RowView[],
  t: Translate,
  checked?: PlanObjectRef | null,
): string {
  const ref = refOf(value);
  if (ref) {
    const row = views.find((view) => view.row.ref === ref);
    return (row && createdTitle(row.params)) || ref;
  }
  return (
    objectLabel(checked) ??
    (typeof value === 'string' ? value : t('plans.unknownIssue'))
  );
}

/** What a row is about, as its heading. */
export function rowTitle(
  view: RowView,
  views: readonly RowView[],
  t: Translate,
): string {
  const { params, row } = view;
  // What the target looked like before the plan: a rehearsal's own target already carries the change.
  const target =
    row.check?.baseline?.target ??
    row.result?.target ??
    row.check?.target ??
    null;
  switch (row.op) {
    case 'issue.create':
    case 'project.create':
      return createdTitle(params) || t('plans.untitled');
    case 'dependency':
      return t(
        params.action === 'remove'
          ? 'plans.dependencyRemove'
          : 'plans.dependsOn',
        {
          issue: targetLabel(params.issue, views, t),
          dependsOn: targetLabel(params.dependsOn, views, t),
        },
      );
    case 'issue.update':
    case 'comment.create':
      return targetLabel(params.issue, views, t, target);
    default:
      return objectLabel(target) ?? t('plans.unknownIssue');
  }
}

/** What a row is about, as its heading, in this plugin's words wherever it is rendered. */
export function usePlanRowTitle(): (
  view: RowView,
  views: readonly RowView[],
) => string {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useCallback((view, views) => rowTitle(view, views, t), [t]);
}

/** A failure in this plugin's words, wherever it is rendered. */
export interface PlanErrorText {
  /**
   * A failed request: a 403 as "not allowed", a 404 as "no longer exists", a known reason by its translation, else the
   * server's message or `fallback` ("The request failed" when left out).
   */
  request(error: unknown, fallback?: string): string;
  /** A row's check error or a plan's failure (`{ code, message }`): a known code by its translation, else its message. */
  row(
    error: { readonly code: string; readonly message: string } | null,
  ): string | null;
}

export function usePlanErrorText(): PlanErrorText {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useMemo(
    () => ({
      request: (error, fallback) =>
        errorText(t, error, fallback ?? t('common.requestFailed')),
      row: (error) =>
        error
          ? t(`errors.${error.code}`, {
              defaultValue: error.message || error.code,
            })
          : null,
    }),
    [t],
  );
}

/** The reason of a failed API request (`REVISION_CONFLICT`, `UNDO_STALE`, …), or null for any other error. */
export function planErrorReason(error: unknown): string | null {
  return error instanceof ApiClientError ? (error.reason ?? null) : null;
}

/** A row's error, in words: a known code by its translation, else the server's message. */
export function useRowError(): (
  error: {
    readonly code: string;
    readonly message: string;
  } | null,
) => string | null {
  const { t } = useTranslation();
  return (error) =>
    error
      ? t(`errors.${error.code}`, { defaultValue: error.message || error.code })
      : null;
}

/** Where a plan comes from, in words. */
export function usePlanSource(): (plan: Plan) => string {
  const { t } = useTranslation();
  return (plan) =>
    t(`plans.source.${plan.source.kind}`, {
      defaultValue: t('plans.source.other', { kind: plan.source.kind }),
    });
}

/** A plan's title and description in the reader's words. */
export interface PlanWording {
  readonly title: string;
  /** Null for none; left out to keep the stored one. */
  readonly description?: string | null;
}

/**
 * Words a plan another plugin proposed in the reader's language, from its source (a status rule's suggestion is
 * stored in English, say); null keeps what is stored. The application provides it; without it plans read as stored.
 */
export type PlanWorder = (plan: Plan) => PlanWording | null;

export const PlanWordingContext: Context<PlanWorder | null> =
  createContext<PlanWorder | null>(null);

/** A plan's title and description as the reader sees them (`PlanWordingContext`, else as stored). */
export function usePlanWording(): (plan: Plan) => {
  readonly title: string;
  readonly description: string | null;
} {
  const worder = useContext(PlanWordingContext);
  return (plan) => {
    const wording = worder?.(plan) ?? null;
    return {
      title: wording?.title ?? plan.title,
      description:
        wording && wording.description !== undefined
          ? wording.description
          : plan.description,
    };
  };
}
