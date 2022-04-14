import { Field } from '@formily/core';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import React from 'react';
import { Node } from 'slate';
import './index.less';
import { RichText } from './RichText';

export const Slate = () => null;

const serialize = (nodes) => {
  return nodes?.map?.((n) => Node.string(n)).join('');
};
const DEFAULT_VALUE = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

Slate.RichText = connect(
  RichText,
  mapProps((props, field: Field) => {
    // const fieldValue = serialize(field.value)?.trim();
    // if (!fieldValue) {
    //   field.value = undefined;
    // }
    return {
      ...props,
    };
  }),
  mapReadPretty((props: any) => <RichText {...props} readOnly />),
);
