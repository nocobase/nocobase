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

const findCalendarActionFieldComponentProps = (
  model: any,
  normalizedFieldPath?: string,
): Record<string, any> | null => {
  if (!model || !normalizedFieldPath) {
    return null;
  }

  const stepFieldPath = model.getStepParams?.('fieldSettings', 'init')?.fieldPath;
  if (stepFieldPath && normalizeCalendarFieldPath(stepFieldPath) === normalizedFieldPath) {
    return {
      ...(model.subModels?.field?.props || {}),
      ...(model.props?.['x-component-props'] || {}),
      ...(model.props || {}),
    };
  }

  const subModels = Object.values(model.subModels || {});
  for (const subModelValue of subModels) {
    const subModelList = Array.isArray(subModelValue) ? subModelValue : [subModelValue];
    for (const subModel of subModelList) {
      const matched = findCalendarActionFieldComponentProps(subModel, normalizedFieldPath);
      if (matched) {
        return matched;
      }
    }
  }

  return null;
};

const getCalendarFieldComponentProps = (collection: any, popupAction: any, fieldPath?: string | string[]) => {
  const normalizedFieldPath = normalizeCalendarFieldPath(fieldPath);
  const actionFieldProps = findCalendarActionFieldComponentProps(popupAction, normalizedFieldPath);
  if (actionFieldProps) {
    return actionFieldProps;
  }

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
  popupAction: any,
  fieldPath: string | string[] | undefined,
  value: unknown,
) => {
  if (!fieldPath || !value) {
    return;
  }

  const componentProps = getCalendarFieldComponentProps(collection, popupAction, fieldPath) || {};
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
  popupAction,
  fieldNames,
}: {
  slotInfo?: { start?: unknown; end?: unknown };
  collection?: any;
  popupAction?: any;
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

  setCalendarSlotFormValue(formData, collection, popupAction, startFieldPath, slotInfo.start);

  if (normalizedEndFieldPath && normalizedEndFieldPath !== normalizedStartFieldPath) {
    setCalendarSlotFormValue(formData, collection, popupAction, endFieldPath, slotInfo.end || slotInfo.start);
  }

  return formData;
};

class CalendarPopupActionModel extends PopupActionModel {
  get collection() {
    return this.context.collection || this.context.blockModel?.collection;
  }

  getInputArgs() {
    const inputArgs = super.getInputArgs();
    const collection = this.collection;

    return {
      ...inputArgs,
      dataSourceKey: collection?.dataSourceKey,
      collectionName: collection?.name,
    };
  }
}

export class CalendarQuickCreateActionModel extends CalendarPopupActionModel {
  static scene = ActionSceneEnum.collection;

  defaultPopupTitle = tExpr('Add new', { ns: 'calendar' });

  getAclActionName(): any {
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

  getAclActionName(): any {
    return 'view';
  }
}

CalendarEventViewActionModel.define({
  hide: true,
  createModelOptions: async () => {
    return createCalendarEventViewActionOptions();
  },
});
