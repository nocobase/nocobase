interface Options {
  arrayMerge?(target: any[], source: any[], options?: Options): any[];
  clone?: boolean;
  assign?: boolean;
  customMerge?: (key: string, options?: Options) => ((x: any, y: any) => any) | undefined;
  isMergeableObject?(value: object): boolean;
  cloneUnlessOtherwiseSpecified?: (value: any, options: Options) => any;
}

const useDef = () => ({});

/**
 * 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
 * @param originalProps
 * @returns
 */
export const useProps = (originalProps: any = {}) => {
  const { useProps: useDynamicHook = useDef, ...others } = originalProps;
  let useDynamicProps = useDynamicHook;
  if (typeof useDynamicHook !== 'function') {
    useDynamicProps = useDef;
  }
  const dynamicProps = useDynamicProps();
  return { ...others, ...dynamicProps };
};
