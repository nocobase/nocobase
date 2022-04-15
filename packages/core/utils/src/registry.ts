
export interface RegistryOptions {
  override: boolean;
}

export class Registry<T> {
  private map = new Map<string, T>();
  options: RegistryOptions;

  constructor(options: RegistryOptions = { override: false }) {
    this.options = options;
  }

  register(key: string, value: T): void {
    if (!this.options.override && this.map.has(key)) {
      throw new Error(`this registry does not allow to override existing keys: "${key}"`);
    }

    this.map.set(key, value);
  }

  // async import({ directory, extensions = ['.js', '.ts', '.json'] }) {
  //   const files = await fs.readdir(directory);
  //   return files.filter(file => extensions.includes(path.extname(file)))
  // }

  get(key: string): T {
    return this.map.get(key);
  }

  getKeys(): Iterable<string> {
    return this.map.keys();
  }

  getValues(): Iterable<T> {
    return this.map.values();
  }

  getEntities(): Iterable<[string, T]> {
    return this.map.entries();
  }
}

export default Registry;
