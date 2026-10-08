export async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  map: (value: T) => Promise<R>,
): Promise<readonly R[]> {
  const result = new Array<R>(values.length);
  let index = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (index < values.length) {
        const current = index++;
        result[current] = await map(values[current]);
      }
    }),
  );
  return result;
}
