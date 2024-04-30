/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Tag } from 'antd';
import React from 'react';
import { useCompile } from '../../../schema-component';
import { useCollectionManager_deprecated } from '../../hooks';

export const CollectionTemplateTag = observer(
  (props: any) => {
    const { value } = props;
    const { getTemplate } = useCollectionManager_deprecated();
    const compile = useCompile();
    const schema = getTemplate(value);

    return <Tag>{compile(schema?.title || '{{t("General collection")}}')}</Tag>;
  },
  { displayName: 'CollectionTemplateTag' },
);
