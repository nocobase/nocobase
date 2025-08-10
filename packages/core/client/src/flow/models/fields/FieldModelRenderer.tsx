/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { FlowModelRenderer } from '@nocobase/flow-engine';

export function FieldModelRenderer(props) {
  const { model, id, value, onChange, ['aria-describedby']: ariaDescribedby, ...rest } = props;
  useEffect(() => {
    model.setProps({ id, value, onChange, ['aria-describedby']: ariaDescribedby });
  }, [model, id, value, ariaDescribedby, onChange]);

  return <FlowModelRenderer model={model} {...rest} />;
}
