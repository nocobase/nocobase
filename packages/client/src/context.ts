import { createContext } from "react";
import { Schema } from "@formily/react";

export const VisibleContext = createContext<any>([]);
export const BlockSchemaContext = createContext<Schema>(null);
