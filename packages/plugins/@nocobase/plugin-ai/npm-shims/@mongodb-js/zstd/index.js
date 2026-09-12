function unsupported() {
  throw new Error('@mongodb-js/zstd is not bundled with NocoBase.');
}

exports.compress = unsupported;
exports.decompress = unsupported;
