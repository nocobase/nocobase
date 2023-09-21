export default function isColor(str: string) {
  return str.startsWith('rgb') || str.startsWith('#');
}
