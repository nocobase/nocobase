interface InvokeFunction {
  (params: { action: 'scan' }, cb: (data: { url: string }) => void): void;
  (params: { action: 'moveTaskToBack' }, cb?: () => void): void;
}

const getJsBridge = () =>
  (window as any).JsBridge as {
    invoke: InvokeFunction;
  };

export const invoke: InvokeFunction = (params, cb) => {
  return getJsBridge().invoke(params, cb);
};

export const isJSBridge = () => !!getJsBridge();
