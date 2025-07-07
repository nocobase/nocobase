/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { WorkContextOptions } from '../types';
import { BuildOutlined, StarOutlined, SelectOutlined, DatabaseOutlined } from '@ant-design/icons';
import { tval } from '@nocobase/utils/client';
// @ts-ignore
import pkg from '../../../../package.json';
import { useT } from '../../locale';
import { useChatMessages } from '../chatbox/ChatMessagesProvider';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';
import { Checkbox } from 'antd';

export const CollectionDefinitionsContext: WorkContextOptions = {
  menu: {
    icon: <StarOutlined />,
    label: tval('Modern pages', { ns: pkg.name }),
  },
  children: {
    // form: {
    //   menu: {
    //     icon: <FormOutlined />,
    //     Component: ({ onAdd }) => {
    //       const t = useT();
    //       const { t: collectionT } = useTranslation('lm-collections');
    //       const { startSelect, ctx } = useAISelectionContext();
    //       return (
    //         <div
    //           onClick={() => {
    //             startSelect('form', {
    //               onSelect: ({ uid, fieldSchema, collection }) => {
    //                 if (!uid) {
    //                   return;
    //                 }
    //                 let title = '';
    //                 if (collection) {
    //                   title = Schema.compile(collection.title, { t: collectionT });
    //                 }
    //                 onAdd({
    //                   uid,
    //                   title,
    //                   content: JSON.stringify(fieldSchema.toJSON()),
    //                 });
    //               },
    //             });
    //           }}
    //         >
    //           {t('Select form')}
    //         </div>
    //       );
    //     },
    //   },
    //   tag: {
    //     Component: ({ item }) => {
    //       const t = useT();
    //       return (
    //         <>
    //           <FormOutlined /> {t('Form')} ({item.title})
    //         </>
    //       );
    //     },
    //   },
    //   actions: [
    //     {
    //       responseType: 'json',
    //       Component: ({ item, message, value }) => {
    //         const t = useT();
    //         const { ctx } = useAISelectionContext();
    //
    //         return (
    //           <Button
    //             size="small"
    //             icon={<FormOutlined />}
    //             variant="link"
    //             color="primary"
    //             onClick={() => {
    //               const content = value || (message.content as unknown as string);
    //               const data = content.replace('```json', '').replace('```', '');
    //               const json = JSON.parse(data);
    //               const form = ctx[item.uid]?.form;
    //               if (form) {
    //                 form.setValues(json);
    //               }
    //             }}
    //           >
    //             {t('Fill out form')} ({item.title})
    //           </Button>
    //         );
    //       },
    //     },
    //   ],
    // },
    users: {
      menu: {
        Component: ({ onAdd }) => {
          const t = useT();
          const { t: collectionT } = useTranslation('lm-collections');
          const { startSelect } = useAISelectionContext();
          return <Checkbox>{t('Users #f61f6cda073')}</Checkbox>;
        },
      },
      tag: {
        Component: ({ item }) => {
          return (
            <>
              <BuildOutlined /> {item.title}
            </>
          );
        },
      },
    },
    roles: {
      menu: {
        Component: ({ onAdd }) => {
          const t = useT();
          const { startSelect } = useAISelectionContext();
          const { addAttachments } = useChatMessages();

          return <Checkbox>{t('Roles #4cb2eb66a99')}</Checkbox>;
        },
      },
    },
  },
};
