import Application from '@nocobase/server';
import { LOG_TYPE_DESTROY } from '../constants';

import { cloneDeep } from 'lodash';

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

        //exclude the system associations createdBy,updatedBy.
        if (['createdBy', 'updatedBy'].includes(v)) {
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
        if (!fd) {
          continue;
        }

        //fvale =aftervalue,bvalue=beforevalue.
        let fvalue: string = '';
        let bvalue: Array<string> = [];

        // 2.read the before values.using the model.get[object] method ,read from database.
        //get the association getter get the association'value.
        const association = model.constructor.associations[v];
        const getAccessor = association.accessors.get;
        const datas = transaction ? await model[getAccessor]({ transaction }) : await model[getAccessor]();

        //in destory case.just read all the relations and log out the id.
        if (datas instanceof Array) {
          for (let t of datas) {
            bvalue.push(t.dataValues.id);
          }
        } else {
          bvalue.push(datas.dataValues.id);
        }

        //clonedeep options to another object.
        //set title with desc.display tilte r = relationship,a =attribute.
        const to = cloneDeep(fd.options);
        to.uiSchema['x-component'] = 'Input';
        if(to.uiSchema.title){
          to.uiSchema.title += ' [relation]';
        }

        changes.push({
          field: to,
          after: '',
          before: JSON.stringify(bvalue),
        });
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
      console.log(error);
      // if (!options.transaction) {
      //   await transaction.rollback();
      // }
    }
  };
}
