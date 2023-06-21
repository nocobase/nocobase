interface InvokeFunction {
  (params: { action: 'scan' }, cb: (data: { url: string }) => void): void;
  (params: { action: 'moveTaskToBack' }, cb?: () => void): void;
}

const JsBridge = (window as any).JsBridge as {
  invoke: InvokeFunction;
};

export const invoke: InvokeFunction = (params, cb) => {
  JsBridge.invoke(params, cb);
};

export const isJSBridge = !!JsBridge;
