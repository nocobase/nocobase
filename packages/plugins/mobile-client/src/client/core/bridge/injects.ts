interface InvokeFunction {
  (params: { action: 'scan' }, cb: (data: { url: string }) => void): void;
  (params: { action: 'moveTaskToBack' }, cb?: () => void): void;
}

const jsBridge = (window as any).jsBridge as {
  invoke: InvokeFunction;
};

export const invoke: InvokeFunction = (params, cb) => {
  jsBridge.invoke(params, cb);
};
