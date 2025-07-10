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
import { FileOutlined, BuildOutlined, SelectOutlined, FormOutlined } from '@ant-design/icons';
import { tval } from '@nocobase/utils/client';
// @ts-ignore
import pkg from '../../../../package.json';
import { useT } from '../../locale';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';
import { Button } from 'antd';
import { useChatMessagesStore } from '../chatbox/stores/chat-messages';

const isAttachment = (value: any) => {
  let file = value;
  if (Array.isArray(value)) {
    file = value[0];
  }
  return file?.filename || file?.url;
};

export const ClassicPagesContext: WorkContextOptions = {
  menu: {
    icon: <FileOutlined />,
    label: tval('Classic pages', { ns: pkg.name }),
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
    'block-ui-schemas': {
      menu: {
        icon: <BuildOutlined />,
        Component: ({ onAdd }) => {
          const t = useT();
          const { t: collectionT } = useTranslation('lm-collections');
          const { startSelect } = useAISelectionContext();
          return (
            <div
              onClick={() => {
                startSelect('block', {
                  onSelect: ({ uid, fieldSchema, collection }) => {
                    if (!uid) {
                      return;
                    }
                    let title = '';
                    if (collection) {
                      title = Schema.compile(collection.title, { t: collectionT });
                      title = `${title} `;
                    }
                    onAdd({
                      uid,
                      title: `${title}#${uid}`,
                      content: JSON.stringify(fieldSchema.toJSON()),
                    });
                  },
                });
              }}
            >
              {t('Select block UI schemas')}
            </div>
          );
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
    'field-values': {
      menu: {
        icon: <SelectOutlined />,
        Component: ({ onAdd }) => {
          const t = useT();
          const { startSelect } = useAISelectionContext();
          const addAttachments = useChatMessagesStore.use.addAttachments();

          return (
            <div
              onClick={() => {
                startSelect('field', {
                  onSelect: ({ uid, value }) => {
                    if (!value) {
                      return;
                    }
                    if (isAttachment(value)) {
                      addAttachments(value);
                      return;
                    }
                    if (typeof value === 'string') {
                      onAdd({
                        uid,
                        title: `${t('Field value')} #${uid}`,
                        content: value,
                      });
                    }
                  },
                });
              }}
            >
              {t('Select field values')}
            </div>
          );
        },
      },
    },
  },
};
