import { Op } from 'sequelize';

export default {
  dateOn: (value) => {
    return {
      [Op.eq]: value,
    };
  },
};
