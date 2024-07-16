import React, { FC } from "react";

import { CollectionFieldsItemProps, getInitializerItemsByFields, useCollectionFieldContext } from "../utils";
import { SchemaInitializerItemGroup } from "../../../application/schema-initializer";

export const DisplayFields: FC<CollectionFieldsItemProps> = (props) => {
  const callbackContext = useCollectionFieldContext();
  const { t, collection } = callbackContext;
  const fields = collection.getFields();
  const children = getInitializerItemsByFields(props, fields, callbackContext);

  return <SchemaInitializerItemGroup title={t('Display fields')} children={children} />
}
