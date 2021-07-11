const api = {
  '/api/routes:getAccessible': require('./routes-getAccessible').default,
  // '/api/blocks:getSchema/login': require('./blocks-getSchema/login').default,
  // '/api/blocks:getSchema/register': require('./blocks-getSchema/register').default,
  // '/api/blocks:getSchema/item1': require('./blocks-getSchema/item1').default,
  // '/api/blocks:getSchema/item2': require('./blocks-getSchema/item2').default,
  // '/api/blocks:getSchema/item22': require('./blocks-getSchema/item22').default,
  // '/api/blocks:getSchema/item3': require('./blocks-getSchema/item3').default,
  // '/api/blocks:getSchema/item4': require('./blocks-getSchema/item4').default,
  // '/api/blocks:getSchema/item5': require('./blocks-getSchema/item5').default,
  // '/api/blocks:getSchema/menu': require('./blocks-getSchema/menu').default,
  '/api/ui-schemas:getTree/login': require('./ui-schemas-getTree/login').default,
  '/api/ui-schemas:getTree/register': require('./ui-schemas-getTree/register').default,
  '/api/ui-schemas:getTree/menu': require('./ui-schemas-getTree/menu').default,
}

export function request(service) {
  let url = null;
  if (typeof service === 'string') {
    url = service;
  } else if (typeof service === 'object' && service.url) {
    url = service.url;
  }

  console.log('request.url', url)

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (api[url]) {
        resolve({
          data: api[url],
        })
      } else {
        resolve({ data: {} });
      }
    }, 100)
  })
}