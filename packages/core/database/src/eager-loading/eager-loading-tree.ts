import { Association, Includeable, ModelStatic } from 'sequelize';
import lodash from 'lodash';

interface EagerLoadingNode {
  model: ModelStatic<any>;
  association: Association;
  attributes: Array<string>;
  children: Array<EagerLoadingNode>;
}
export class EagerLoadingTree {
  public root: EagerLoadingNode;
  constructor(root: EagerLoadingNode) {
    this.root = root;
  }

  static buildFromSequelizeOptions(
    model: ModelStatic<any>,
    includeOption: Includeable | Includeable[],
  ): EagerLoadingTree {
    const root = {
      model,
      association: null,
      attributes: [model.primaryKeyAttribute],
      children: [],
    };

    const traverseIncludeOption = (includeOption, eagerLoadingTreeParent) => {
      for (const include of lodash.castArray(includeOption)) {
        const association = eagerLoadingTreeParent.model.associations[include.association];

        const child = {
          model: association.target,
          association,
          attributes: [include.attributes],
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
