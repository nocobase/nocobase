/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import React, { createContext, useCallback, useMemo } from 'react';
import { AssociationSelect } from '../association-select/AssociationSelect';
import { InternalFileManager } from './FileManager';
import { InternalCascadeSelect } from './InternalCascadeSelect';
import { InternalNester } from './InternalNester';
import { InternalPicker } from './InternalPicker';
import { InternalPopoverNester } from './InternalPopoverNester';
import { InternalSubTable } from './InternalSubTable';

export enum AssociationFieldMode {
  Picker = 'Picker',
  Nester = 'Nester',
  PopoverNester = 'PopoverNester',
  Select = 'Select',
  SubTable = 'SubTable',
  FileManager = 'FileManager',
  CascadeSelect = 'CascadeSelect',
}

interface AssociationFieldModeProviderProps {
  modeToComponent: Partial<Record<AssociationFieldMode, React.FC | ((originalCom: React.FC) => React.FC)>>;
}

const defaultModeToComponent = {
  Picker: InternalPicker,
  Nester: InternalNester,
  PopoverNester: InternalPopoverNester,
  Select: AssociationSelect,
  SubTable: InternalSubTable,
  FileManager: InternalFileManager,
  CascadeSelect: InternalCascadeSelect,
};

const AssociationFieldModeContext = createContext<{
  modeToComponent: AssociationFieldModeProviderProps['modeToComponent'];
  getComponent: (mode: AssociationFieldMode) => React.FC;
}>({
  modeToComponent: defaultModeToComponent,
  getComponent: (mode: AssociationFieldMode) => {
    return defaultModeToComponent[mode];
  },
});

export const AssociationFieldModeProvider: React.FC<AssociationFieldModeProviderProps> = (props) => {
  const modeContext = useAssociationFieldModeContext();
  const modeToComponent = useMemo(
    () => ({ ...modeContext.modeToComponent, ...props.modeToComponent }),
    [modeContext.modeToComponent, props.modeToComponent],
  );

  const getComponent = useCallback(
    (mode: AssociationFieldMode) => {
      const component = modeToComponent[mode];

      if (_.isFunction(component)) {
        return component(defaultModeToComponent[mode]) as React.FC;
      }

      return component || defaultModeToComponent[mode];
    },
    [modeToComponent],
  );

  const value = useMemo(() => ({ modeToComponent, getComponent }), [getComponent, modeToComponent]);
  return <AssociationFieldModeContext.Provider value={value}>{props.children}</AssociationFieldModeContext.Provider>;
};

export const useAssociationFieldModeContext = () => {
  return React.useContext(AssociationFieldModeContext);
};
