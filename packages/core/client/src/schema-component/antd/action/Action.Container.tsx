/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useActionContext } from '.';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { useOpenModeContext } from '../../../modules/popup/OpenModeProvider';
import { ActionDrawer } from './Action.Drawer';
import { ComposedActionDrawer } from './types';

const PopupLevelContext = React.createContext(0);

export const ActionContainer: ComposedActionDrawer = observer(
  (props: any) => {
    const { getComponentByOpenMode, defaultOpenMode } = useOpenModeContext() || {};
    const { openMode = props.openMode || defaultOpenMode } = useActionContext();
    const popupLevel = React.useContext(PopupLevelContext);
    const currentLevel = popupLevel + 1;

    const Component = getComponentByOpenMode(openMode) || ActionDrawer;

    return (
      <PopupLevelContext.Provider value={currentLevel}>
        <Component footerNodeName={'Action.Container.Footer'} level={currentLevel || 1} {...props} />
      </PopupLevelContext.Provider>
    );
  },
  { displayName: 'ActionContainer' },
);

ActionContainer.Footer = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return <NocoBaseRecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
  },
  { displayName: 'ActionContainer.Footer' },
);

export default ActionContainer;
