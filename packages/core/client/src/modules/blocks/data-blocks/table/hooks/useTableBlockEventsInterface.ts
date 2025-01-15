/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePlugin } from '../../../../../application/hooks/usePlugin';
import { useApp } from '../../../../../application/hooks/useApp';
import { useFormBlockProps } from '../../../../../block-provider/FormBlockProvider';
import { EventFlowPlugin } from '../../../../../event-flow';
import { useRefreshActionProps } from '../../../../../block-provider/hooks';

export function useTableBlockEventsInterface() {
  const { form } = useFormBlockProps();
  const app = useApp();
  const eventFlowPlugin = usePlugin(EventFlowPlugin.name) as any;
  const props = useRefreshActionProps();
  console.log('useTableBlockEventsInterface', props);

  const types = {
    name: 'table',
    title: 'table',
    // events: [
    //   {
    //     name: 'onSubmit',
    //     title: 'submit event',
    //     description: 'form submit',
    //     params: {
    //       e: 'event',
    //     },
    //   },
    // ],
    // state: {
    //   isSubmitting: 'isSubmitting',
    // },
    actions: [
      {
        name: 'refresh',
        title: '刷新',
        description: '表格刷新',
        fn: () => {
          console.log('refresh onClick');
          props?.onClick();
        },
      },
    ],
  };
  eventFlowPlugin.register(types);
}
