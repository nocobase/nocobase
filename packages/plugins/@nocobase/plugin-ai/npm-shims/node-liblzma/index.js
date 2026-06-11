function unsupported() {
  throw new Error('node-liblzma is not bundled with NocoBase.');
}

export const xzSync = unsupported;
export const unxzSync = unsupported;
export default {
  xzSync,
  unxzSync,
};
