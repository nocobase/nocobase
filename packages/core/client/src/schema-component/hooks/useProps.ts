interface Options {
  arrayMerge?(target: any[], source: any[], options?: Options): any[];
  clone?: boolean;
  assign?: boolean;
  customMerge?: (key: string, options?: Options) => ((x: any, y: any) => any) | undefined;
  isMergeableObject?(value: object): boolean;
  cloneUnlessOtherwiseSpecified?: (value: any, options: Options) => any;
}

const useDef = () => ({});
export const useProps = (originalProps: any = {}) => {
  const { useProps: useDynamicProps = useDef, ...others } = originalProps;
  const dynamicProps = useDynamicProps();
  return { ...dynamicProps, ...others };
};
