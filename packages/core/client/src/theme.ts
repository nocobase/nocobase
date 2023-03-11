
import './global.less';

console.log("localStorage.getItem('NOCOBASE_THEME') === 'compact'", localStorage.getItem('NOCOBASE_THEME') === 'compact')

if (localStorage.getItem('NOCOBASE_THEME') === 'compact') {
  import('antd/dist/antd.compact.css');
} else {
  import('antd/dist/antd.css');
}
