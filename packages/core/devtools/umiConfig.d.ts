export declare function getUmiConfig(): {
  alias: Record<string, string>;
  define: {
    'process.env.API_BASE_URL': string;
  };
  proxy: {
    [x: string]:
      | {
          target: string;
          changeOrigin: boolean;
        }
      | {
          target: string;
          changeOrigin: boolean;
          pathRewrite: {
            [x: string]: string;
          };
        };
  };
};

export declare function resolveNocobasePackagesAlias(config: any): {};
export declare class IndexGenerator {
  constructor(outputPath: string, pluginsPath: string[]): void;
  generate(): void;
};
