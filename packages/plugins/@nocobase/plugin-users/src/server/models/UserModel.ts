import { Model } from '@nocobase/database';

export class UserModel extends Model {
  desensitize() {
    const { fields } = (this.constructor as typeof UserModel).collection;
    const result = (this.constructor as typeof UserModel).build({}, { isNewRecord: this.isNewRecord });
    for (const [name, value] of Object.entries(this.get())) {
      const field = fields.get(name);
      if (field && !field.options.hidden) {
        result.set(name, value);
      }
    }
    return result;
  }
}
