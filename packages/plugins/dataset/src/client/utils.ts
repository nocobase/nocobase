const validateArray = `{{(value)=> {
        try {
          value = JSON.parse(value)
        }catch (e){
          return 'Please input array'
        }
        if(Array.isArray(value)) {
          return true;
        }
          return 'Please input array'
      }}}`;

const parseNonStandardJsonStringToJsonObj = (str: string) => {

  return '';
};

export {
  validateArray,
  parseNonStandardJsonStringToJsonObj,
};
