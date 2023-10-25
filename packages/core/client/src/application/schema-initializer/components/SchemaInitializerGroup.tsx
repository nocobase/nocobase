import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerChildren } from './SchemaInitializerChildren';
import { SchemaInitializerDivider } from './SchemaInitializerDivider';
import { SchemaInitializerOptions } from '../types';
import { useStyles } from './style';

export interface SchemaInitializerGroupProps {
  title: string;
  children: SchemaInitializerOptions['list'];
  name: string;
  divider?: boolean;
}

export const SchemaInitializerGroup: FC<SchemaInitializerGroupProps> = (props) => {
  const { children, title, divider } = props;
  const compile = useCompile();
  const { styles } = useStyles();
  return (
    <div>
      {divider && <SchemaInitializerDivider />}
      <div className={styles.nbGroupTitle}>{compile(title)}</div>
      <SchemaInitializerChildren>{children}</SchemaInitializerChildren>
    </div>
  );
};
