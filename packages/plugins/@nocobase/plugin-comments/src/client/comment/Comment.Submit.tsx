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

import { RecursionField, useField } from '@formily/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'antd';
import {
  useACLActionParamsContext,
  useBlockRequestContext,
  useCollectionField,
  useCollectionFields,
  useDataBlockResource,
  useDesignable,
} from '@nocobase/client';
import { Field } from '@formily/core';
import { useCommentBlockDescoratorContext } from '../provider/useCommentBlockDecoratorContext';
import { useTranslation } from '../locale';
import useStyles from './style';

export function CommentSubmit() {
  const field = useField<Field>();

  const setContent = useCallback(
    (v: string) => {
      field.setValue({ ...field.value, content: v });
    },
    [field],
  );

  const { t } = useTranslation();

  const { wrapSSR, componentCls, hashId } = useStyles();

  const canSubmit = useMemo(() => {
    return field.value?.content?.trim().length > 0;
  }, [field.value]);

  const { resource, service } = useBlockRequestContext();

  const submit = useCallback(async () => {
    await resource.create({
      values: field.value,
    });

    setContent('');
    const total = service?.data?.meta?.count || 0;
    const pageSize = service?.data?.meta?.pageSize || 10;
    const nextTotal = total + 1;
    const lastPage = Math.ceil(nextTotal / pageSize);

    service.run({ ...service.params?.[0], page: lastPage });
  }, [resource, field, service, setContent]);

  const { createAble } = useCommentBlockDescoratorContext();

  const aclCtx = useACLActionParamsContext();
  const { designable } = useDesignable();

  const hiddenByACL = !designable && (field?.data?.hidden || !aclCtx);

  const collectionFields = useCollectionFields();

  const contentFieldComponentProps = useMemo(() => {
    return collectionFields.find((f) => f.name === 'content')?.uiSchema?.['x-component-props'];
  }, [collectionFields]);

  if (!createAble || hiddenByACL) return null;

  return wrapSSR(
    <div style={{ marginTop: 10 }} className={`${componentCls} ${hashId}`}>
      <RecursionField
        basePath={field.address}
        name="content"
        schema={{
          type: 'string',
          'x-component': 'MarkdownVditor',
          'x-component-props': {
            ...contentFieldComponentProps,
            onChange: (v) => {
              setContent(v);
            },
          },
          'x-read-pretty': false,
          'x-read-only': false,
          name: 'content',
        }}
      />
      <Button disabled={!canSubmit} onClick={() => submit()} type="primary" style={{ marginTop: 10 }}>
        {t('Comment')}
      </Button>
    </div>,
  );
}
