import { AclResource } from './acl-resource';

export class AclRole {
  strategy: string;
  resources = new Map<string, AclResource>();

  getResource(name: string): AclResource | undefined {
    return this.resources.get(name);
  }

  setResource(name: string, resource: AclResource) {
    this.resources.set(name, resource);
  }
}
