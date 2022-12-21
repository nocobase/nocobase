import { Field } from "@formily/core";
import { useField, useFieldSchema } from "@formily/react";
import { useEffect } from "react";
import { useCollection, useCollectionManager } from "../../collection-manager";

export const useFieldTitle = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { getField, } = useCollection();
  const { getCollectionJoinField } = useCollectionManager();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  useEffect(() => {
    if (!field?.title) {
      field.title = collectionField?.uiSchema?.title;
    }
  }, [collectionField?.uiSchema?.title]);
}
