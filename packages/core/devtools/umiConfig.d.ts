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
