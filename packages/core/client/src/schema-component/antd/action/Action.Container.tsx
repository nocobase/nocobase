import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useActionContext } from '.';
import { ActionDrawer } from './Action.Drawer';
import { ActionModal } from './Action.Modal';
import { ActionPage } from './Action.Page';
import { ComposedActionDrawer } from './types';

export const ActionContainer: ComposedActionDrawer = observer(
  (props: any) => {
    const { openMode } = useActionContext();
    if (openMode === 'drawer') {
      return <ActionDrawer footerNodeName={'Action.Container.Footer'} {...props} />;
    }
    if (openMode === 'modal') {
      return <ActionModal footerNodeName={'Action.Container.Footer'} {...props} />;
    }
    return <ActionPage footerNodeName={'Action.Container.Footer'} {...props} />;
  },
  { displayName: 'ActionContainer' },
);

ActionContainer.Footer = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
  },
  { displayName: 'ActionContainer.Footer' },
);

export default ActionContainer;
