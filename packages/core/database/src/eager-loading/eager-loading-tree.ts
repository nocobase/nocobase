import { Association, BelongsToMany, HasMany, Includeable, Model, ModelStatic } from 'sequelize';
import lodash from 'lodash';

interface EagerLoadingNode {
  model: ModelStatic<any>;
  association: Association;
  attributes: Array<string>;
  children: Array<EagerLoadingNode>;
  parent?: EagerLoadingNode;
  instances?: Array<Model>;
}

export class EagerLoadingTree {
  public root: EagerLoadingNode;
  constructor(root: EagerLoadingNode) {
    this.root = root;
  }

  static buildFromSequelizeOptions(options: {
    model: ModelStatic<any>;
    rootAttributes: Array<string>;
    includeOption: Includeable | Includeable[];
  }): EagerLoadingTree {
    const { model, rootAttributes, includeOption } = options;

    const root = {
      model,
      association: null,
      attributes: rootAttributes,
      children: [],
    };

    const traverseIncludeOption = (includeOption, eagerLoadingTreeParent) => {
      for (const include of lodash.castArray(includeOption)) {
        const association = eagerLoadingTreeParent.model.associations[include.association];

        const child = {
          model: association.target,
          association,
          attributes: include.attributes,
          parent: eagerLoadingTreeParent,
          children: [],
        };

        eagerLoadingTreeParent.children.push(child);

        if (include.include) {
          traverseIncludeOption(include.include, child);
        }
      }
    };

    traverseIncludeOption(includeOption, root);

    return new EagerLoadingTree(root);
  }

  async load(pks: Array<string | number>) {
    const result = {};

    const loadRecursive = async (node, ids) => {
      const modelPrimaryKey = node.model.primaryKeyAttribute;

      if (lodash.isArray(node.attributes) && !node.attributes.includes(modelPrimaryKey)) {
        node.attributes.push(modelPrimaryKey);
      }

      let instances = [];

      // 根节点
      if (!node.parent) {
        instances = await node.model.findAll({
          where: { [modelPrimaryKey]: ids },
          attributes: node.attributes,
        });
      } else {
        const association = node.association;
        const associationType = association.associationType;

        if (associationType == 'HasOne' || associationType == 'HasMany') {
          const foreignKey = association.foreignKey;
          const findOptions = {
            where: { [foreignKey]: ids },
            attributes: node.attributes,
          };

          instances = await node.model.findAll(findOptions);
        }

        if (associationType == 'BelongsTo') {
          instances = await node.model.findAll({
            include: [
              {
                association: new HasMany(association.target, association.source, {
                  foreignKey: association.foreignKey,
                }),
                where: {
                  [association.target.primaryKeyAttribute]: ids,
                },
              },
            ],
          });
        }

        if (associationType == 'BelongsToMany') {
          instances = await node.model.findAll({
            include: [
              {
                association: association.oneFromTarget,
                where: {
                  [association.foreignKey]: ids,
                },
              },
            ],
          });
        }
      }

      node.instances = instances;

      for (const child of node.children) {
        await loadRecursive(
          child,
          node.instances.map((instance) => instance.get(modelPrimaryKey)),
        );
      }

      // merge instances to parent
      if (!node.parent) {
        return;
      } else {
        const association = node.association;
        const associationType = association.associationType;

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
                parentInstance.setDataValue(association.as, instance);
              }
            }
          }
        }

        if (associationType == 'BelongsTo') {
          const foreignKey = association.foreignKey;
          const targetKey = association.targetKey;

          for (const instance of node.instances) {
            const parentInstance = node.parent.instances.find(
              (parentInstance) => parentInstance.get(foreignKey) == instance.get(targetKey),
            );

            if (parentInstance) {
              parentInstance.setDataValue(association.as, instance);
            }
          }
        }

        if (associationType == 'BelongsToMany') {
          const sourceKey = association.sourceKey;
          const foreignKey = association.foreignKey;

          const oneFromTarget = association.oneFromTarget;

          for (const instance of node.instances) {
            const parentInstance = node.parent.instances.find(
              (parentInstance) => parentInstance.get(sourceKey) == instance.get(oneFromTarget.as).get(foreignKey),
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
      }
    };

    await loadRecursive(this.root, pks);

    return result;
  }

  printTree(indent = '') {
    this._printTree(this.root, indent);
  }

  _printTree(node, indent) {
    if (!node) return;

    console.log(`${indent}Model: ${node.model.name}, Children: ${node.children.length}`);

    for (const child of node.children) {
      this._printTree(child, indent + '  ');
    }
  }
}
