type FieldIsDependedOnByOtherErrorOptions = {
  fieldName: string;
  fieldCollectionName: string;
  dependedFieldName: string;
  dependedFieldCollectionName: string;
  dependedFieldAs: string;
};

export class FieldIsDependedOnByOtherError extends Error {
  constructor(public options: FieldIsDependedOnByOtherErrorOptions) {
    super(
      `Can't delete field ${options.fieldName} of ${options.fieldCollectionName}, it is used by field ${options.dependedFieldName} in collection ${options.dependedFieldCollectionName} as ${options.dependedFieldAs}`,
    );
    this.name = 'FieldIsDependedOnByOtherError';
  }
}
