import JSON5 from 'json5';
import { uid } from '@formily/shared';

const validateArray = (value) => {
  try {
    value = JSON5.parse(value);
  } catch (e) {
    return 'Please input validate dataset';
  }
  if (Array.isArray(value)) {
    if (
      value.every((item) => {
        return typeof item === 'object' && Object.keys(item).length > 1;
      })
    )
      return true;
  }
  return 'Please input validate dataset';
};

const parseDataSetString = (str) => {
  const dataSetDataArray = JSON5.parse(str);
  if (Array.isArray(dataSetDataArray)) {
    if (
      dataSetDataArray.every((item) => {
        return typeof item === 'object' && Object.keys(item).length > 1;
      })
    )
      dataSetDataArray.map((item) => {
        if (!item?.id) {
          item.id = uid();
        }
        return item;
      });
  }
  return dataSetDataArray;
};

export { validateArray, parseDataSetString };
