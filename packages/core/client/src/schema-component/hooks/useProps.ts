import { merge } from '@formily/shared';

interface Options {
  arrayMerge?(target: any[], source: any[], options?: Options): any[];
  clone?: boolean;
  assign?: boolean;
  customMerge?: (key: string, options?: Options) => ((x: any, y: any) => any) | undefined;
  isMergeableObject?(value: object): boolean;
  cloneUnlessOtherwiseSpecified?: (value: any, options: Options) => any;
}

export const useProps = (props: any, options?: Options) => {
  const { useProps, ...props1 } = props;
  let props2 = typeof useProps === 'function' ? useProps() : {};
  return merge(props1 || {}, props2, options);
};
