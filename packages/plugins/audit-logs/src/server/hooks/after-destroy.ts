import Application from '@nocobase/server';
import { LOG_TYPE_DESTROY } from '../constants';

export function afterDestroy(app: Application) {
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
      Object.keys(model.get()).forEach((key: string) => {
        const field = collection.findField((field) => {
          return field.name === key || field.options.field === key;
        });
        if (field) {
          changes.push({
            field: field.options,
            before: model.get(key),
          });
        }
      });

      //add code for the associations.
      //it will find all the associations.
      // list the values 
      //push to changes.
      const as = collection.model.associations;
      for (const v of Object.keys(as)) {
        if(['createdBy', 'updatedBy'].includes(v)){
          continue;
        }
        //find all  associations,find all changed associations.
        // 1.find the associations fileds.
        const fd = collection.findField((f) => {
          if (f.name == v && (['hasOne', 'belongsTo', 'hasMany', 'belongsToMany'].includes(<string>f.type))) {
            return true;
          }
        });

        //handle the associations.
        if (fd) {
          let fvalue: string = '';

          // 2.read the before values.using the model.get[object] method ,read from database.
          const datas = await model['get' + v[0].toUpperCase() + v.substring(1)]();
          // const datas = await model.get(v);
          let bvalue: string = '';

          //judge whether the object is a list or a object.
          if (datas instanceof Array) {//nn

            // 3.read the after values.which is submit from the front pages.
            for (let t of datas) {
              bvalue += ',' + t.dataValues.id;
            }
            bvalue = bvalue.substring(1);

          } else {//11 or 1n
            bvalue += datas.dataValues.id;
          }

          fd.options.uiSchema['x-component'] = 'Input';

          if (fd.options.uiSchema.title.indexOf('[relation]') == -1) {
            fd.options.uiSchema.title = fd.options.uiSchema.title + ' [relation]';//display tilte r = relationship,a =attribute.
          }

          changes.push({
            field: fd.options,
            after: '',
            before: bvalue,
          });

        }

      }

      await AuditLog.repository.create({
        values: {
          type: LOG_TYPE_DESTROY,
          collectionName: model.constructor.name,
          recordId: model.get(model.constructor.primaryKeyAttribute),
          userId: currentUserId,
          changes,
        },
        transaction,
        hooks: false,
      });
      // if (!options.transaction) {
      //   await transaction.commit();
      // }
    } catch (error) {
      // if (!options.transaction) {
      //   await transaction.rollback();
      // }
    }
  };
}
