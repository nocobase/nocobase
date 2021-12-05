import { DataTypes, Op } from 'sequelize';

const findFilterFieldType = (ctx) => {
  let path = ctx.path.split('.');
  path.splice(path.length - 1, 1);

  const fieldName = path.splice(path.length - 1, 1);

  let model = ctx.model;
  const associationPath = path;
  for (const association of associationPath) {
    model = model[association].target;
  }

  return model.rawAttributes[fieldName];
};
export default {
  $empty(_, ctx) {
    const field = findFilterFieldType(ctx);

    if (field.type instanceof DataTypes.STRING) {
      return {
        [Op.or]: {
          [Op.is]: null,
          [Op.eq]: '',
        },
      };
    }

    return {
      [Op.is]: null,
    };
  },

  $notEmpty(_, ctx) {
    const field = findFilterFieldType(ctx);

    if (field.type instanceof DataTypes.STRING) {
      return {
        [Op.and]: {
          [Op.not]: null,
          [Op.ne]: '',
        },
      };
    }

    return {
      [Op.not]: null,
    };
  },
};
