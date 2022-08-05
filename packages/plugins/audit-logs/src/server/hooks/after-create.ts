import Application from '@nocobase/server';
import { LOG_TYPE_CREATE } from '../constants';

import { cloneDeep } from 'lodash';

export function afterCreate(app: Application) {
  return async (model, options) => {
    const db = app.db;
    const collection = db.getCollection(model.constructor.name);
    if (!collection || !collection.options.logging) {
      return;
    }
    const transaction = options.transaction;
    const AuditLog = db.getCollection('auditLogs');
    const currentUserId = options?.context?.state?.currentUser?.id;
    try {
      const changes = [];
      const changed = model.changed();
      if (changed) {
        changed.forEach((key: string) => {
          const field = collection.findField((field) => {
            return field.name === key || field.options.field === key;
          });
          if (field && !field.options.hidden) {

            changes.push({
              field: field.options,
              after: model.get(key),
            });
          }
        });
      }

      //add code for the associations.
      //it will find whether the option's values include associations.
      //and then push it into the changes array.
      for (const v in options.values) {
        //find all  associations,find all changed associations.
        // 1.find the associations fileds.
        const fd = collection.findField((f) => {
          if (f.name == v && (['hasOne', 'belongsTo', 'hasMany', 'belongsToMany'].includes(<string>f.type))) {
            return true;
          }
        });

        //not associations ,next.
        if (!fd) {
          continue;
        }

        //fvale =aftervalue,bvalue=beforevalue.
        let fvalue: any ;
        let bvalue: string = '';

        //in create case: no matter it's a array or a object or a id.
        //just log it out.
        fvalue = options.values[v];
        if (!fd.options.hidden) {
          //clonedeep options to another object.
          //set title with desc.display tilte r = relationship,a =attribute.
          const to = cloneDeep(fd.options);
          to.uiSchema['x-component'] = 'Input';
          to.uiSchema.title = to.uiSchema.title + ' [relation]';

          changes.push({
            field: to,
            after: JSON.stringify(fvalue),
            before: bvalue,
          });
        }
      }

      await AuditLog.repository.create({
        values: {
          type: LOG_TYPE_CREATE,
          collectionName: model.constructor.name,
          recordId: model.get(model.constructor.primaryKeyAttribute),
          createdAt: model.get('createdAt'),
          userId: currentUserId,
          changes,
        },
        transaction,
        hooks: false,
      });
    } catch (error) {
      // throw(error);
      console.log(error);

    }
  };
}
