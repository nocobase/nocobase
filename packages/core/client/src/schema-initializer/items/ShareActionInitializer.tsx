import React from 'react';

import { ActionInitializer } from './ActionInitializer';
import {useFieldSchema} from '@formily/react';
import { usePageMode } from '../../block-provider/hooks';
import {getActionContainerLevel} from "../../schema-component/antd/action/utils";


export const ShareActionInitializer = (props) => {
  const fSchema = useFieldSchema();
  const { isPageMode } = usePageMode();
  const level = getActionContainerLevel(fSchema);
  if ((isPageMode && level > 0) || level > 1) {
    return null;
  }

  const schema = {
    title: '{{ t("Share") }}',
    'x-action': 'share',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      useProps: '{{ useShareActionProps }}',
    },
  };

  return <ActionInitializer {...props} schema={schema} />;
};
