/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useMemo } from 'react';
import { AssociationSelect } from './AssociationSelect';
import { InternalFileManager } from './FileManager';
import { InternalCascadeSelect } from './InternalCascadeSelect';
import { InternalNester } from './InternalNester';
import { InternalPicker } from './InternalPicker';
import { InternalPopoverNester } from './InternalPopoverNester';
import { InternalSubTable } from './InternalSubTable';
import { ReadPrettyInternalTag } from './InternalTag';

export enum AssociationFieldMode {
  Picker = 'Picker',
  Nester = 'Nester',
  PopoverNester = 'PopoverNester',
  Select = 'Select',
  SubTable = 'SubTable',
  FileManager = 'FileManager',
  CascadeSelect = 'CascadeSelect',
  Tag = 'Tag',
}

interface AssociationFieldModeProviderProps {
  modeToComponent: Partial<Record<AssociationFieldMode, React.FC>>;
}

const defaultModeToComponent = {
  Picker: InternalPicker,
  Nester: InternalNester,
  PopoverNester: InternalPopoverNester,
  Select: AssociationSelect,
  SubTable: InternalSubTable,
  FileManager: InternalFileManager,
  CascadeSelect: InternalCascadeSelect,
  Tag: ReadPrettyInternalTag,
};

const AssociationFieldModeContext = createContext<{
  modeToComponent: AssociationFieldModeProviderProps['modeToComponent'];
  getComponent: (mode: AssociationFieldMode) => React.FC;
  getDefaultComponent: (mode: AssociationFieldMode) => React.FC;
}>({
  modeToComponent: defaultModeToComponent,
  getComponent: (mode: AssociationFieldMode) => {
    return defaultModeToComponent[mode];
  },
  getDefaultComponent: (mode: AssociationFieldMode) => {
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
      return modeToComponent[mode] || defaultModeToComponent[mode];
    },
    [modeToComponent],
  );

  const getDefaultComponent = useCallback((mode: AssociationFieldMode) => {
    return defaultModeToComponent[mode];
  }, []);

  const value = useMemo(
    () => ({ modeToComponent, getComponent, getDefaultComponent }),
    [getComponent, modeToComponent, getDefaultComponent],
  );
  return <AssociationFieldModeContext.Provider value={value}>{props.children}</AssociationFieldModeContext.Provider>;
};

export const useAssociationFieldModeContext = () => {
  return React.useContext(AssociationFieldModeContext);
};
