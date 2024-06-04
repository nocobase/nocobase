/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Templates } from '../..';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { Form } from './Form';

export const FormWithDataTemplates: any = withDynamicSchemaProps(
  (props) => {
    return (
      <>
        <Templates style={{ marginBottom: 18 }} form={props.form} />
        <Form {...props} />
      </>
    );
  },
  {
    displayName: 'FormWithDataTemplates',
  },
);
