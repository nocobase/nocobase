import { observer } from '@formily/react';
import React from 'react';

export const Event = observer(
  (props) => {
    return <>{props.children}</>;
  },
  { displayName: 'Event' },
);
