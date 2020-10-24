import { Model } from '@nocobase/database';

export class CollectionModel extends Model {
  async modelInit() {
    if (['collections', 'fields'].includes(this.get('name'))) {
      return;
    }
    const Field = this.database.getModel('fields');
    const fields = await Field.findAll();
    this.database.table({
      name: this.get('name'),
      fields: fields.map(field => {
        return {
          name: field.get('name'),
          type: field.get('type'),
        };
      }),
    });
    console.log('modelInit', this.get('name'));
  }
}

export default CollectionModel;
