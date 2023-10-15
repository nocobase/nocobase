export async function measureExecutionTime(operation, operationName) {
  const startTime = Date.now();
  await operation();
  const endTime = Date.now();
  const duration = (endTime - startTime).toFixed(0);
  console.log(`${operationName} completed in ${duration} milliseconds`);
}
