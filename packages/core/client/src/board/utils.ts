function compose(...fns) {
  return (arg) => fns.reduce((acc, fn) => fn(acc), arg)
}

function partialRight(fn, ...args) {
  return (...leftArgs) => fn(...leftArgs, ...args)
}

function addInArrayAtPosition(array, element, position) {
  const arrayCopy = [...array]
  arrayCopy.splice(position, 0, element)
  return arrayCopy
}

function removeFromArrayAtPosition(array, position) {
  return array.reduce((acc, value, idx) => (idx === position ? acc : [...acc, value]), [])
}

function changeElementOfPositionInArray(array, from, to) {
  const removeFromArrayAtPositionFrom = partialRight(removeFromArrayAtPosition, from)
  const addInArrayAtPositionTo = partialRight(addInArrayAtPosition, array[from], to)

  return compose(removeFromArrayAtPositionFrom, addInArrayAtPositionTo)(array)
}

function identity(value) {
  return value
}

function when(value, predicate = identity) {
  return function callback(callback) {
    if (predicate(value)) return callback(value)
  }
}

function replaceElementOfArray(array) {
  return function (options) {
    return array.map((element) => (options.when(element) ? options.for(element) : element))
  }
}

function pickPropOut(object, prop) {
  return Object.keys(object).reduce((obj, key) => {
    return key === prop ? obj : { ...obj, [key]: object[key] }
  }, {})
}

export {
  addInArrayAtPosition,
  removeFromArrayAtPosition,
  changeElementOfPositionInArray,
  when,
  replaceElementOfArray,
  partialRight,
  pickPropOut,
}
