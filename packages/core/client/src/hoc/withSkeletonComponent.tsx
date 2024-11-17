/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Skeleton } from 'antd';
import { useDataBlockRequest } from '../data-source/data-block/DataBlockRequestProvider';

// @ts-ignore
import React, { FC, useRef } from 'react';
import { LOADING_DELAY } from '../variables/constants';

interface Options {
  displayName?: string;
  useLoading?: () => boolean;
  SkeletonComponent?: React.ComponentType;
  /**
   * @default 300
   * Delay time of skeleton component
   */
  delay?: number;
}

const useDefaultLoading = () => {
  return !!useDataBlockRequest()?.loading;
};

const RenderSkeletonWithDelay: FC<{ SkeletonComponent: React.ComponentType; delay: number }> = ({
  SkeletonComponent,
  delay,
}) => {
  // const [delayed, setDelayed] = useState(false);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setDelayed(true);
  //   }, delay);
  //   return () => clearTimeout(timer);
  // }, [delay]);

  return <SkeletonComponent />;
};

/**
 * Display skeleton component while component is making API requests
 * @param Component
 * @param options
 * @returns
 */
export const withSkeletonComponent = (Component: React.ComponentType<any>, options?: Options) => {
  const {
    useLoading = useDefaultLoading,
    displayName,
    SkeletonComponent = Skeleton,
    delay = LOADING_DELAY,
  } = options || {};

  const Result = React.memo((props: any) => {
    const loading = useLoading();
    const mountedRef = useRef(false);

    if (!mountedRef.current && loading) {
      return <RenderSkeletonWithDelay SkeletonComponent={SkeletonComponent} delay={delay} />;
    }

    mountedRef.current = true;

    return <Component {...props} />;
  });

  Result.displayName =
    displayName || `${Component.displayName}(withSkeletonComponent)` || `${Component.name}(withSkeletonComponent)`;

  return Result;
};
