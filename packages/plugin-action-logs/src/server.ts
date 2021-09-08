import path from 'path';
import Application from '@nocobase/server';
import { afterCreate, afterUpdate, afterDestroy } from './hooks';

export default async function (this: Application) {
  const { database } = this;
  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });
  database.on('afterCreate', afterCreate);
  database.on('afterUpdate', afterUpdate);
  database.on('afterDestroy', afterDestroy);
}
