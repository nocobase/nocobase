import React from 'react';

import { CollectionManagerProvider } from '@nocobase/client';

import expression from './expression';

export function Provider(props) {
  return <CollectionManagerProvider interfaces={{ expression }}>{props.children}</CollectionManagerProvider>;
}
