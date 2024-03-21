import { Registry } from '@nocobase/utils/client';

export type RolesManagerOptions = {
  title: string;
  Component: React.ComponentType<any>;
};

export class RolesManager {
  rolesManager = new Registry<RolesManagerOptions>();

  add(name: string, options: RolesManagerOptions) {
    this.rolesManager.register(name, options);
  }

  list() {
    return this.rolesManager.getEntities();
  }
}
