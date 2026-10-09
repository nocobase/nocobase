export async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<readonly R[]> {
  const result = new Array<R>(values.length);
  let index = 0;
  const workerCount = Math.min(Math.max(concurrency, 1), values.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (true) {
        const current = index++;
        if (current >= values.length) return;
        result[current] = await mapper(values[current]);
      }
    }),
  );
  return result;
}
