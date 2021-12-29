import { ChildOptions } from '../repository';

export interface SchemaNode {
  name: string;
  'x-uid': string;
  schema: object;
  'x-async'?: boolean;
  childOptions?: ChildOptions;
}

export class UiSchemaNodeDAO {
  schemaNode: SchemaNode;
  constructor(schemaNode: SchemaNode) {
    this.schemaNode = schemaNode;
  }
}
