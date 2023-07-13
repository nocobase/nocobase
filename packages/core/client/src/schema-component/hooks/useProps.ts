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
  const { useProps: useDynamicHook = useDef, ...others } = originalProps;
  let useDynamicProps = useDynamicHook;
  if (typeof useDynamicHook !== 'function') {
    useDynamicProps = useDef;
  }
  const dynamicProps = useDynamicProps();
  return { ...others, ...dynamicProps };
};
