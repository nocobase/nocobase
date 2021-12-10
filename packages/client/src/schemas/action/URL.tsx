import React from 'react';
import { observer } from '@formily/react';
import { useDesignable } from '..';
import { useCompile } from '../../hooks/useCompile';

export const URL = observer((props: any) => {
  const { schema } = useDesignable();
  const compile = useCompile();
  return (
    <a target={'_blank'} {...props}>
      {compile(schema.title)}
    </a>
  );
});
