
module.exports = function ({ types: t }) {
  function isConsoleLog(node) {
    const { callee, callee: { object, property } } = node;
    return t.isMemberExpression(callee)
      && t.isIdentifier(object) && object.name === 'console'
      && t.isIdentifier(property) && property.name === 'log';
  }

  return {
    visitor: {
      CallExpression(path, state) {
        const { node, node: { callee, callee: { object, property } } } = path;
        if (isConsoleLog(node)) {
          node.arguments.unshift(t.stringLiteral('p2'));
        }
      },
    },
  };
}
