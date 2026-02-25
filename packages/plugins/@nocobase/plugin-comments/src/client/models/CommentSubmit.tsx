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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'antd';
import { useACLActionParamsContext, useDesignable } from '@nocobase/client';
import { useFlowModel } from '@nocobase/flow-engine';
import { useTranslation } from 'react-i18next';
import { observer } from '@formily/reactive-react';
import useStyles from './style';
import { NAMESPACE } from '../locale';

export const CommentSubmit = observer((props: any) => {
  const { createAble = true, defaultValue } = props;
  const [value, setValue] = useState(null);
  const model: any = useFlowModel();
  const markdown = model.context.markdown;
  useEffect(() => {
    // 监听 model.context.content 的变化
    setValue({ content: defaultValue });
  }, [defaultValue]);
  const collectionFields = model.collection.getFields();
  const { resource } = model;
  const setContent = useCallback((v: string) => {
    setValue({ content: v });
  }, []);

  const { t } = useTranslation();

  const { wrapSSR, componentCls, hashId } = useStyles();

  const canSubmit = useMemo(() => {
    return value?.content?.trim().length > 0;
  }, [value]);

  const submit = useCallback(async () => {
    await resource.create({
      ...value,
    });

    setContent('');
    const total = resource?.getMeta()?.count || 0;
    const pageSize = resource?.getPageSize() || 10;
    const lastPage = Math.ceil(total / pageSize);
    resource.setPage(lastPage);
    resource.refresh();
    setValue(null);
  }, [resource, setContent, value]);

  const aclCtx = useACLActionParamsContext();
  const { designable } = useDesignable();

  const hiddenByACL = !designable && !aclCtx;

  const contentFieldComponentProps = useMemo(() => {
    return collectionFields.find((f) => f.name === 'content')?.uiSchema?.['x-component-props'];
  }, [collectionFields]);

  if (!createAble || hiddenByACL) return null;
  return wrapSSR(
    <div style={{ marginTop: 10 }} className={`${componentCls} ${hashId}`}>
      {markdown.edit({
        ...contentFieldComponentProps,
        value: value?.content as any,
        quoteFlag: true,
        onChange: (v) => {
          setContent(v);
        },
        enableContextSelect: false,
      })}
      <Button disabled={!canSubmit} onClick={() => submit()} type="primary" style={{ marginTop: 10 }}>
        {t('Comment', { ns: NAMESPACE })}
      </Button>
    </div>,
  );
});
