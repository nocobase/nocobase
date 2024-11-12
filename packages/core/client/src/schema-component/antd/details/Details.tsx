/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Empty } from 'antd';
import _ from 'lodash';
import React from 'react';
import { RecursionField, useFieldSchema } from '@formily/react';
import { useDataBlockRequest } from '../../../data-source';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { FormV2 } from '../form-v2';
import { FormProps } from '../form-v2/Form';

export type DetailsProps = FormProps;

export const Details = withDynamicSchemaProps(
  (props: DetailsProps) => {
    const request = useDataBlockRequest();
    const schema = useFieldSchema();
    if (!request?.loading && _.isEmpty(request?.data?.data)) {
      return (
        <>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          <RecursionField schema={schema.properties.pagination} name="pagination" />
        </>
      );
    }

    return (
      <div className="nb-details">
        <FormV2 {...props} />
      </div>
    );
  },
  { displayName: 'Details' },
);
