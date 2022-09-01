import React from "react";
import { ISchema } from "@formily/react";

import { InitializerWithSwitch } from "./InitializerWithSwitch";

export const CollectionFieldInitializer = (props) => {
    const schema: ISchema = {};
    return <InitializerWithSwitch {...props} schema={schema} type={'x-collection-field'} />;
  };
