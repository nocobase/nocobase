/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { Empty } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useTemplateBlockContext } from '../../../block-provider/TemplateBlockProvider';
import { useDataBlockRequest } from '../../../data-source';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { withSkeletonComponent } from '../../../hoc/withSkeletonComponent';
import { FormV2 } from '../form-v2';
import { FormProps } from '../form-v2/Form';

export type DetailsProps = FormProps;

export const Details = withDynamicSchemaProps(
  withSkeletonComponent((props: DetailsProps) => {
    const { data, loading } = useDataBlockRequest() || {};
    const schema = useFieldSchema();
    const { isBlockTemplate, templateFinished } = useTemplateBlockContext();

    if (isBlockTemplate?.() ? !loading && templateFinished && data && _.isEmpty(data.data) : _.isEmpty(data?.data)) {
      return (
        <>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <NocoBaseRecursionField schema={schema.properties.pagination} name="pagination" />
        </>
      );
    }

    return (
      <div className="nb-details">
        <FormV2 {...props} />
      </div>
    );
  }),
  { displayName: 'NocoBaseDetails' },
);
