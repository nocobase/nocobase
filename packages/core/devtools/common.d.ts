export declare function getPackagePaths(): [string, string][];

export declare class IndexGenerator {
  constructor(outputPath: string, pluginsPath: string[]);
  generate(): void;
}

export declare function generatePlugins(): void;
export declare function generateV2Plugins(): void;
export declare function generateAllPlugins(): void;
