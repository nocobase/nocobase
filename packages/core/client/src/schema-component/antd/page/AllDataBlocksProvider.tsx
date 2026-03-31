import _ from "lodash";
import React, { useCallback } from "react";
import { DataBlock } from "../../../filter-provider/FilterProvider";

export const AllDataBlocksContext = React.createContext<{
  getAllDataBlocks: () => DataBlock[];
  setAllDataBlocks: (
    value: DataBlock[] | ((prev: DataBlock[]) => DataBlock[])
  ) => void;
}>({
  getAllDataBlocks: () => [],
  setAllDataBlocks: () => { },
});

/**
 * 保存当前页面中所有数据区块的信息（包括弹窗中的）
 * @param props
 * @returns
 */
export const AllDataBlocksProvider: React.FC = (props) => {
  const dataBlocksRef = React.useRef<DataBlock[]>([]);
  const setAllDataBlocks = React.useCallback((value) => {
    if (typeof value === "function") {
      dataBlocksRef.current = value(dataBlocksRef.current);
    } else {
      dataBlocksRef.current = value;
    }
  }, []);
  const getAllDataBlocks = React.useCallback(
    () => dataBlocksRef.current,
    []
  );
  const value = React.useMemo(
    () => ({ getAllDataBlocks, setAllDataBlocks }),
    [getAllDataBlocks, setAllDataBlocks]
  );
  return <AllDataBlocksContext.Provider value={value}>{props.children}</AllDataBlocksContext.Provider>;
}

export const useAllDataBlocks = () => {
  const ctx = React.useContext(AllDataBlocksContext);

  const getAllDataBlocks = useCallback<() => DataBlock[]>(() => ctx?.getAllDataBlocks() || [], [ctx]);

  const recordDataBlocks = useCallback(
    (block: DataBlock) => {
      const existingBlock = ctx?.getAllDataBlocks().find((item) => item.uid === block.uid);

      if (existingBlock) {
        // 这里的值有可能会变化，所以需要更新
        Object.assign(existingBlock, block);
        return;
      }

      ctx?.setAllDataBlocks((prev) => [...prev, block]);
    },
    [ctx],
  );

  const removeDataBlock = useCallback(
    (uid: string) => {
      if (ctx?.getAllDataBlocks().every((item) => item.uid !== uid)) return;
      ctx?.setAllDataBlocks((prev) => prev.filter((item) => item.uid !== uid));
    },
    [ctx],
  );

  if (!ctx) {
    return {
      recordDataBlocks: _.noop,
      removeDataBlock: _.noop,
      getAllDataBlocks,
    };
  }

  return {
    recordDataBlocks,
    removeDataBlock,
    getAllDataBlocks,
  };
};
