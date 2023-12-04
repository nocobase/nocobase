import { ButtonProps } from 'antd';
import { Application } from '../Application';
import { SchemaInitializer } from './SchemaInitializer';
import { SchemaInitializerItemTypeWithoutName } from './types';

interface ActionType {
  type: 'add' | 'remove';
  itemName: string;
  data?: any;
}

export class SchemaInitializerManager {
  protected schemaInitializers: Record<string, SchemaInitializer<any, any>> = {};
  protected actionList: Record<string, ActionType[]> = {};

  constructor(
    protected _schemaInitializers: SchemaInitializer<any, any>[] = [],
    protected app: Application,
  ) {
    this.app = app;

    this.add(..._schemaInitializers);
  }

  add<P1 = any, P2 = any>(...schemaInitializerList: SchemaInitializer<P1, P2>[]) {
    schemaInitializerList.forEach((schemaInitializer) => {
      this.schemaInitializers[schemaInitializer.name] = schemaInitializer;
      if (Array.isArray(this.actionList[schemaInitializer.name])) {
        this.actionList[schemaInitializer.name].forEach((item) => {
          schemaInitializer[item.type](item.itemName, item.data);
        });
        this.actionList[schemaInitializer.name] = undefined;
      }
    });
  }

  addItem(schemaInitializerName: string, itemName: string, data: SchemaInitializerItemTypeWithoutName) {
    const schemaInitializer = this.get(schemaInitializerName);
    if (!schemaInitializer) {
      if (!this.actionList[schemaInitializerName]) {
        this.actionList[schemaInitializerName] = [];
      }
      this.actionList[schemaInitializerName].push({
        type: 'add',
        itemName: itemName,
        data,
      });
    } else {
      schemaInitializer.add(itemName, data);
    }
  }

  get<P1 = ButtonProps, P2 = {}>(name: string): SchemaInitializer<P1, P2> | undefined {
    return this.schemaInitializers[name];
  }

  getAll() {
    return this.schemaInitializers;
  }

  has(name: string) {
    return !!this.get(name);
  }

  remove(name: string) {
    delete this.schemaInitializers[name];
  }

  removeItem(schemaInitializerName: string, itemName: string) {
    const schemaInitializer = this.get(schemaInitializerName);
    if (!schemaInitializer) {
      if (!this.actionList[schemaInitializerName]) {
        this.actionList[schemaInitializerName] = [];
      }
      this.actionList[schemaInitializerName].push({
        type: 'remove',
        itemName: itemName,
      });
    } else {
      schemaInitializer.remove(itemName);
    }
  }
}
