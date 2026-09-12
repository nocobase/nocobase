/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NAMESPACE } from '../../locale';
import { SCHEDULE_MODE } from './constants';

export type ScheduleConfigValue = {
  mode?: number;
  collection?: string;
  startsOn?: unknown;
  repeat?: unknown;
  endsOn?: unknown;
  limit?: number;
  appends?: string[];
};

type ScheduleFieldMeta = {
  title: string;
  description?: string;
  placeholder?: string;
  min?: number;
  required?: boolean;
};

type ScheduleExecuteFieldMeta = {
  title: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
};

export const ScheduleModeFields: Record<number, Record<string, ScheduleFieldMeta>> = {
  [SCHEDULE_MODE.STATIC]: {
    startsOn: {
      title: `{{t("Starts on", { ns: "${NAMESPACE}" })}}`,
      required: true,
    },
    repeat: {
      title: `{{t("Repeat mode", { ns: "${NAMESPACE}" })}}`,
    },
    endsOn: {
      title: `{{t("Ends on", { ns: "${NAMESPACE}" })}}`,
    },
    limit: {
      title: `{{t("Repeat limit", { ns: "${NAMESPACE}" })}}`,
      placeholder: `{{t("No limit", { ns: "${NAMESPACE}" })}}`,
      min: 0,
    },
  },
  [SCHEDULE_MODE.DATE_FIELD]: {
    collection: {
      title: '{{t("Collection")}}',
      required: true,
    },
    startsOn: {
      title: `{{t("Starts on", { ns: "${NAMESPACE}" })}}`,
      required: true,
    },
    repeat: {
      title: `{{t("Repeat mode", { ns: "${NAMESPACE}" })}}`,
    },
    endsOn: {
      title: `{{t("Ends on", { ns: "${NAMESPACE}" })}}`,
    },
    limit: {
      title: `{{t("Repeat limit", { ns: "${NAMESPACE}" })}}`,
      placeholder: `{{t("No limit", { ns: "${NAMESPACE}" })}}`,
      min: 0,
    },
    appends: {
      title: `{{t("Preload associations", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Please select the associated fields that need to be accessed in subsequent nodes. With more than two levels of to-many associations may cause performance issue, please use with caution.", { ns: "${NAMESPACE}" })}}`,
    },
  },
};

export const ScheduleModeExecuteFields: Record<number, Record<string, ScheduleExecuteFieldMeta>> = {
  [SCHEDULE_MODE.STATIC]: {
    date: {
      title: `{{t('Execute on', { ns: "${NAMESPACE}" })}}`,
      placeholder: `{{t("Current time", { ns: "${NAMESPACE}" })}}`,
      required: true,
    },
  },
  [SCHEDULE_MODE.DATE_FIELD]: {
    data: {
      title: `{{t("Trigger data", { ns: "${NAMESPACE}" })}}`,
      description: `{{t("Choose a record or primary key of a record in the collection to trigger.", { ns: "${NAMESPACE}" })}}`,
      required: true,
    },
  },
};

export const ScheduleModes = {
  [SCHEDULE_MODE.STATIC]: {
    validate(config: ScheduleConfigValue) {
      return Boolean(config.startsOn);
    },
  },
  [SCHEDULE_MODE.DATE_FIELD]: {
    validate(config: ScheduleConfigValue) {
      return Boolean(config.collection && config.startsOn);
    },
  },
};
