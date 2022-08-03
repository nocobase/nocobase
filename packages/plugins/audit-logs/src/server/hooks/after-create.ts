import Application from '@nocobase/server';
import { LOG_TYPE_CREATE } from '../constants';

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


        //handle the associations.
        if (fd) {
          console.log(v);
          console.log(typeof options.values[v]);
          let fvalue: string = '';

          let bvalue: string = '';

          //judge whether the object is a list or a object.
          if (options.values[v] instanceof Array) {//nn

            // 3.read the after values.which is submit from the front pages.
            fvalue = ''.concat(options.values[v]);

          } else {//11 or 1n
            fvalue += options.values[v].id

          }

          // 4.judge whether the before != after.
          // 5.push the != datas into the changes array.then into the database.
          if (!fd.options.hidden) {
            fd.options.uiSchema['x-component'] = 'Input';

            if (fd.options.uiSchema.title.indexOf('[relation]') == -1) {
              fd.options.uiSchema.title = fd.options.uiSchema.title + ' [relation]';//display tilte r = relationship,a =attribute.
            }

            changes.push({
              field: fd.options,
              after: fvalue,
              before: bvalue,
            });
          }

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
    } catch (error) { }
  };
}
