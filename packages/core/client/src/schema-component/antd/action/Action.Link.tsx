import { observer } from '@formily/react';
import React from 'react';
import classnames from 'classnames';
import Action from './Action';
import { ComposedAction } from './types';

export const ActionLink: ComposedAction = observer(
  (props: any) => {
    return (
      <Action {...props} component={props.component || 'a'} className={classnames('nb-action-link', props.className)} />
    );
  },
  { displayName: 'ActionLink' },
);
