import { observer } from '@formily/react';
import React from 'react';
import Action from './Action';
import { ComposedAction } from './types';

export const ActionLink: ComposedAction = observer(
  (props: any) => {
    return <Action {...props} component={props.component || 'a'} className={'nb-action-link'} />;
  },
  { displayName: 'ActionLink' },
);
