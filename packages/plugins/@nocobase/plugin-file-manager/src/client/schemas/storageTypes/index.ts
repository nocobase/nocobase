import aliOss from './ali-oss';
import local from './local';
import s3 from './s3';
import txCos from './tx-cos';

export const storageTypes = {
  local: local,
  'ali-oss': aliOss,
  s3: s3,
  'tx-cos': txCos,
};
