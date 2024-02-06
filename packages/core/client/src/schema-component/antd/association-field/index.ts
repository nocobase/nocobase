import { connect, mapProps, mapReadPretty, useFieldSchema } from '@formily/react';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { Action } from '../action';
import { Editable } from './Editable';
import { InternalPicker } from './InternalPicker';
import { Nester } from './Nester';
import { ReadPretty } from './ReadPretty';
import { SubTable } from './SubTable';

export const AssociationField: any = connect(
  Editable,
  mapReadPretty(ReadPretty),
  mapProps((props: any, field) => {
    const { getCollection, getCollectionJoinField } = useCollectionManager();
    const { getField } = useCollection();
    const fieldSchema = useFieldSchema();
    const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema.name as string);
    const targetCollection = getCollection(collectionField?.target);
    return {
      ...props,
      fieldNames: { ...props.fieldNames, value: collectionField?.targetKey || targetCollection.getPrimaryKey() },
    };
  }),
);

AssociationField.SubTable = SubTable;
AssociationField.Nester = Nester;
AssociationField.AddNewer = Action.Container;
AssociationField.Selector = Action.Container;
AssociationField.Viewer = Action.Container;
AssociationField.InternalSelect = InternalPicker;
