const globalTimeout = global.setTimeout;

export const sleep = async (timeout = 0) => {
  await new Promise((resolve) => {
    globalTimeout(resolve, timeout);
  });
};
