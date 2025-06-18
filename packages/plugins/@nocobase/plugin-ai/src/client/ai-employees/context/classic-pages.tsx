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
import { FileOutlined, BuildOutlined, SelectOutlined } from '@ant-design/icons';
import { tval } from '@nocobase/utils/client';
// @ts-ignore
import pkg from '../../../../package.json';
import { useT } from '../../locale';
import { useChatMessages } from '../chatbox/ChatMessagesProvider';
import { useAISelectionContext } from '../selector/AISelectorProvider';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';

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
    'block-ui-schemas': {
      menu: {
        icon: <BuildOutlined />,
        Component: ({ addContextItem }) => {
          const t = useT();
          const { t: collectionT } = useTranslation('lm-collections');
          const { startSelect, ctx } = useAISelectionContext();
          return (
            <div
              onClick={() => {
                startSelect('blocks', {
                  onSelect: ({ uid, fieldSchema }) => {
                    if (!uid) {
                      return;
                    }
                    let title = '';
                    if (ctx[uid]?.collection) {
                      title = Schema.compile(ctx[uid].collection.title, { t: collectionT });
                      title = `${title} `;
                    }
                    addContextItem({
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
        Component: ({ addContextItem }) => {
          const t = useT();
          const { startSelect } = useAISelectionContext();
          const { addAttachments } = useChatMessages();

          return (
            <div
              onClick={() => {
                startSelect('fields', {
                  onSelect: ({ uid, value }) => {
                    if (!value) {
                      return;
                    }
                    if (isAttachment(value)) {
                      addAttachments(value);
                      return;
                    }
                    if (typeof value === 'string') {
                      addContextItem({
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
