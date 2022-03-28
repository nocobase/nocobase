export function HTMLEncode(html: string) {
  let temp = document.createElement('div');
  temp.textContent != null ? (temp.textContent = html) : (temp.innerText = html);
  const output = temp.innerHTML;
  temp = null;
  return output;
}
