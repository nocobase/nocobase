import React, { useEffect } from 'react';
import { observer } from '@formily/react';
import { useDesignable } from '../';
import { useDisplayedMapContext } from '../../constate';

export const Displayed = observer((props: any) => {
  const { displayName, children } = props;
  const displayed = useDisplayedMapContext();
  const { schema } = useDesignable();
  useEffect(() => {
    if (displayName) {
      displayed.set(displayName, schema);
    }
  }, [displayName, schema]);
  return children;
});
