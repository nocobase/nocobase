import React from 'react';
import { observer } from '@formily/react';
import { Link as RouterLink } from 'react-router-dom';
import { useDesignable } from '..';
import { useCompile } from '../../hooks/useCompile';

export const Link = observer((props: any) => {
  const { schema } = useDesignable();
  const compile = useCompile();
  return <RouterLink {...props}>{compile(schema.title)}</RouterLink>;
});
