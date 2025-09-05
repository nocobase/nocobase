/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash, { flatten } from 'lodash';
import { Association, HasOne, HasOneOptions, Includeable, Model, ModelStatic, Op, Transaction } from 'sequelize';
import Database from '../database';
import { appendChildCollectionNameAfterRepositoryFind } from '../listeners/append-child-collection-name-after-repository-find';
import { OptionsParser } from '../options-parser';
import { Collection } from '../collection';
import { processIncludes } from '../utils';

interface EagerLoadingNode {
  model: ModelStatic<any>;
  association: Association;
  attributes: Array<string>;
  rawAttributes: Array<string>;
  children: Array<EagerLoadingNode>;
  parent?: EagerLoadingNode;
  instances?: Array<Model>;
  order?: any;
  where?: any;
  inspectInheritAttribute?: boolean;
  includeOptions?: any;
}

const pushAttribute = (node, attribute) => {
  if (lodash.isArray(node.attributes) && !node.attributes.includes(attribute)) {
    node.attributes.push(attribute);
  }
};

const EagerLoadingNodeProto = {
  afterBuild(db: Database) {
    const collection = db.modelCollection.get(this.model);

    if (collection && collection.isParent()) {
      if (!this.attributes) {
        this.attributes = {
          include: [],
        };
      }

      OptionsParser.appendInheritInspectAttribute(
        lodash.isArray(this.attributes) ? this.attributes : this.attributes.include,
        collection,
      );

      this.inspectInheritAttribute = true;
    }
  },
};

const queryParentSQL = (options: {
  db: Database;
  nodeIds: any[];
  collection: Collection;
  foreignKey: string;
  targetKey: string;
}) => {
  const { collection, db, nodeIds } = options;
  const tableName = collection.quotedTableName();
  const { foreignKey, targetKey } = options;
  const foreignKeyField = collection.model.rawAttributes[foreignKey].field;
  const targetKeyField = collection.model.rawAttributes[targetKey].field;

  const queryInterface = db.sequelize.getQueryInterface();
  const q = queryInterface.quoteIdentifier.bind(queryInterface);
  return `WITH RECURSIVE cte AS (
      SELECT ${q(targetKeyField)}, ${q(foreignKeyField)}
      FROM ${tableName}
      WHERE ${q(targetKeyField)} IN (${nodeIds.join(',')})
      UNION ALL
      SELECT t.${q(targetKeyField)}, t.${q(foreignKeyField)}
      FROM ${tableName} AS t
      INNER JOIN cte ON t.${q(targetKeyField)} = cte.${q(foreignKeyField)}
      )
      SELECT ${q(targetKeyField)} AS ${q(targetKey)}, ${q(foreignKeyField)} AS ${q(foreignKey)} FROM cte`;
};

export class EagerLoadingTree {
  public root: EagerLoadingNode;
  db: Database;
  private rootQueryOptions: any = {};

  constructor(root: EagerLoadingNode) {
    this.root = root;
  }

  static buildFromSequelizeOptions(options: {
    model: ModelStatic<any>;
    rootAttributes: Array<string>;
    rootOrder?: any;
    rootQueryOptions?: any;
    includeOption: Includeable | Includeable[];
    db: Database;
  }): EagerLoadingTree {
    const { model, rootAttributes, includeOption, db, rootQueryOptions } = options;

    const buildNode = (node) => {
      Object.setPrototypeOf(node, EagerLoadingNodeProto);
      node.afterBuild(db);
      return node;
    };

    const root = buildNode({
      model,
      association: null,
      rawAttributes: lodash.cloneDeep(rootAttributes),
      attributes: lodash.cloneDeep(rootAttributes),
      order: options.rootOrder,
      children: [],
    });

    const traverseIncludeOption = (includeOption, eagerLoadingTreeParent) => {
      const includeOptions = lodash.castArray(includeOption);

      if (includeOption.length > 0) {
        const modelPrimaryKey = eagerLoadingTreeParent.model.primaryKeyAttribute;
        pushAttribute(eagerLoadingTreeParent, modelPrimaryKey);
      }

      for (const include of includeOptions) {
        // skip fromFilter include option
        if (include.fromFilter) {
          continue;
        }

        const association = lodash.isString(include.association)
          ? eagerLoadingTreeParent.model.associations[include.association]
          : include.association;

        if (!association) {
          throw new Error(
            `Association "${include.association}" not found in model "${eagerLoadingTreeParent.model.name}"`,
          );
        }

        const associationType = association.associationType;

        const child = buildNode({
          model: association.target,
          association,
          rawAttributes: lodash.cloneDeep(include.attributes),
          attributes: lodash.cloneDeep(include.attributes),
          parent: eagerLoadingTreeParent,
          where: include.where,
          children: [],
          includeOption: include.options || {},
        });

        if (associationType == 'HasOne' || associationType == 'HasMany') {
          const { sourceKey, foreignKey } = association;

          pushAttribute(eagerLoadingTreeParent, sourceKey);
          pushAttribute(child, foreignKey);
        }

        if (associationType == 'BelongsTo') {
          const { targetKey, foreignKey } = association;

          pushAttribute(eagerLoadingTreeParent, foreignKey);
          pushAttribute(child, targetKey);
        }

        if (associationType == 'BelongsToMany') {
          const { sourceKey } = association;
          pushAttribute(eagerLoadingTreeParent, sourceKey);
        }

        eagerLoadingTreeParent.children.push(child);

        if (include.include) {
          traverseIncludeOption(include.include, child);
        }
      }
    };

    traverseIncludeOption(includeOption, root);

    const tree = new EagerLoadingTree(root);
    tree.db = db;
    tree.rootQueryOptions = rootQueryOptions;
    return tree;
  }

  async load(transaction?: Transaction) {
    const result = {};

    const orderOption = (association) => {
      const targetModel = association.target;
      const order = [];

      if (targetModel.primaryKeyAttribute && targetModel.rawAttributes[targetModel.primaryKeyAttribute].autoIncrement) {
        order.push([targetModel.primaryKeyAttribute, 'ASC']);
      }

      return order;
    };

    const loadRecursive = async (node, ids = []) => {
      let instances = [];

      if (!node.parent) {
        // load root instances
        const rootInclude = this.rootQueryOptions?.include || node.includeOption;

        const includeForFilter = rootInclude.filter((include) => {
          return (
            Object.keys(include.where || {}).length > 0 ||
            JSON.stringify(this.rootQueryOptions?.filter)?.includes(include.association)
          );
        });

        const isBelongsToAssociationOnly = (includes, model) => {
          for (const include of includes) {
            const association = model.associations[include.association];
            if (!association) {
              return false;
            }

            if (association.associationType != 'BelongsTo') {
              return false;
            }

            if (!isBelongsToAssociationOnly(include.include || [], association.target)) {
              return false;
            }
          }

          return true;
        };

        const belongsToAssociationsOnly = isBelongsToAssociationOnly(includeForFilter, node.model);

        if (belongsToAssociationsOnly) {
          instances = await node.model.findAll({
            ...this.rootQueryOptions,
            attributes: node.attributes,
            distinct: true,
            include: includeForFilter,
            transaction,
          });
        } else {
          const primaryKeyField = node.model.primaryKeyField || node.model.primaryKeyAttribute;

          if (!primaryKeyField) {
            throw new Error(`Model ${node.model.name} does not have primary key`);
          }

          // find all ids
          const ids = (
            await node.model.findAll({
              ...this.rootQueryOptions,
              includeIgnoreAttributes: false,
              attributes: [primaryKeyField],
              group: `${node.model.name}.${primaryKeyField}`,
              transaction,
              include: processIncludes(includeForFilter, node.model),
            } as any)
          ).map((row) => {
            return { row, pk: row[primaryKeyField] };
          });

          const findOptions = {
            where: { [primaryKeyField]: ids.map((i) => i.pk) },
            attributes: node.attributes,
          };

          if (node.order) {
            findOptions['order'] = node.order;
          }

          instances = await node.model.findAll({
            ...findOptions,
            transaction,
          });
        }

        // clear filter association value
        const associations = node.model.associations;
        for (const [name, association] of Object.entries(associations)) {
          // if ((association as any).associationType === 'belongsToArray') {
          //   continue;
          // }
          for (const instance of instances) {
            delete instance[name];
            delete instance.dataValues[name];
          }
        }
      } else if (ids.length > 0) {
        const association = node.association;
        const associationType = association.associationType;

        let params: any = {};

        const otherFindOptions = lodash.pick(node.includeOption, ['sort']) || {};

        const collection = this.db.modelCollection.get(node.model);

        if (collection && !lodash.isEmpty(otherFindOptions)) {
          const parser = new OptionsParser(otherFindOptions, {
            collection,
          });

          params = parser.toSequelizeParams();
        }

        if (associationType == 'HasOne' || associationType == 'HasMany') {
          const foreignKey = association.foreignKey;
          const foreignKeyValues = node.parent.instances.map((instance) => instance.get(association.sourceKey));

          let where: any = { [foreignKey]: foreignKeyValues };

          if (node.where) {
            where = {
              [Op.and]: [where, node.where],
            };
          }

          const findOptions = {
            where,
            attributes: node.attributes,
            order: params.order || orderOption(association),
            transaction,
          };

          instances = await node.model.findAll(findOptions);
        }

        if (associationType === 'BelongsToArray') {
          const targetKey = association.targetKey;
          const targetKeyValues = node.parent.instances.map((instance) => {
            return instance.get(association.foreignKey);
          });

          let where: any = { [targetKey]: Array.from(new Set(flatten(targetKeyValues))) };

          if (node.where) {
            where = {
              [Op.and]: [where, node.where],
            };
          }

          const findOptions = {
            where,
            attributes: node.attributes,
            order: params.order || orderOption(association),
            transaction,
          };

          instances = await node.model.findAll(findOptions);
        }

        if (associationType == 'BelongsTo') {
          const foreignKey = association.foreignKey;
          const parentInstancesForeignKeyValues = node.parent.instances.map((instance) => instance.get(foreignKey));

          const collection = this.db.modelCollection.get(node.model);

          instances = await node.model.findAll({
            transaction,
            where: {
              [association.targetKey]: parentInstancesForeignKeyValues,
            },
            attributes: node.attributes,
          });

          // load parent instances recursively
          if (node.includeOption.recursively && instances.length > 0) {
            const targetKey = association.targetKey;
            const sql = queryParentSQL({
              db: this.db,
              collection,
              foreignKey,
              targetKey,
              nodeIds: instances.map((instance) => instance.get(targetKey)),
            });

            const results = await this.db.sequelize.query(sql, {
              type: 'SELECT',
              transaction,
            });

            const parentInstances = await node.model.findAll({
              transaction,
              where: {
                [association.targetKey]: results.map((result) => result[targetKey]),
              },
              attributes: node.attributes,
            });

            const setInstanceParent = (instance) => {
              const parentInstance = parentInstances.find(
                (parentInstance) => parentInstance.get(targetKey) == instance.get(foreignKey),
              );
              if (!parentInstance) {
                return;
              }

              setInstanceParent(parentInstance);
              instance[association.as] = instance.dataValues[association.as] = parentInstance;
            };

            for (const instance of instances) {
              setInstanceParent(instance);
            }
          }
        }

        if (associationType == 'BelongsToMany') {
          const foreignKeyValues = node.parent.instances.map((instance) => instance.get(association.sourceKey));

          const hasOneOptions: HasOneOptions = {
            as: '_pivot_',
            foreignKey: association.otherKey,
            sourceKey: association.targetKey,
          };
          if (association.through.scope) {
            hasOneOptions.scope = association.through.scope;
          }
          const pivotAssoc = new HasOne(association.target, association.through.model, hasOneOptions);

          instances = await node.model.findAll({
            transaction,
            attributes: node.attributes,
            include: [
              {
                association: pivotAssoc,
                where: {
                  [association.foreignKey]: foreignKeyValues,
                },
              },
            ],
            order: params.order || orderOption(association),
          });
        }
      }

      node.instances = instances;

      for (const child of node.children) {
        const modelPrimaryKey = node.model.primaryKeyField || node.model.primaryKeyAttribute;
        const nodeIds = instances.map((instance) => instance.get(modelPrimaryKey));
        await loadRecursive(child, nodeIds);
      }

      // merge instances to parent
      if (!node.parent) {
        return;
      } else {
        const association = node.association;
        const associationType = association.associationType;

        const setParentAccessor = (parentInstance) => {
          const key = association.as;

          if (!key) {
            return;
          }

          const children = parentInstance.getDataValue(association.as);

          if (association.isSingleAssociation) {
            const isEmpty = !children;
            parentInstance[key] = parentInstance.dataValues[key] = isEmpty ? null : children;
          } else {
            const isEmpty = !children || children.length == 0;
            parentInstance[key] = parentInstance.dataValues[key] = isEmpty ? [] : children;
          }
        };

        if (associationType == 'HasMany' || associationType == 'HasOne') {
          const foreignKey = association.foreignKey;
          const sourceKey = association.sourceKey;

          for (const instance of node.instances) {
            const parentInstance = node.parent.instances.find(
              (parentInstance) => parentInstance.get(sourceKey) == instance.get(foreignKey),
            );

            if (parentInstance) {
              if (associationType == 'HasMany') {
                const children = parentInstance.getDataValue(association.as);
                if (!children) {
                  parentInstance.setDataValue(association.as, [instance]);
                } else {
                  children.push(instance);
                }
              }

              if (associationType == 'HasOne') {
                const key = association.options.realAs || association.as;
                parentInstance[key] = parentInstance.dataValues[key] = instance;
              }
            }
          }
        }

        if (associationType === 'BelongsToArray') {
          const { foreignKey, targetKey } = association;

          const instanceMap = node.instances.reduce((mp: { [targetKey: string]: Model }, instance: Model) => {
            mp[instance.get(targetKey)] = instance;
            return mp;
          }, {});

          node.parent.instances.forEach((parentInstance: Model) => {
            const targetKeys = parentInstance.getDataValue(foreignKey);
            parentInstance.setDataValue(
              association.as,
              targetKeys?.map((targetKey: any) => instanceMap[targetKey]).filter(Boolean),
            );
          });
        }

        if (associationType == 'BelongsTo') {
          const foreignKey = association.foreignKey;
          const targetKey = association.targetKey;

          for (const instance of node.instances) {
            const parentInstances = node.parent.instances.filter(
              (parentInstance) => parentInstance.get(foreignKey) == instance.get(targetKey),
            );

            for (const parentInstance of parentInstances) {
              parentInstance.setDataValue(association.as, instance);
            }
          }
        }

        if (associationType == 'BelongsToMany') {
          const sourceKey = association.sourceKey;
          const foreignKey = association.foreignKey;

          const as = association.oneFromTarget.as;

          for (const instance of node.instances) {
            // set instance accessor
            instance[as] = instance.dataValues[as] = instance['_pivot_'];
            delete instance.dataValues['_pivot_'];
            delete instance['_pivot_'];

            const parentInstance = node.parent.instances.find(
              (parentInstance) => parentInstance.get(sourceKey) == instance.dataValues[as].get(foreignKey),
            );

            if (parentInstance) {
              const children = parentInstance.getDataValue(association.as);

              if (!children) {
                parentInstance.setDataValue(association.as, [instance]);
              } else {
                children.push(instance);
              }
            }
          }
        }

        for (const parent of node.parent.instances) {
          setParentAccessor(parent);
        }
      }
    };

    await loadRecursive(this.root);

    const appendChildCollectionName = appendChildCollectionNameAfterRepositoryFind(this.db);

    const setInstanceAttributes = (node) => {
      if (node.inspectInheritAttribute) {
        appendChildCollectionName({
          findOptions: {},
          data: node.instances,
          dataCollection: this.db.modelCollection.get(node.model),
        });
      }

      // skip pivot attributes
      if (node.association?.as == '_pivot_') {
        return;
      }

      // if no attributes are specified, return empty fields
      const nodeRawAttributes = node.rawAttributes || [];

      if (!lodash.isArray(nodeRawAttributes)) {
        return;
      }

      const nodeChildrenAs = node.children.map((child) => child.association.as);

      const includeAttributes = [...nodeRawAttributes, ...nodeChildrenAs];

      if (node.inspectInheritAttribute) {
        includeAttributes.push('__schemaName', '__tableName', '__collection');
      }

      for (const instance of node.instances) {
        instance.dataValues = lodash.pick(instance.dataValues, includeAttributes);
      }
    };

    // traverse tree and set instance attributes
    const traverse = (node) => {
      setInstanceAttributes(node);

      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(this.root);
    return result;
  }
}
