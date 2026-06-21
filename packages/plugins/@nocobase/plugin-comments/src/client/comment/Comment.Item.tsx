/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Field } from '@formily/core';
import { RecursionField, observer, useField } from '@formily/react';
import {
  RecordProvider,
  useBlockRequestContext,
  useCollectionFields,
  useCollectionParentRecordData,
} from '@nocobase/client';
import { Button, Card, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { useTranslation } from '../locale';
import useStyles from './style';

export const CommentItem = observer(
  (props: PropsWithChildren<{ editing: boolean; setEditing: (editing: boolean) => void }>) => {
    const { editing, setEditing } = props;
    const field = useField<Field>();
    const { t } = useTranslation();
    const { componentCls } = useStyles();

    const parentRecordData = useCollectionParentRecordData();

    const { resource, service } = useBlockRequestContext();

    const saveComment = useCallback(async () => {
      await resource.update({
        filterByTk: field.value?.id,
        values: {
          content: field?.value?.content,
        },
      });
      service.refresh();
    }, [resource, service, field.value]);

    const collectionFields = useCollectionFields();

    const contentFieldComponentProps = useMemo(() => {
      return collectionFields.find((f) => f.name === 'content')?.uiSchema?.['x-component-props'];
    }, [collectionFields]);

    return (
      <RecordProvider record={field.value} parent={parentRecordData}>
        <div className={`${componentCls}-item-container`}>
          <div className={`${componentCls}-item-container-line`}></div>
          <Card
            size="small"
            title={
              <div className={`${componentCls}-item-title`}>
                <div className={`${componentCls}-item-title-left`}>
                  <span>{field?.value?.createdBy?.nickname}</span>
                  <span>{t('commented')}</span>
                  <Tooltip title={dayjs(field?.value?.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                    <span>{(dayjs(field?.value?.createdAt) as any).fromNow()}</span>
                  </Tooltip>
                </div>
                <div className={`${componentCls}-item-title-right`}>{props.children}</div>
              </div>
            }
          >
            <div className={`${componentCls}-item-editor`}>
              <RecursionField
                basePath={field.address}
                name="content"
                schema={{
                  type: 'string',
                  name: 'content',
                  'x-component': 'MarkdownVditor',
                  'x-component-props': {
                    ...contentFieldComponentProps,
                    value: field?.value?.content,
                  },
                  'x-read-pretty': true,
                }}
              />
              {editing && (
                <div className={`${componentCls}-item-editor-button-area`}>
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditing(false);
                      saveComment();
                      field.form.setFieldState(`${field.address}.content`, (state) => {
                        state.pattern = 'readPretty';
                      });
                    }}
                  >
                    {t('Update Comment')}
                  </Button>
                  <Button
                    onClick={() => {
                      field.form.setFieldState(`${field.address}.content`, (state) => {
                        state.pattern = 'readPretty';
                      });
                      setEditing(false);
                    }}
                  >
                    {t('Cancel')}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </RecordProvider>
    );
  },
);
