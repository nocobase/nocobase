const requested = {};

/**
 * Check if a request has already been made for a given url to avoid duplicate requests
 * @param url
 * @returns
 */
export const hasRequested = (url: string) => {
  if (requested[url]) {
    return true;
  }
  return false;
};

export const getRequested = (url: string) => {
  return requested[url];
};

export const stashRequested = (url: string, value: Promise<any>) => {
  requested[url] = value;
};

export const clearRequested = (url: string) => {
  delete requested[url];
};
