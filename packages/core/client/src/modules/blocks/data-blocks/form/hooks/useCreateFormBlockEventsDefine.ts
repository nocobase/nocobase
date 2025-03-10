/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '../../../../../application/hooks/useApp';
import { useFormBlockProps } from '../../../../../block-provider/FormBlockProvider';
import { useEvent } from '../../../../../event-flow';

export function useCreateFormBlockEventsDefine() {
  const { form } = useFormBlockProps();
  const app = useApp();
  const { define, emit } = useEvent();

  const inter = {
    name: 'form',
    title: '表单',
    events: [
      {
        name: 'valueChange',
        title: '表单值改变',
        params: {
          values: {
            name: 'values',
            title: '表单值',
            type: 'object',
            description: '表单值',
          },
        },
      },
    ],
    // state: {
    //   isSubmitting: 'isSubmitting',
    // },
    actions: [
      {
        name: 'submit',
        title: 'submit action',
        description: 'form submit',
        fn: () => {
          console.log('form submit');
        },
      },
    ],
  };

  form.subscribe(({ type, payload, ...args }) => {
    console.log('type', type, payload, args);
    // 表格重置后代表着添加成功
    if (type === 'onFormReset') {
      emit({
        event: {
          definition: inter.name,
          event: 'onSubmit',
        },
        params: payload,
      });
    }
  });

  define(inter);
}
