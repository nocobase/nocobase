export function encodeResourceKey(namespace: string, name: string): string {
  return `nb-concurrency:v2:${Buffer.from(JSON.stringify([namespace, name]), 'utf8').toString('base64url')}`;
}
