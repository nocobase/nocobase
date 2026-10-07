/** String ids for every record this plugin creates. */
export interface IdSource {
  next(): string;
}

/** Over the application's id generator (`idGeneratorToken` of `@nocobase/app-server/id-generator`). */
export function createIdSource(generator: {
  generateString(): string;
}): IdSource {
  return { next: () => generator.generateString() };
}
