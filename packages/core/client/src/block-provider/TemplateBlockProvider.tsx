/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, FC, useCallback, useContext, useMemo, useRef, useState } from 'react';

const TemplateBlockContext = createContext<{
  // 模板是否已经请求结束
  templateFinished?: boolean;
  onTemplateSuccess?: Function;
  // 当前区块是否是模板区块
  isBlockTemplate?: () => boolean;
  setIsBlockTemplate?: (value: boolean) => void;
}>({});
TemplateBlockContext.displayName = 'TemplateBlockContext';

/**
 * @internal
 */
export const useTemplateBlockContext = () => {
  return useContext(TemplateBlockContext);
};

const TemplateBlockProvider: FC<{ onTemplateLoaded?: () => void }> = ({ onTemplateLoaded, children }) => {
  const isBlockTemplateRef = useRef(false);
  const [templateFinished, setTemplateFinished] = useState(false);
  const onTemplateSuccess = useCallback(() => {
    setTemplateFinished(true);

    // Wait for the render to stabilize before invoking onTemplateLoaded, to ensure we can get the latest template schema
    setTimeout(() => {
      onTemplateLoaded?.();
    });
  }, [onTemplateLoaded]);
  const isBlockTemplate = useCallback(() => {
    return isBlockTemplateRef.current;
  }, []);
  const setIsBlockTemplate = useCallback((value: boolean) => {
    isBlockTemplateRef.current = value;
  }, []);
  const value = useMemo(
    () => ({ templateFinished, onTemplateSuccess, isBlockTemplate, setIsBlockTemplate }),
    [onTemplateSuccess, templateFinished, isBlockTemplate, setIsBlockTemplate],
  );
  return <TemplateBlockContext.Provider value={value}>{children}</TemplateBlockContext.Provider>;
};

export { TemplateBlockProvider };
