import { DataTypes, Field } from '@nocobase/database';

export class MarkdownVditorField extends Field {
  get dataType() {
    return DataTypes.TEXT;
  }
}
