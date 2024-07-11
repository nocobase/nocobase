/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useActionContext } from '.';
import { useOpenModeContext } from '../../../modules/popup/OpenModeProvider';
import { ComposedActionDrawer } from './types';

export const ActionContainer: ComposedActionDrawer = observer(
  (props: any) => {
    const { openMode } = useActionContext();
    const { getComponentByOpenMode } = useOpenModeContext();

    const Component = getComponentByOpenMode(openMode);

    return <Component footerNodeName={'Action.Container.Footer'} {...props} />;
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
