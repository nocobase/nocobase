/**
 * The state of an issues page: search, filters and the view, all in the query string (the projects plugin's helpers,
 * `@nocobase/app-plugin-projects/client/issues`), and what the toolbar's filters offer.
 */
import {
  hasIssueFilters,
  readIssueFilters,
  readStoredIssueView,
  resolveIssueView,
  storeIssueView,
  useExecutorOptions,
  useStatusName,
  useUrlSearch,
  withIssueFilter,
  withIssueView,
  withoutIssueFilters,
  type IssueFilterKey,
  type IssueFilters,
  type IssueView,
  type UrlSearch,
} from '@nocobase/app-plugin-projects/client/issues';
import { pmKeys, usePmApi } from '@nocobase/app-plugin-projects/client/kit';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

/** A toolbar filter: a select whose empty choice means "no filter". */
export interface IssueToolbarFilter {
  readonly key: IssueFilterKey;
  readonly label: string;
  readonly allLabel: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
  readonly value: string | undefined;
}

export interface IssuesPageOptions {
  /** Filters the page always applies on top of the URL's (my issues: owner or executor = me). */
  readonly fixedFilters?: IssueFilters;
  /** Toolbar filters the page does not offer, because `fixedFilters` sets them. */
  readonly hiddenFilters?: readonly IssueFilterKey[];
  /** The page the view is remembered for (`issues`, `my-issues`). */
  readonly viewKey: string;
  /** The views the page offers, in the switch's order. */
  readonly views: readonly IssueView[];
  /** The view shown when neither `?view=` nor the person's last choice on the page names one of `views`. */
  readonly defaultView: IssueView;
}

export interface IssuesPage {
  readonly view: IssueView;
  readonly setView: (view: IssueView) => void;
  /** The URL's filters with the page's fixed ones on top. */
  readonly filters: IssueFilters;
  /** Whether a search or a filter of the query string narrows the issues. */
  readonly filtered: boolean;
  readonly params: URLSearchParams;
  readonly updateParams: UrlSearch['updateParams'];
  /** The search box: its own text, written to the URL once typing settles. */
  readonly searchText: string;
  readonly setSearchText: (value: string) => void;
  readonly scheduleSearch: (value: string) => void;
  readonly searchRef: UrlSearch['searchRef'];
  readonly toolbarFilters: readonly IssueToolbarFilter[];
  readonly setFilter: (key: IssueFilterKey, value: string | undefined) => void;
  readonly clearFilters: () => void;
}

export function useIssuesPage({
  fixedFilters,
  hiddenFilters = [],
  viewKey,
  views,
  defaultView,
}: IssuesPageOptions): IssuesPage {
  const { t } = useTranslation();
  const api = usePmApi();
  const {
    params,
    text,
    setText,
    scheduleSearch,
    updateParams,
    resetText,
    searchRef,
  } = useUrlSearch();
  const [stored, setStored] = useState(() => readStoredIssueView(viewKey));
  const view = resolveIssueView(params, stored, views, defaultView);
  const urlFilters = readIssueFilters(params, view);
  const filters: IssueFilters = { ...urlFilters, ...fixedFilters };
  const statusName = useStatusName();

  const projects = useQuery({
    queryKey: pmKeys.projects,
    queryFn: () => api.projects(),
  });
  const labels = useQuery({
    queryKey: pmKeys.labels,
    queryFn: () => api.labels(),
  });
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
  });
  const otherExecutors = useExecutorOptions(
    !hiddenFilters.includes('executorId'),
  );
  // The filtered project's workflow, else the workflow of issues without a project: the list's status filter.
  const statuses = useQuery({
    queryKey: pmKeys.statuses(filters.projectId ?? null),
    queryFn: () => api.statuses(filters.projectId),
    enabled: view === 'list',
  });

  const filter = (
    key: IssueFilterKey,
    options: IssueToolbarFilter['options'],
  ): IssueToolbarFilter => ({
    key,
    label: t(`issuesPage.filters.${key}`),
    allLabel: t(`issuesPage.allFilters.${key}`),
    options,
    value: urlFilters[key],
  });
  // The agent queue is about agents: its executor filter offers only them.
  const people =
    view === 'agent'
      ? []
      : (members.data ?? []).map((item) => ({
          value: item.userId,
          label: item.name,
        }));
  const toolbarFilters = [
    ...(view === 'list'
      ? [
          filter(
            'statusKey',
            (statuses.data ?? []).map((status) => ({
              value: status.key,
              label: statusName(statuses.data, status.key),
            })),
          ),
        ]
      : []),
    filter(
      'projectId',
      (projects.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    ),
    filter(
      'labelId',
      (labels.data ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    ),
    filter(
      'ownerUserId',
      (members.data ?? []).map((item) => ({
        value: item.userId,
        label: item.name,
      })),
    ),
    filter('executorId', [
      ...otherExecutors.map((item) => ({ value: item.id, label: item.name })),
      ...people,
    ]),
  ].filter((item) => !hiddenFilters.includes(item.key));

  return {
    view,
    setView: (next) => {
      storeIssueView(viewKey, next);
      setStored(next);
      updateParams((current) => withIssueView(current, next));
    },
    filters,
    filtered: hasIssueFilters(urlFilters),
    params,
    updateParams,
    searchText: text,
    setSearchText: setText,
    scheduleSearch,
    searchRef,
    toolbarFilters,
    setFilter: (key, value) =>
      updateParams((current) => withIssueFilter(current, key, value)),
    clearFilters: () => {
      resetText();
      updateParams(withoutIssueFilters);
      searchRef.current?.focus();
    },
  };
}
