import { connect, mapReadPretty } from '@formily/react';
import { Action } from '../action';
import { Editable } from './Editable';
import { Nester } from './Nester';
import { ReadPretty } from './ReadPretty';
import { SubTable } from './SubTable';
import { InternalPicker } from './InternalPicker';

export const AssociationField: any = connect(Editable, mapReadPretty(ReadPretty));

AssociationField.SubTable = SubTable;
AssociationField.Nester = Nester;
AssociationField.AddNewer = Action.Container;
AssociationField.Selector = Action.Container;
AssociationField.Viewer = Action.Container;
AssociationField.InternalSelect = InternalPicker;
