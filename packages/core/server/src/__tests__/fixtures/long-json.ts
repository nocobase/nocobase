export default {
  title: 'title',
  content: getLongString(),
};

function getLongString() {
  const size = 2 * 1024 * 1024;
  const buffer = Buffer.alloc(size, 'a');
  const str = buffer.toString('utf-8');
  return str;
}
