import { SchemaInitializer } from './SchemaInitializer';

/**
 * 因为需要把 SchemaInitializer 的 name 统一为一致的命名风格，统一之后新创建的 Schema 将
 * 使用新的命名风格，而旧的 Schema 仍然使用旧的命名风格，这样会导致一些问题。所以需要有一个方法
 * 可以确保旧版的 name 也可以正常工作，知道旧的 Schema 被移除。该类就是这个工作的：
 *
 * 1. 在新版实例中通过接收旧版 name 的实例，在新版实例变更后，同步变更旧版实例；
 * 2. 在旧版实例中也接收新版 name 的实例，当旧版实例变更后，同步变更新版实例，这样可以保证在插件中即使不把旧版改成新版也能正常运行；
 */
export class CompatibleSchemaInitializer extends SchemaInitializer {
  /**
   * 需要同步变更的另一个实例
   */
  otherInstance: CompatibleSchemaInitializer = null;

  constructor(options: any, otherInstance?: CompatibleSchemaInitializer) {
    super(options);
    if (otherInstance) {
      this.otherInstance = otherInstance;
      otherInstance.otherInstance = this;
    }
  }

  add(name: string, item: any) {
    if (super.get(name)) return;

    super.add(name, item);
    if (this.otherInstance) {
      this.otherInstance.add(name, item);
    }
  }

  remove(nestedName: string): void {
    if (!super.get(nestedName)) return;

    super.remove(nestedName);
    if (this.otherInstance) {
      this.otherInstance.remove(nestedName);
    }
  }
}
