import { connect, mapReadPretty, mapProps, useFieldSchema } from '@formily/react';
import { Action } from '../action';
import { Editable } from './Editable';
import { InternalPicker } from './InternalPicker';
import { Nester } from './Nester';
import { ReadPretty } from './ReadPretty';
import { SubTable } from './SubTable';
import { useCollectionManager, useCollection } from '../../../collection-manager';

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
      fieldNames: { ...props.fieldNames, value: collectionField?.targetKey || targetCollection.primaryKey },
    };
  }),
);

AssociationField.SubTable = SubTable;
AssociationField.Nester = Nester;
AssociationField.AddNewer = Action.Container;
AssociationField.Selector = Action.Container;
AssociationField.Viewer = Action.Container;
AssociationField.InternalSelect = InternalPicker;
