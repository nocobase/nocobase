const dateFormatFn = (sequelize, dialect, field, format) => {
  switch (dialect) {
    case 'sqlite':
      format = format
        .replace(/YYYY/g, '%Y')
        .replace(/MM/g, '%m')
        .replace(/DD/g, '%d')
        .replace(/hh/g, '%H')
        .replace(/mm/g, '%M')
        .replace(/ss/g, '%S');
      return sequelize.fn('strftime', format, sequelize.col(field));
    case 'mysql':
      format = format
        .replace(/YYYY/g, '%Y')
        .replace(/MM/g, '%m')
        .replace(/DD/g, '%d')
        .replace(/hh/g, '%H')
        .replace(/mm/g, '%i')
        .replace(/ss/g, '%S');
      return sequelize.fn('date_format', sequelize.col(field), format);
    case 'postgres':
      format = format.replace(/hh/g, 'HH24').replace(/mm/g, 'MI').replace(/ss/g, 'SS');
      return sequelize.fn('to_char', sequelize.col(field), format);
    default:
      return field;
  }
};

const formatFn = (sequelize, dialect, field, format) => {
  switch (dialect) {
    case 'sqlite':
    case 'postgres':
      return sequelize.fn('format', format, sequelize.col(field));
    default:
      return field;
  }
};

const formatter = (sequelize, type, field, format) => {
  const dialect = sequelize.getDialect();
  switch (type) {
    case 'date':
    case 'datetime':
    case 'time':
      return dateFormatFn(sequelize, dialect, field, format);
    default:
      return formatFn(sequelize, dialect, field, format);
  }
};

module.exports = {
  dateFormatFn,
  formatFn,
  formatter,
};
