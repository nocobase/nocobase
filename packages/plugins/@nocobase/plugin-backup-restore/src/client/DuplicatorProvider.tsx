import { SchemaComponentOptions } from '@nocobase/client';
import React, { FC } from 'react';

export const DuplicatorProvider: FC = function (props) {
  return <SchemaComponentOptions>{props.children}</SchemaComponentOptions>;
};

DuplicatorProvider.displayName = 'DuplicatorProvider';
