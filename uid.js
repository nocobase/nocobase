
let IDX = 36,
HEX = ''
while (IDX--) HEX += IDX.toString(36)

function uid(len = 11) {
let str = '',
  num = len || 11
while (num--) str += HEX[(Math.random() * 36) | 0]
return str
}

console.log(uid());
