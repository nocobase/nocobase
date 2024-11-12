/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from '@formily/react';
import { Action } from '../action';
import { Editable } from './Editable';
import { FileSelector } from './FileManager';
import { InternalPicker } from './InternalPicker';
import { Nester } from './Nester';
import { ReadPretty } from './ReadPretty';
import { SubTable } from './SubTable';

export {
  AssociationFieldMode,
  AssociationFieldModeProvider,
  useAssociationFieldModeContext,
} from './AssociationFieldModeProvider';

export const AssociationField: any = connect(Editable, mapReadPretty(ReadPretty));

AssociationField.SubTable = SubTable;
AssociationField.Nester = Nester;
AssociationField.AddNewer = Action.Container;
AssociationField.Selector = Action.Container;
AssociationField.Viewer = Action.Container;
AssociationField.InternalSelect = InternalPicker;
AssociationField.ReadPretty = ReadPretty;
AssociationField.FileSelector = FileSelector;

export { useAssociationFieldContext } from './hooks';
