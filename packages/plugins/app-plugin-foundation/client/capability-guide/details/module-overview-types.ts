export type ModuleText = readonly [english: string, chinese: string];

export interface ModuleOverview {
  readonly configurations?: readonly {
    readonly title: ModuleText;
    readonly fields: readonly ModuleText[];
  }[];
  readonly evidence?: readonly {
    readonly title: ModuleText;
    readonly description: ModuleText;
  }[];
  readonly interfaces?: readonly {
    readonly title: ModuleText;
    readonly description?: ModuleText;
    readonly names: readonly string[];
    readonly paths?: readonly string[];
    /** Only established route conventions can establish absence. Embedded/custom interfaces stay unknown. */
    readonly knownRoute?: boolean;
  }[];
  readonly note?: ModuleText;
  readonly actions: readonly {
    readonly title: ModuleText;
    readonly description: ModuleText;
    readonly prompt: ModuleText;
    readonly steps: readonly ModuleText[];
  }[];
}
