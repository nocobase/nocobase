import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import './index.less';
import { RichText } from './RichText';

export const Slate = () => null;

Slate.RichText = connect(
  RichText,
  mapReadPretty((props: any) => <RichText {...props} readOnly />),
);
