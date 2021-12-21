import { Context } from '@nocobase/actions';
import { FieldSchemaOptions } from '../field-schema-options';

const fieldActions = {
  async create(ctx: Context, next) {
    const { resourceName, associatedName, associatedIndex, values } = ctx.action.params;

    const fieldRepository = ctx.db
      .getCollection(associatedName)
      .repository.relation(resourceName)
      .of(associatedIndex, 'name');

    const saveValues = new FieldSchemaOptions(values).saveValues;

    await fieldRepository.create({
      values: saveValues,
    });
  },
};
export { fieldActions };
