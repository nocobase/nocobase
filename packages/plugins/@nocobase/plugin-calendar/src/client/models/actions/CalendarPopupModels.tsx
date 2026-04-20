/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionSceneEnum, PopupActionModel, handleDateChangeOnForm } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import dayjs from 'dayjs';
import { set } from 'lodash';
import { normalizeCalendarFieldPath } from '../utils';

export const createCalendarQuickCreateActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'CalendarQuickCreateActionModel',
  };
};

export const createCalendarEventViewActionOptions = (uid?: string) => {
  return {
    uid,
    use: 'CalendarEventViewActionModel',
  };
};

const getCalendarFieldComponentProps = (collection: any, fieldPath?: string | string[]) => {
  const normalizedFieldPath = normalizeCalendarFieldPath(fieldPath);
  const collectionField = normalizedFieldPath ? collection?.getField?.(normalizedFieldPath) : null;

  if (!collectionField) {
    return null;
  }

  return {
    ...(collectionField.uiSchema?.['x-component-props'] || {}),
    ...(collectionField.getComponentProps?.() || {}),
  };
};

const setCalendarSlotFormValue = (
  formData: Record<string, any>,
  collection: any,
  fieldPath: string | string[] | undefined,
  value: unknown,
) => {
  if (!fieldPath || !value) {
    return;
  }

  const componentProps = getCalendarFieldComponentProps(collection, fieldPath) || {};
  const formattedValue = handleDateChangeOnForm(
    dayjs(value as any),
    componentProps.dateOnly,
    componentProps.utc,
    componentProps.picker || 'date',
    componentProps.showTime,
    componentProps.gmt,
  );

  if (typeof formattedValue === 'undefined') {
    return;
  }

  const namePath = Array.isArray(fieldPath) ? fieldPath : String(fieldPath).split('.');
  set(formData, namePath, formattedValue);
};

export const buildCalendarSlotFormData = ({
  slotInfo,
  collection,
  fieldNames,
}: {
  slotInfo?: { start?: unknown; end?: unknown };
  collection?: any;
  fieldNames?: {
    start?: string | string[];
    end?: string | string[];
  };
}) => {
  if (!slotInfo?.start || !collection) {
    return {};
  }

  const formData: Record<string, any> = {};
  const startFieldPath = fieldNames?.start;
  const endFieldPath = fieldNames?.end;
  const normalizedStartFieldPath = normalizeCalendarFieldPath(startFieldPath);
  const normalizedEndFieldPath = normalizeCalendarFieldPath(endFieldPath);

  setCalendarSlotFormValue(formData, collection, startFieldPath, slotInfo.start);

  if (normalizedEndFieldPath && normalizedEndFieldPath !== normalizedStartFieldPath) {
    setCalendarSlotFormValue(formData, collection, endFieldPath, slotInfo.end || slotInfo.start);
  }

  return formData;
};

class CalendarPopupActionModel extends PopupActionModel {
  getInputArgs() {
    const inputArgs = super.getInputArgs();

    return {
      ...inputArgs,
      dataSourceKey: this.collection?.dataSourceKey,
      collectionName: this.collection?.name,
    };
  }
}

export class CalendarQuickCreateActionModel extends CalendarPopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultPopupTitle = tExpr('Add new', { ns: 'calendar' });

  getAclActionName() {
    return 'create';
  }
}

CalendarQuickCreateActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createCalendarQuickCreateActionOptions();
  },
});

export class CalendarEventViewActionModel extends CalendarPopupActionModel {
  static scene = ActionSceneEnum.record;

  defaultPopupTitle = tExpr('Details');

  getAclActionName() {
    return 'view';
  }
}

CalendarEventViewActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createCalendarEventViewActionOptions();
  },
});
