import Application from '@nocobase/server';
import { Model } from '@nocobase/database';
import { LOG_TYPE_UPDATE } from '../constants';

export function afterUpdate(app: Application) {
  return async (model, options) => {
    const db = app.db;
    const collection = db.getCollection(model.constructor.name);
    if (!collection || !collection.options.logging) {
      return;
    }
    const changed = model.changed();
    if (!changed) {
      return;
    }
    const transaction = options.transaction;
    const AuditLog = db.getCollection('auditLogs');
    const currentUserId = options?.context?.state?.currentUser?.id;
    const changes = [];

    //here it's using the changed to get all the values should be loged.but changed list did't involve the associations.
    //so let's push the associations chenged into the changes.
    changed.forEach((key: string) => {
      const field = collection.findField((field) => {
        return field.name === key || field.options.field === key;
      });
      if (field && !field.options.hidden && model.get(key) != model.previous(key)) {

        if (field.options.uiSchema.title.indexOf('[attribute]') == -1) {
          field.options.uiSchema.title = field.options.uiSchema.title + ' [attribute]';//display tilte r = relationship,a =attribute.
        }

        changes.push({
          field: field.options,
          after: model.get(key),
          before: model.previous(key),
        });
      }
    });

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

        // 2.read the before values.using the model.get[object] method ,read from database.
        const datas = await model['get' + v[0].toUpperCase() + v.substring(1)]();
        // const datas = await model.get(v);
        let bvalue: string = '';

        //judge whether the object is a list or a object.
        if (options.values[v] instanceof Array) {//nn

          // 3.read the after values.which is submit from the front pages.
          fvalue = ''.concat(options.values[v]);

          for (let t of datas) {
            bvalue += ',' + t.dataValues.id;
          }
          bvalue = bvalue.substring(1);

        } else {//11 or 1n

          fvalue += options.values[v].id
          bvalue += datas.dataValues.id;

        }

        // 4.judge whether the before != after.
        // 5.push the != datas into the changes array.then into the database.
        if (!fd.options.hidden && bvalue.trim().toLowerCase() != fvalue.trim().toLowerCase()) {
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

    //according to the changes list. create the datas.
    if (!changes.length) {
      return;
    }
    try {
      await AuditLog.repository.create({
        values: {
          type: LOG_TYPE_UPDATE,
          collectionName: model.constructor.name,
          recordId: model.get(model.constructor.primaryKeyAttribute),
          createdAt: model.get('updatedAt'),
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
