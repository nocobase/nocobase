import Application from '@nocobase/server';
import { Model } from '@nocobase/database';
import { LOG_TYPE_UPDATE } from '../constants';

import { cloneDeep, isEqual } from 'lodash';

function isStringOrNumber(value: any) {
  return typeof value === 'string' || typeof value === 'number';
}

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

      //not a association, continue.
      if (!fd) {
        continue;
      }

      let fvalue: Array<string> = [];
      let bvalue: Array<string> = [];
      //the flag for the bevalue=fvalue. equal=true.
      let equalFlag = true;

      // 2.read the before values.using the model.get[object] method ,read from database.
      //get the association getter get the association'value.
      const association = model.constructor.associations[v];
      const getAccessor = association.accessors.get;
      const datas = transaction ? await model[getAccessor]({ transaction }) : await model[getAccessor]();

      //create the values array.
      if (datas instanceof Array) {
        for (let t of datas) {
          bvalue.push(t.dataValues.id);
        }
      } else {
        bvalue.push(datas.dataValues.id);
      }

      //update case is the most complex situation.it may not have the ids.
      if (options.values[v] instanceof Array) {//nn,1n
        // 3.read the after values.which is submit from the front pages,api,elswhere.
        for (const t of options.values[v]) {

          //is string or number treat as id value.
          if (isStringOrNumber(t)) {
            fvalue.push(t);
            continue;
          }

          //if a object.
          if (t instanceof Object) {
            //have id, diffrent will log.
            if (t.id) {
              fvalue.push(t.id);
            }
            //no id,will log.
            if (!t.id && equalFlag) {
              equalFlag = false;
              break;
            }
          }
        }

        if (equalFlag && !isEqual(bvalue, fvalue)) {
          equalFlag = false;
        }

      } else {//11

        //if id,compare,diff log .no id,log.
        if (options.values[v].id) {
          equalFlag = bvalue.includes(options.values[v].id);
        } else {
          equalFlag = false;
        }

      }

      // 4.judge whether the before != after.
      // 5.push the != datas into the changes array.then into the database.
      if (!fd.options.hidden && !equalFlag) {

        //clonedeep options to another object.
        //set title with desc.display tilte r = relationship,a =attribute.
        const to = cloneDeep(fd.options);
        to.uiSchema['x-component'] = 'Input';
        if(to.uiSchema.title){
          to.uiSchema.title += ' [relation]';
        }

        changes.push({
          field: to,
          after: JSON.stringify(options.values[v]),
          before: JSON.stringify(bvalue),
        });
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
      console.log(error);
      // if (!options.transaction) {
      //   await transaction.rollback();
      // }
    }
  };
}
