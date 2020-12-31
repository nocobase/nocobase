import local from './local';
import oss from './ali-oss';
import { STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS } from '../constants';



const map = new Map<string, Function>();
map.set(STORAGE_TYPE_LOCAL, local);
map.set(STORAGE_TYPE_ALI_OSS, oss);

export default map;
