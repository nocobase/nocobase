export function shouldReport(e: Error) {
  // @ts-ignore
  if (e.code === 'commander.unknownCommand') {
    return false;
  }

  return true;
}
