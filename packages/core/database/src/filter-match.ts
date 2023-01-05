import { filter } from 'mathjs';

export function filterMatch(model, where) {
  if (where.filter !== undefined) {
    where = filter;
  }

  // Create an object that maps operator names to functions
  const operatorFunctions = {
    $eq: (value, condition) => value === condition,
    $not: (value, condition) => !filterMatch(model, condition),
    $gt: (value, condition) => value > condition,
    $gte: (value, condition) => value >= condition,
    $lt: (value, condition) => value < condition,
    $lte: (value, condition) => value <= condition,
    $ne: (value, condition) => value !== condition,
    $in: (value, condition) => condition.includes(value),
    $or: (model, conditions) => Object.values(conditions).some((condition) => filterMatch(model, condition)),
    $and: (model, conditions) => Object.values(conditions).every((condition) => filterMatch(model, condition)),
  };

  for (const [key, value] of Object.entries(where)) {
    // Check if the property value contains a logical operator
    if (operatorFunctions[key] !== undefined) {
      // Check if the conditions specified in the property value are satisfied
      if (!operatorFunctions[key](model, value)) {
        return false;
      }
    } else {
      // Check if the property value is an object (which would contain operators)
      if (typeof value === 'object') {
        // Loop through each operator in the property value
        for (const [operator, condition] of Object.entries(value)) {
          // Check if the property value satisfies the condition
          if (!operatorFunctions[operator](model[key], condition)) {
            return false;
          }
        }
      } else {
        // Assume the default operator is "eq"
        if (!operatorFunctions['$eq'](model[key], value)) {
          return false;
        }
      }
    }
  }

  return true;
}
