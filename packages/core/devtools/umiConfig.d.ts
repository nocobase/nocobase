export declare function getUmiConfig(): {
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
