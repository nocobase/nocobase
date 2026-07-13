/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useState } from 'react';

const RUN_DETAIL_QUERY_PARAM = 'runId';
const TASK_TEMPLATE_DETAIL_QUERY_PARAM = 'templateId';
const SKILL_VERSION_DETAIL_QUERY_PARAM = 'skillVersionId';

function getLocationSearchParam(name: string) {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return new URLSearchParams(window.location.search).get(name) || undefined;
}

function updateLocationSearchParam(
  method: 'pushState' | 'replaceState',
  name: string,
  value?: string,
  mutuallyExclusiveName?: string,
) {
  if (typeof window === 'undefined') {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (value) {
    params.set(name, value);
    if (mutuallyExclusiveName) {
      params.delete(mutuallyExclusiveName);
    }
  } else {
    params.delete(name);
  }
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history[method](window.history.state, '', nextUrl);
}

export function getRunIdFromLocationSearch() {
  return getLocationSearchParam(RUN_DETAIL_QUERY_PARAM);
}

export function replaceRunIdInLocationSearch(runId?: string) {
  updateLocationSearchParam('replaceState', RUN_DETAIL_QUERY_PARAM, runId);
}

export function pushRunIdInLocationSearch(runId: string) {
  updateLocationSearchParam('pushState', RUN_DETAIL_QUERY_PARAM, runId);
}

export function getTaskTemplateIdFromLocationSearch() {
  return getLocationSearchParam(TASK_TEMPLATE_DETAIL_QUERY_PARAM);
}

export function replaceTaskTemplateIdInLocationSearch(templateId?: string) {
  updateLocationSearchParam(
    'replaceState',
    TASK_TEMPLATE_DETAIL_QUERY_PARAM,
    templateId,
    SKILL_VERSION_DETAIL_QUERY_PARAM,
  );
}

export function pushTaskTemplateIdInLocationSearch(templateId: string) {
  updateLocationSearchParam(
    'pushState',
    TASK_TEMPLATE_DETAIL_QUERY_PARAM,
    templateId,
    SKILL_VERSION_DETAIL_QUERY_PARAM,
  );
}

export function getSkillVersionIdFromLocationSearch() {
  return getLocationSearchParam(SKILL_VERSION_DETAIL_QUERY_PARAM);
}

export function replaceSkillVersionIdInLocationSearch(skillVersionId?: string) {
  updateLocationSearchParam(
    'replaceState',
    SKILL_VERSION_DETAIL_QUERY_PARAM,
    skillVersionId,
    TASK_TEMPLATE_DETAIL_QUERY_PARAM,
  );
}

export function pushSkillVersionIdInLocationSearch(skillVersionId: string) {
  updateLocationSearchParam(
    'pushState',
    SKILL_VERSION_DETAIL_QUERY_PARAM,
    skillVersionId,
    TASK_TEMPLATE_DETAIL_QUERY_PARAM,
  );
}

export function useInitialRunDetailQuery() {
  return useState(getRunIdFromLocationSearch)[0];
}

export function useInitialTaskTemplateDetailQuery() {
  return useState(getTaskTemplateIdFromLocationSearch)[0];
}

export function useInitialSkillVersionDetailQuery() {
  return useState(getSkillVersionIdFromLocationSearch)[0];
}
