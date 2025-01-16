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

export function useCreateFormBlockEventsInterface() {
  const { form } = useFormBlockProps();
  const app = useApp();
  const { register, define, emit } = useEvent();
  console.log('app.pm', form);

  const inter = {
    name: 'form',
    title: 'form',
    events: [
      {
        name: 'onSubmit',
        title: 'submit event',
        description: 'form submit',
        // params: {
        //   e: 'event',
        // },
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

  form.subscribe(({ type, payload }) => {
    console.log('type', type, payload);
    // 表格重置后代表着添加成功
    if (type === 'onFormReset') {
      emit(inter.name, 'onSubmit', payload);
    }
  });

  define(inter);
}
