export interface TargetPosition {
  type: 'before' | 'after';
  target: string;
}
export interface ChildOptions {
  parentUid: string;
  parentPath?: string[];
  type: string;
  position?: 'first' | 'last' | TargetPosition;
  sort?: number;
}

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
