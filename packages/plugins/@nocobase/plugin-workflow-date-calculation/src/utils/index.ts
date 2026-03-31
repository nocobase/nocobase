export function isDate(value) {
  const date = new Date(value);
  return date.toString() !== 'Invalid Date';
}
