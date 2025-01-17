/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEvent } from '../../event-flow';
import { useCollection } from '../../data-source/collection/CollectionProvider';
import { useForm } from '@formily/react';
import { useFormActiveFields } from './useFormActiveFields';
import { useFormBlockContext } from '..';

export function useSubmitEvents() {
  const form = useForm();
  const { emit, define } = useEvent();
  const collection = useCollection();
  const ctx = useFormBlockContext() || {};
  const fields = collection?.fields || [];
  const fieldsMap = fields.reduce((acc, field) => {
    acc[field.name] = field;
    return acc;
  }, {});
  define({
    name: 'formSubmit',
    title: '表单提交',
    events: [
      {
        name: 'beforeSubmit',
        title: '表单提交前',
        params: {
          values: {
            title: '表单值',
            type: 'object',
            description: '表单提交的值',
            properties: fieldsMap,
          },
        },
      },
      {
        name: 'afterSubmit',
        title: '表单提交后',
        params: {
          values: {
            title: '表单值',
            type: 'object',
            description: '表单提交后的值',
            properties: fieldsMap,
          },
        },
      },
    ],
  });
  return {
    emitBeforeSubmit: async (values: any) => {
      await emit({ name: 'formSubmit', eventName: 'beforeSubmit', params: { values } });
    },
    emitAfterSubmit: async (values: any) => {
      await emit({ name: 'formSubmit', eventName: 'afterSubmit', params: { values } });
    },
  };
}
