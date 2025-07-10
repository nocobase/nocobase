/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Repository } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { CollectionsGraph } from '@nocobase/utils';
import lodash from 'lodash';
import { CollectionModel } from '../models/collection';

interface LoadOptions {
  filter?: any;
  skipExist?: boolean;
}

export class CollectionRepository extends Repository {
  private app: Application;

  setApp(app) {
    this.app = app;
  }

  async load(options: LoadOptions = {}) {
    this.database.logger.debug('loading collections...');

    const { filter, skipExist } = options;
    const instances = (await this.find({ filter, appends: ['fields'] })) as CollectionModel[];

    const graphlib = CollectionsGraph.graphlib();

    const graph = new graphlib.Graph();

    const nameMap: {
      [key: string]: CollectionModel;
    } = {};

    const viewCollections = [];

    // set all graph nodes
    for (const instance of instances) {
      graph.setNode(instance.get('name'));
      if (instance.get('view') || instance.get('sql')) {
        viewCollections.push(instance.get('name'));
      }

      this.database.collectionsSort.set(instance.get('name'), instance.get('sort'));
    }

    // set graph edges by inherits
    for (const instance of instances) {
      const collectionName = instance.get('name');

      nameMap[collectionName] = instance;

      if (instance.get('inherits')) {
        for (const parent of instance.get('inherits')) {
          graph.setEdge(parent, collectionName);
        }
      }
    }

    if (graph.nodeCount() === 0) return;

    // check if graph is acyclic, throw error if not
    if (!graphlib.alg.isAcyclic(graph)) {
      const cycles = graphlib.alg.findCycles(graph);
      throw new Error(`Cyclic dependencies: ${cycles.map((cycle) => cycle.join(' -> ')).join(', ')}`);
    }

    // sort graph nodes
    const sortedNames = graphlib.alg.topsort(graph);

    const lazyCollectionFields = new Map<string, Array<string>>();

    for (const instanceName of sortedNames) {
      if (!nameMap[instanceName]) continue;

      // skip load collection field
      // can be a true value or an array of field names
      const skipField = (() => {
        // skip load collection field if collection is view
        if (viewCollections.includes(instanceName)) {
          return true;
        }

        const fields = nameMap[instanceName].get('fields');

        return fields
          .filter((field) => field['type'] === 'belongsTo' || field['type'] === 'belongsToMany')
          .map((field) => field.get('name'));
      })();

      if (lodash.isArray(skipField) && skipField.length) {
        lazyCollectionFields.set(instanceName, skipField);
      }

      this.database.logger.trace(`load ${instanceName} collection`, {
        submodule: 'CollectionRepository',
        method: 'load',
      });

      this.app.setMaintainingMessage(`load ${instanceName} collection`);

      await nameMap[instanceName].load({ skipField });
    }

    const fieldWithSourceAttributes = new Map<string, Array<string>>();

    // load view fields
    for (const viewCollectionName of viewCollections) {
      this.database.logger.trace(`load collection fields`, {
        submodule: 'CollectionRepository',
        method: 'load',
        viewCollectionName,
      });

      const skipField = (() => {
        const fields = nameMap[viewCollectionName].get('fields');

        return fields
          .filter((field) => {
            if (field.options?.source && (field['type'] === 'belongsTo' || field['type'] === 'belongsToMany')) {
              return true;
            }

            return false;
          })
          .map((field) => field.get('name'));
      })();

      this.app.setMaintainingMessage(`load ${viewCollectionName} collection fields`);

      if (lodash.isArray(skipField) && skipField.length) {
        fieldWithSourceAttributes.set(viewCollectionName, skipField);
      }

      await nameMap[viewCollectionName].loadFields({ skipField });
    }

    // load lazy collection field
    for (const [collectionName, skipField] of lazyCollectionFields) {
      this.database.logger.trace(`load collection fields`, {
        submodule: 'CollectionRepository',
        method: 'load',
        collectionName,
      });
      this.app.setMaintainingMessage(`load ${collectionName} collection fields`);
      await nameMap[collectionName].loadFields({ includeFields: skipField });
    }

    // load source attribute fields
    for (const [collectionName, skipField] of fieldWithSourceAttributes) {
      this.database.logger.trace(`load collection fields`, {
        submodule: 'CollectionRepository',
        method: 'load',
        collectionName,
      });

      this.app.setMaintainingMessage(`load ${collectionName} collection fields`);
      await nameMap[collectionName].loadFields({ includeFields: skipField });
    }

    this.database.logger.debug('collections loaded');
  }

  async db2cmCollections(collectionNames: string[]) {
    await Promise.all(collectionNames.map((collectionName) => this.db2cm(collectionName)));
  }

  async db2cm(collectionName: string) {
    const collection = this.database.getCollection(collectionName);

    const options = collection.options;
    const fields = [];

    for (const [name, field] of collection.fields) {
      fields.push({
        name,
        ...field.options,
      });
    }

    const collectionOptions = options;

    if (collectionOptions.schema && collectionOptions.schema == (this.database.options.schema || 'public')) {
      delete collectionOptions.schema;
    }

    const existCollection = await this.findOne({ filter: { name: collectionName } });

    if (existCollection) {
      delete collectionOptions.fields;
      await this.update({
        filter: { key: existCollection.key },
        values: {
          ...collectionOptions,
          from: 'db2cm',
        },
      });

      const existingFields = await existCollection.getFields();
      const existingFieldMap = new Map(existingFields.map((field) => [field.name, field]));

      const fieldsToUpdate = [];
      const fieldsToCreate = [];

      for (const field of fields) {
        if (existingFieldMap.has(field.name)) {
          fieldsToUpdate.push({
            filter: { name: field.name, collectionName },
            values: field,
          });
        } else {
          fieldsToCreate.push({
            ...field,
            collectionName,
          });
        }
      }

      if (fieldsToUpdate.length > 0) {
        await Promise.all(fieldsToUpdate.map((updateData) => this.database.getRepository('fields').update(updateData)));
      }

      if (fieldsToCreate.length > 0) {
        await Promise.all(
          fieldsToCreate.map((createData) => this.database.getRepository('fields').create({ values: createData })),
        );
      }
    } else {
      await this.create({
        values: {
          ...collectionOptions,
          fields,
          from: 'db2cm',
        },
      });
    }
  }
}
