/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs } from '@nocobase/utils/client';
import { Card, Tooltip, Button } from 'antd';
import _ from 'lodash';
import React, { useCallback, useState, useEffect } from 'react';
import { observer } from '@formily/reactive-react';
import useStyles from './style';
import { useTranslation } from 'react-i18next';
import { CommentActions } from './CommentActions';
import { NAMESPACE } from '../locale';

const Display = ({ value, markdown, liquid, t, ctx }) => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (!value) return;

    (async () => {
      try {
        const result = await liquid.renderWithFullContext(value, ctx);
        const html = markdown.render(t(result), { ellipsis: false, textOnly: false });
        setContent(html);
      } catch (err) {
        setContent(`<pre style="color:red;"> 渲染错误: ${err.message}</pre>`);
      }
    })();
  }, [value]);

  return content;
};

export const CommentItem = observer((props: any) => {
  const { value, resource, model } = props;
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [updateValue, setUpdateValue] = useState(null);
  const { componentCls } = useStyles();
  const markdown = model.context.markdown;
  model.context.defineMethod('setEditing', () => {
    setEditing(true);
  });
  const saveComment = useCallback(async () => {
    await resource.update(value?.id, {
      content: updateValue,
    });

    resource.refresh();
  }, [resource, value, updateValue]);
  return (
    <div key={value.id}>
      <div className={`${componentCls}-item-container`}>
        <div className={`${componentCls}-item-container-line`}></div>
        <Card
          size="small"
          title={
            <div className={`${componentCls}-item-title`}>
              <div className={`${componentCls}-item-title-left`}>
                <span>{value?.createdBy?.nickname}</span>
                <span>{t('commented', { ns: NAMESPACE })}</span>
                <Tooltip title={dayjs(value?.createdAt).format('YYYY-MM-DD HH:mm:ss')}>
                  <span>{(dayjs(value?.createdAt) as any).fromNow()}</span>
                </Tooltip>
              </div>
              <div className={`${componentCls}-item-title-right`}>{<CommentActions />}</div>
            </div>
          }
        >
          <div className={`${componentCls}-item-editor`}>
            {editing ? (
              markdown.edit({
                value: value?.content as any,
                onChange: (v) => {
                  setUpdateValue(v);
                },
                enableContextSelect: false,
              })
            ) : (
              <Display
                value={value?.content}
                markdown={model.context.markdown}
                liquid={model.context.liquid}
                t={t}
                ctx={model.context}
              />
            )}
            {editing && (
              <div className={`${componentCls}-item-editor-button-area`}>
                <Button
                  type="primary"
                  onClick={() => {
                    setEditing(false);
                    saveComment();
                  }}
                >
                  {t('Update Comment', { ns: NAMESPACE })}
                </Button>
                <Button
                  onClick={() => {
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
    </div>
  );
});
