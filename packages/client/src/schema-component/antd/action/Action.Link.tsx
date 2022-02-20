import { observer } from '@formily/react';
import React from 'react';
import { Link } from 'react-router-dom';
import Action from './Action';
import { ComposedAction } from './types';

export const ActionLink: ComposedAction = observer((props: any) => {
  return <Action {...props} component={Link} className={'nb-action-link'}/>;
});

export default ActionLink;
