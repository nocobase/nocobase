if (localStorage.getItem('NOCOBASE_THEME') === 'compact') {
  import('antd/dist/antd.compact.css');
} else {
  import('antd/dist/antd.css');
}
window.document.documentElement.classList.add('theme-' + (localStorage.getItem('NOCOBASE_THEME') || 'default'));
