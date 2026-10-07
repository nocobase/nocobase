/**
 * Status rule types as the workflow editor shows them. This plugin's own types (`built-in-rule-types.tsx`: checklist,
 * notify the owner, wait for sub-issues, wait for blockers) and the ones the application gives through
 * `StatusRuleTypesContext` (the assembling application joins the agents plugin's `runAgent` and `suggestExecutor` here; this plugin imports
 * none of them) are described the same way, and `useStatusRuleTypes` lists them together, the built-in ones first. The
 * server registers the same types (`projectsStatusRulesToken`).
 *
 * Each type has a title and a hint (i18n keys in its plugin's namespace), the categories of status it may sit on, the
 * group the editor's "Add rule" menu lists it under, the settings a new rule starts with, an editor for its settings
 * and a one-line summary. A rule whose type nobody gives here is shown as unavailable and can only be removed.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  createContext,
  useContext,
  useMemo,
  type ComponentType,
  type Context,
} from 'react';

import type { StatusCategory } from '../../shared/issues.js';
import type { KindTitle } from '../../shared/kinds.js';
import { BUILT_IN_STATUS_RULE_TYPES } from './built-in-rule-types.js';

export type StatusRuleConfig = Readonly<Record<string, unknown>>;

/** The status a rule is on, as its editor and summary see it. */
export interface StatusRuleStatus {
  readonly key: string;
  /** As the reader sees it: translated while it keeps its default name. */
  readonly name: string;
  readonly category: StatusCategory;
}

export interface StatusRuleEditorProps {
  readonly config: StatusRuleConfig;
  readonly onChange: (config: StatusRuleConfig) => void;
  readonly status: StatusRuleStatus;
  /** A prefix for the ids of the editor's fields, unique on the page. */
  readonly idPrefix: string;
}

export interface StatusRuleSummaryProps {
  readonly config: StatusRuleConfig;
  readonly status: StatusRuleStatus;
}

/**
 * Where the editor's "Add rule" menu lists a type: `action` under "When entering" (it does something once an issue
 * entered the status), `condition` under "Entry conditions" (it only lets an issue in or keeps it out).
 */
export type StatusRuleGroup = 'action' | 'condition';

export interface StatusRuleTypeUI {
  readonly type: string;
  readonly title: KindTitle;
  /** One sentence under the title in the "Add rule" menu. */
  readonly hint?: KindTitle;
  /** Where it may be put; every category when left out. The server refuses the others. */
  readonly categories?: readonly StatusCategory[];
  /** `action` when left out. */
  readonly group?: StatusRuleGroup;
  /** Drawn before its summary; a puzzle piece when left out. */
  readonly Icon?: ComponentType<{ readonly className?: string }>;
  /** The settings a rule starts with when it is added; a rule of a type without them is stored without `config`. */
  readonly initialConfig?: StatusRuleConfig;
  /** Edits the settings; a type without settings has nothing to expand. */
  readonly Editor?: ComponentType<StatusRuleEditorProps>;
  /**
   * The rule in one short line, from its settings: on its collapsed card in the editor and under its status, such as
   * "Runs Reviewer: Analyse and propose…" or "Checklist: 3 items, 2 required". A component, so it may read what it
   * names (an agent's name) through hooks.
   */
  readonly Summary: ComponentType<StatusRuleSummaryProps>;
}

export const StatusRuleTypesContext: Context<readonly StatusRuleTypeUI[]> =
  createContext<readonly StatusRuleTypeUI[]>([]);

/** This plugin's own types, then those the application gives (a given type cannot replace a built-in one). */
export function useStatusRuleTypes(): readonly StatusRuleTypeUI[] {
  const given = useContext(StatusRuleTypesContext);
  return useMemo(
    () => [
      ...BUILT_IN_STATUS_RULE_TYPES,
      ...given.filter(
        (type) =>
          !BUILT_IN_STATUS_RULE_TYPES.some((own) => own.type === type.type),
      ),
    ],
    [given],
  );
}

export function groupOf(
  type: Pick<StatusRuleTypeUI, 'group'>,
): StatusRuleGroup {
  return type.group ?? 'action';
}

/** Whether a type may sit on a status of `category`. */
export function allowedOn(
  type: Pick<StatusRuleTypeUI, 'categories'>,
  category: StatusCategory,
): boolean {
  return !type.categories || type.categories.includes(category);
}

/** A title given as text or as an i18n key in another plugin's namespace. */
export function useTitleText(): (title: KindTitle) => string {
  const { t } = useTranslation();
  return (title) =>
    typeof title === 'string'
      ? title
      : t(title.key, { ns: title.ns, defaultValue: title.key });
}
