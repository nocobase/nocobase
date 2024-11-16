export class ServiceContainer {
  private services: Map<string, any> = new Map();

  public register<T>(name: string, service: T) {
    if (typeof service === 'function') {
      service = service();
    }

    this.services.set(name, service);
  }

  public get<T>(name: string): T {
    return this.services.get(name);
  }
}
