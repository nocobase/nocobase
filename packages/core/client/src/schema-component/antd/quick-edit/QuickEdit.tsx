import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import {
  connect,
  mapProps,
  mapReadPretty,
  useFieldSchema,
  ObjectField,
  FormProvider,
  Field,
  useField,
} from '@formily/react';
import { css } from '@emotion/css';
import { Editable } from '@formily/antd';
import { Popover } from 'antd';
import { InputProps } from 'antd/lib/input';
import { createForm } from '@formily/core';
import { FormItem } from '../form-item';
import CollectionField from '../../../collection-manager/CollectionField';

export const QuickEdit = (props) => {
  console.log(props);
  return (
    <Popover content={<CollectionField editable />}>
      <FormItem>
        <CollectionField readPretty />
      </FormItem>
    </Popover>
  );
};
