try {
  // 如果是 node 环境是没有 document 对象的，所以这里会报错
  if (document) {
    console.log('----------------------------------', 'client');
    import('./setupClient');
  } else {
    console.log('----------------------------------', 'server');
    import('./setupServer');
  }
} catch (e) {
  console.log('----------------------------------', 'server');
  import('./setupServer');
}
