import { clone } from 'lodash';
import { CollectionOptions } from '../../collection-manager';
import { CollectionFieldInterface } from './CollectionFieldInterface';
import { CollectionTemplate } from './CollectionTemplate';
import { general } from './collectionTemplates';

const DEFAULT_NS_TITLE = '{{t("main")}}';
const DEFAULT_NS_NAME = 'main';
const DEFAULT_NS = {
  title: DEFAULT_NS_TITLE,
  name: DEFAULT_NS_NAME,
};

interface CollectionNamespace {
  title: string;
  name: string;
}

interface GetCollectionOptions {
  ns?: string;
}

export class CollectionManagerV2 {
  protected collections: Record<string, CollectionOptions[]> = {};
  protected templates: CollectionTemplate[] = [general];
  protected fieldInterfaces: CollectionFieldInterface[] = [];
  protected namespaces: CollectionNamespace[] = [DEFAULT_NS];

  private checkNamespace(ns: string) {
    const namespacesNames = this.namespaces.map((item) => item.name);
    if (!namespacesNames.includes(ns)) {
      throw new Error(
        `[nocobase CollectionManager]: "${DEFAULT_NS_NAME}" does not exist in namespace, you should first call collectionManager.addNamespaces() to add it`,
      );
    }
  }

  // collections
  addCollections(collections: CollectionOptions[], options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_NS_NAME } = options;
    this.checkNamespace(ns);
    this.collections[ns] = [...this.collections[ns], ...collections];
  }
  getAllCollections() {
    return this.collections;
  }
  getCollections(ns: string = DEFAULT_NS_NAME) {
    return this.collections[ns] || [];
  }
  getCollection(name: string, options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_NS_NAME } = options;
    this.checkNamespace(ns);
    const collections = this.getCollections(ns);

    // association: users.roles
    if (name.split('.').length > 1) {
      const associationField = this.getCollectionField(name);
      return this.getCollection(associationField.target, { ns });
    }
    return collections.find((collection) => collection.name === name);
  }
  getCollectionField(path: string, options: GetCollectionOptions = {}) {
    const [collectionName, fieldName] = path.split('.');
    if (!fieldName) {
      return;
    }
    const { ns = DEFAULT_NS_NAME } = options || {};
    this.checkNamespace(ns);
    const collection = this.getCollection(collectionName, { ns });
    if (!collection) {
      return;
    }
    return collection.find((field) => field.name === fieldName);
  }

  // namespaces
  addNamespaces(namespaces: CollectionNamespace[]) {
    const names = namespaces.map((item) => item.name);
    this.namespaces = [...this.namespaces.filter((item) => !names.includes(item.name)), ...namespaces];
  }
  getNamespaces() {
    return this.namespaces;
  }

  // templates
  addCollectionTemplates(templates: CollectionTemplate[]) {
    const names = templates.map((item) => item.name);
    this.templates = [...this.templates.filter((item) => !names.includes(item.name)), ...templates];
  }
  getCollectionTemplates() {
    return this.templates;
  }
  getCollectionTemplate(name = general.name) {
    const template = this.templates.find((template) => template.name === name);
    return clone(template);
  }

  // field interface
  addFieldInterfaces(interfaces: CollectionFieldInterface[]) {
    const names = interfaces.map((item) => item.name);
    this.fieldInterfaces = [...this.fieldInterfaces.filter((item) => !names.includes(item.name)), ...interfaces];
  }
  getFieldInterfaces() {
    return this.fieldInterfaces;
  }
  getFieldInterface(name: string) {
    const fieldInterface = this.fieldInterfaces.find((fieldInterface) => fieldInterface.name === name);
    return clone(fieldInterface);
  }
}
