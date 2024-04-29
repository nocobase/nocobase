/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import React from 'react';
import { useFieldTitle } from '../../hooks';
import { RemoteSelect } from '../remote-select';
import useServiceOptions from './useServiceOptions';

export const ReadPretty = observer(
  (props: any) => {
    const service = useServiceOptions(props);
    useFieldTitle();
    return <RemoteSelect.ReadPretty {...props} service={service}></RemoteSelect.ReadPretty>;
  },
  { displayName: 'ReadPretty' },
);
