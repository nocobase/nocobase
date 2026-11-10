export interface ModuleDescriptor {
  readonly id: string;
  readonly namespace: string;
  readonly entry: string;
  readonly icon: string;
  readonly tone: number;
}
export interface ModuleDefinition extends ModuleDescriptor {
  readonly packageName: string;
  readonly dependencies?: readonly string[];
  readonly start?: (
    onStop: (cleanup: () => Promise<void> | void) => void,
  ) => Promise<void>;
}
