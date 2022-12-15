import { observer, useFieldSchema } from '@formily/react';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useActionContext } from '.';
import { ComposedActionDrawer } from './types';
import { usePageMode } from '../../../block-provider/hooks';

export const ActionPage: ComposedActionDrawer = observer((props) => {
  const { getPageSearchStr } = usePageMode();
  const history = useHistory();
  const { visible } = useActionContext();
  const schema = useFieldSchema();

  if (visible) {
    history.push({
      search: getPageSearchStr(schema),
    });
    return null;
  }
  return null;
});

export default ActionPage;
