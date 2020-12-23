import local from './local';
import { STORAGE_TYPE_LOCAL, STORAGE_TYPE_ALI_OSS } from '../constants';



const map = new Map<string, Function>();
map.set(STORAGE_TYPE_LOCAL, local);

export default map;
