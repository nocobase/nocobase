import React, { createContext, useContext } from 'react';

export interface RecordBlockInitializersContextValue {
  extraOtherBlocks: any[];
}

export const RecordBlockInitializersContext = createContext<RecordBlockInitializersContextValue>({
  extraOtherBlocks: [],
});

export const RecordBlockInitializersProvider: React.FC<Partial<RecordBlockInitializersContextValue>> = (props) => {
  const { extraOtherBlocks } = props;
  const ctx = useContext(RecordBlockInitializersContext);

  return (
    <RecordBlockInitializersContext.Provider
      value={{ ...ctx, extraOtherBlocks: [...ctx.extraOtherBlocks, ...extraOtherBlocks] }}
    >
      {props.children}
    </RecordBlockInitializersContext.Provider>
  );
};
