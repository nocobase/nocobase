class NoPermissionError extends Error {
  constructor(...args) {
    super(...args);
  }
}

export { NoPermissionError };
