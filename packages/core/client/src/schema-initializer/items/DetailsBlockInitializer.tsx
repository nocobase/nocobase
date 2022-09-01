import React from "react";
import { TableOutlined } from '@ant-design/icons';

import { useCollectionManager } from "../../collection-manager";
import { createDetailsBlockSchema } from "../utils";
import { DataBlockInitializer } from "./DataBlockInitializer";

export const DetailsBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createDetailsBlockSchema({ collection: item.name, rowKey: collection.filterTargetKey || 'id' });
        insert(schema);
      }}
    />
  );
};
