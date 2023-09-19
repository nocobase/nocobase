(function () {
  /**
   * Create a cached version of a pure function.
   * @param {*} fn The function call to be cached
   * @void
   */

  function cached(fn) {
    var cache = Object.create(null);
    return function (str) {
      var key = isPrimitive(str) ? str : JSON.stringify(str);
      var hit = cache[key];
      return hit || (cache[key] = fn(str));
    };
  }

  /**
   * Hyphenate a camelCase string.
   */
  var hyphenate = cached(function (str) {
    return str.replace(/([A-Z])/g, function (m) { return '-' + m.toLowerCase(); });
  });

  var hasOwn = Object.prototype.hasOwnProperty;

  /**
   * Simple Object.assign polyfill
   * @param {Object} to The object to be merged with
   * @returns {Object} The merged object
   */
  var merge =
    Object.assign ||
    function (to) {
      var arguments$1 = arguments;

      for (var i = 1; i < arguments.length; i++) {
        var from = Object(arguments$1[i]);

        for (var key in from) {
          if (hasOwn.call(from, key)) {
            to[key] = from[key];
          }
        }
      }

      return to;
    };

  /**
   * Check if value is primitive
   * @param {*} value Checks if a value is primitive
   * @returns {Boolean} Result of the check
   */
  function isPrimitive(value) {
    return typeof value === 'string' || typeof value === 'number';
  }

  /**
   * Performs no operation.
   * @void
   */
  function noop() { }

  /**
   * Check if value is function
   * @param {*} obj Any javascript object
   * @returns {Boolean} True if the passed-in value is a function
   */
  function isFn(obj) {
    return typeof obj === 'function';
  }

  /**
   * Check if url is external
   * @param {String} string  url
   * @returns {Boolean} True if the passed-in url is external
   */
  function isExternal(url) {
    var match = url.match(
      /^([^:/?#]+:)?(?:\/{2,}([^/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/
    );

    if (
      typeof match[1] === 'string' &&
      match[1].length > 0 &&
      match[1].toLowerCase() !== location.protocol
    ) {
      return true;
    }
    if (
      typeof match[2] === 'string' &&
      match[2].length > 0 &&
      match[2].replace(
        new RegExp(
          ':(' + { 'http:': 80, 'https:': 443 }[location.protocol] + ')?$'
        ),
        ''
      ) !== location.host
    ) {
      return true;
    }
    if (/^\/\\/.test(url)) {
      return true;
    }
    return false;
  }

  var inBrowser = !false;

  var isMobile = document.body.clientWidth <= 600;

  /**
   * @see https://github.com/MoOx/pjax/blob/master/lib/is-supported.js
   */
  var supportsPushState =

    (function () {
      // Borrowed wholesale from https://github.com/defunkt/jquery-pjax
      return (
        window.history &&
        window.history.pushState &&
        window.history.replaceState &&
        // PushState isn’t reliable on iOS until 5.
        !navigator.userAgent.match(
          /((iPod|iPhone|iPad).+\bOS\s+[1-4]\D|WebApps\/.+CFNetwork)/
        )
      );
    })();

  var cacheNode = {};

  /**
   * Get Node
   * @param  {String|Element} el A DOM element
   * @param  {Boolean} noCache Flag to use or not use the cache
   * @return {Element} The found node element
   */
  function getNode(el, noCache) {
    if (noCache === void 0) noCache = false;

    if (typeof el === 'string') {
      if (typeof window.Vue !== 'undefined') {
        return find(el);
      }

      el = noCache ? find(el) : cacheNode[el] || (cacheNode[el] = find(el));
    }

    return el;
  }

  var $ = document;

  var body = $.body;

  var head = $.head;

  /**
   * Find elements
   * @param {String|Element} el The root element where to perform the search from
   * @param {Element} node The query
   * @returns {Element} The found DOM element
   * @example
   * find('nav') => document.querySelector('nav')
   * find(nav, 'a') => nav.querySelector('a')
   */
  function find(el, node) {
    return node ? el.querySelector(node) : $.querySelector(el);
  }

  /**
   * Find all elements
   * @param {String|Element} el The root element where to perform the search from
   * @param {Element} node The query
   * @returns {Array<Element>} An array of DOM elements
   * @example
   * findAll('a') => [].slice.call(document.querySelectorAll('a'))
   * findAll(nav, 'a') => [].slice.call(nav.querySelectorAll('a'))
   */
  function findAll(el, node) {
    return [].slice.call(
      node ? el.querySelectorAll(node) : $.querySelectorAll(el)
    );
  }

  function create(node, tpl) {
    node = $.createElement(node);
    if (tpl) {
      node.innerHTML = tpl;
    }

    return node;
  }

  function appendTo(target, el) {
    return target.appendChild(el);
  }

  function before(target, el) {
    return target.insertBefore(el, target.children[0]);
  }

  function on(el, type, handler) {
    isFn(type)
      ? window.addEventListener(el, type)
      : el.addEventListener(type, handler);
  }

  function off(el, type, handler) {
    isFn(type)
      ? window.removeEventListener(el, type)
      : el.removeEventListener(type, handler);
  }

  /**
   * Toggle class
   * @param {String|Element} el The element that needs the class to be toggled
   * @param {Element} type The type of action to be performed on the classList (toggle by default)
   * @param {String} val Name of the class to be toggled
   * @void
   * @example
   * toggleClass(el, 'active') => el.classList.toggle('active')
   * toggleClass(el, 'add', 'active') => el.classList.add('active')
   */
  function toggleClass(el, type, val) {
    el && el.classList[val ? type : 'toggle'](val || type);
  }

  function style(content) {
    appendTo(head, create('style', content));
  }

  /**
   * Fork https://github.com/bendrucker/document-ready/blob/master/index.js
   * @param {Function} callback The callbacack to be called when the page is loaded
   * @returns {Number|void} If the page is already laoded returns the result of the setTimeout callback,
   *  otherwise it only attaches the callback to the DOMContentLoaded event
   */
  function documentReady(callback, doc) {
    if (doc === void 0) doc = document;

    var state = doc.readyState;

    if (state === 'complete' || state === 'interactive') {
      return setTimeout(callback, 0);
    }

    doc.addEventListener('DOMContentLoaded', callback);
  }

  var dom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getNode: getNode,
    $: $,
    body: body,
    head: head,
    find: find,
    findAll: findAll,
    create: create,
    appendTo: appendTo,
    before: before,
    on: on,
    off: off,
    toggleClass: toggleClass,
    style: style,
    documentReady: documentReady
  });

  function startsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
  }

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  var decode = decodeURIComponent;
  var encode = encodeURIComponent;

  function parseQuery(query) {
    var res = {};

    query = query.trim().replace(/^(\?|#|&)/, '');

    if (!query) {
      return res;
    }

    // Simple parse
    query.split('&').forEach(function (param) {
      var parts = param.replace(/\+/g, ' ').split('=');

      res[parts[0]] = parts[1] && decode(parts[1]);
    });

    return res;
  }

  function stringifyQuery(obj, ignores) {
    if (ignores === void 0) ignores = [];

    var qs = [];

    for (var key in obj) {
      if (ignores.indexOf(key) > -1) {
        continue;
      }

      qs.push(
        obj[key]
          ? ((encode(key)) + "=" + (encode(obj[key]))).toLowerCase()
          : encode(key)
      );
    }

    return qs.length ? ("?" + (qs.join('&'))) : '';
  }

  var isAbsolutePath = cached(function (path) {
    return /(:|(\/{2}))/g.test(path);
  });

  var removeParams = cached(function (path) {
    return path.split(/[?#]/)[0];
  });

  var getParentPath = cached(function (path) {
    if (/\/$/g.test(path)) {
      return path;
    }

    var matchingParts = path.match(/(\S*\/)[^/]+$/);
    return matchingParts ? matchingParts[1] : '';
  });

  var cleanPath = cached(function (path) {
    return path.replace(/^\/+/, '/').replace(/([^:])\/{2,}/g, '$1/');
  });

  var resolvePath = cached(function (path) {
    var segments = path.replace(/^\//, '').split('/');
    var resolved = [];
    for (var i = 0, len = segments.length; i < len; i++) {
      var segment = segments[i];
      if (segment === '..') {
        resolved.pop();
      } else if (segment !== '.') {
        resolved.push(segment);
      }
    }

    return '/' + resolved.join('/');
  });

  /**
   * Normalises the URI path to handle the case where Docsify is
   * hosted off explicit files, i.e. /index.html. This function
   * eliminates any path segments that contain `#` fragments.
   *
   * This is used to map browser URIs to markdown file sources.
   *
   * For example:
   *
   * http://example.org/base/index.html#/blah
   *
   * would be mapped to:
   *
   * http://example.org/base/blah.md.
   *
   * See here for more information:
   *
   * https://github.com/docsifyjs/docsify/pull/1372
   *
   * @param {string} path The URI path to normalise
   * @return {string} { path, query }
   */

  function normaliseFragment(path) {
    return path
      .split('/')
      .filter(function (p) { return p.indexOf('#') === -1; })
      .join('/');
  }

  function getPath() {
    var args = [], len = arguments.length;
    while (len--) args[len] = arguments[len];

    return cleanPath(args.map(normaliseFragment).join('/'));
  }

  var replaceSlug = cached(function (path) {
    return path.replace('#', '?id=');
  });

  var cached$1 = {};

  function getAlias(path, alias, last) {
    var match = Object.keys(alias).filter(function (key) {
      var re = cached$1[key] || (cached$1[key] = new RegExp(("^" + key + "$")));
      return re.test(path) && path !== last;
    })[0];

    return match
      ? getAlias(path.replace(cached$1[match], alias[match]), alias, path)
      : path;
  }

  function getFileName(path, ext) {
    return new RegExp(("\\.(" + (ext.replace(/^\./, '')) + "|html)$"), 'g').test(path)
      ? path
      : /\/$/g.test(path)
        ? (path + "README" + ext)
        : ("" + path + ext);
  }

  var History = function History(config) {
    this.config = config;
  };

  History.prototype.getBasePath = function getBasePath() {
    return this.config.basePath;
  };

  History.prototype.getFile = function getFile(path, isRelative) {
    if (path === void 0) path = this.getCurrentPath();

    var ref = this;
    var config = ref.config;
    var base = this.getBasePath();
    var ext = typeof config.ext === 'string' ? config.ext : '.md';

    path = config.alias ? getAlias(path, config.alias) : path;
    path = getFileName(path, ext);
    path = path === ("/README" + ext) ? config.homepage || path : path;
    path = isAbsolutePath(path) ? path : getPath(base, path);

    if (isRelative) {
      path = path.replace(new RegExp(("^" + base)), '');
    }

    return path;
  };

  History.prototype.onchange = function onchange(cb) {
    if (cb === void 0) cb = noop;

    cb();
  };

  History.prototype.getCurrentPath = function getCurrentPath() { };

  History.prototype.normalize = function normalize() { };

  History.prototype.parse = function parse() { };

  History.prototype.toURL = function toURL(path, params, currentRoute) {
    var local = currentRoute && path[0] === '#';
    var route = this.parse(replaceSlug(path));

    route.query = merge({}, route.query, params);
    path = route.path + stringifyQuery(route.query);
    path = path.replace(/\.md(\?)|\.md$/, '$1');

    if (local) {
      var idIndex = currentRoute.indexOf('?');
      path =
        (idIndex > 0 ? currentRoute.substring(0, idIndex) : currentRoute) +
        path;
    }

    if (this.config.relativePath && path.indexOf('/') !== 0) {
      var currentDir = currentRoute.substring(
        0,
        currentRoute.lastIndexOf('/') + 1
      );
      return cleanPath(resolvePath(currentDir + path));
    }

    return cleanPath('/' + path);
  };

  function replaceHash(path) {
    var i = location.href.indexOf('#');
    location.replace(location.href.slice(0, i >= 0 ? i : 0) + '#' + path);
  }
  var HashHistory = /*@__PURE__*/(function (History) {
    function HashHistory(config) {
      History.call(this, config);
      this.mode = 'hash';
    }

    if (History) HashHistory.__proto__ = History;
    HashHistory.prototype = Object.create(History && History.prototype);
    HashHistory.prototype.constructor = HashHistory;

    HashHistory.prototype.getBasePath = function getBasePath() {
      var path = window.location.pathname || '';
      var base = this.config.basePath;

      // This handles the case where Docsify is served off an
      // explicit file path, i.e.`/base/index.html#/blah`. This
      // prevents the `/index.html` part of the URI from being
      // remove during routing.
      // See here: https://github.com/docsifyjs/docsify/pull/1372
      var basePath = endsWith(path, '.html')
        ? path + '#/' + base
        : path + '/' + base;
      return /^(\/|https?:)/g.test(base) ? base : cleanPath(basePath);
    };

    HashHistory.prototype.getCurrentPath = function getCurrentPath() {
      // We can't use location.hash here because it's not
      // consistent across browsers - Firefox will pre-decode it!
      var href = location.href;
      var index = href.indexOf('#');
      return index === -1 ? '' : href.slice(index + 1);
    };

    /** @param {((params: {source: TODO}) => void)} [cb] */
    HashHistory.prototype.onchange = function onchange(cb) {
      if (cb === void 0) cb = noop;

      // The hashchange event does not tell us if it originated from
      // a clicked link or by moving back/forward in the history;
      // therefore we set a `navigating` flag when a link is clicked
      // to be able to tell these two scenarios apart
      var navigating = false;

      on('click', function (e) {
        var el = e.target.tagName === 'A' ? e.target : e.target.parentNode;

        if (el && el.tagName === 'A' && !isExternal(el.href)) {
          navigating = true;
        }
      });

      on('hashchange', function (e) {
        var source = navigating ? 'navigate' : 'history';
        navigating = false;
        cb({ event: e, source: source });
      });
    };

    HashHistory.prototype.normalize = function normalize() {
      var path = this.getCurrentPath();

      path = replaceSlug(path);

      if (path.charAt(0) === '/') {
        return replaceHash(path);
      }

      replaceHash('/' + path);
    };

    /**
     * Parse the url
     * @param {string} [path=location.herf] URL to be parsed
     * @return {object} { path, query }
     */
    HashHistory.prototype.parse = function parse(path) {
      if (path === void 0) path = location.href;

      var query = '';

      var hashIndex = path.indexOf('#');
      if (hashIndex >= 0) {
        path = path.slice(hashIndex + 1);
      }

      var queryIndex = path.indexOf('?');
      if (queryIndex >= 0) {
        query = path.slice(queryIndex + 1);
        path = path.slice(0, queryIndex);
      }

      return {
        path: path,
        file: this.getFile(path, true),
        query: parseQuery(query),
      };
    };

    HashHistory.prototype.toURL = function toURL(path, params, currentRoute) {
      return '#' + History.prototype.toURL.call(this, path, params, currentRoute);
    };

    return HashHistory;
  }(History));

  /** @typedef {any} TODO */

  var HTML5History = /*@__PURE__*/(function (History) {
    function HTML5History(config) {
      History.call(this, config);
      this.mode = 'history';
    }

    if (History) HTML5History.__proto__ = History;
    HTML5History.prototype = Object.create(History && History.prototype);
    HTML5History.prototype.constructor = HTML5History;

    HTML5History.prototype.getCurrentPath = function getCurrentPath() {
      var base = this.getBasePath();
      var path = window.location.pathname;

      if (base && path.indexOf(base) === 0) {
        path = path.slice(base.length);
      }

      return (path || '/') + window.location.search + window.location.hash;
    };

    HTML5History.prototype.onchange = function onchange(cb) {
      if (cb === void 0) cb = noop;

      on('click', function (e) {
        var el = e.target.tagName === 'A' ? e.target : e.target.parentNode;

        if (el && el.tagName === 'A' && !isExternal(el.href)) {
          e.preventDefault();
          var url = el.href;
          window.history.pushState({ key: url }, '', url);
          cb({ event: e, source: 'navigate' });
        }
      });

      on('popstate', function (e) {
        cb({ event: e, source: 'history' });
      });
    };

    /**
     * Parse the url
     * @param {string} [path=location.href] URL to be parsed
     * @return {object} { path, query }
     */
    HTML5History.prototype.parse = function parse(path) {
      if (path === void 0) path = location.href;

      var query = '';

      var queryIndex = path.indexOf('?');
      if (queryIndex >= 0) {
        query = path.slice(queryIndex + 1);
        path = path.slice(0, queryIndex);
      }

      var base = getPath(location.origin);
      var baseIndex = path.indexOf(base);

      if (baseIndex > -1) {
        path = path.slice(baseIndex + base.length);
      }

      return {
        path: path,
        file: this.getFile(path),
        query: parseQuery(query),
      };
    };

    return HTML5History;
  }(History));

  /**
   * @typedef {{
   *   path?: string
   * }} Route
   */

  /** @type {Route} */
  var lastRoute = {};

  /** @typedef {import('../Docsify').Constructor} Constructor */

  /**
   * @template {!Constructor} T
   * @param {T} Base - The class to extend
   */
  function Router(Base) {
    return /*@__PURE__*/(function (Base) {
      function Router() {
        var args = [], len = arguments.length;
        while (len--) args[len] = arguments[len];

        Base.apply(this, args);

        this.route = {};
      }

      if (Base) Router.__proto__ = Base;
      Router.prototype = Object.create(Base && Base.prototype);
      Router.prototype.constructor = Router;

      Router.prototype.updateRender = function updateRender() {
        this.router.normalize();
        this.route = this.router.parse();
        body.setAttribute('data-page', this.route.file);
      };

      Router.prototype.initRouter = function initRouter() {
        var this$1 = this;

        var config = this.config;
        var mode = config.routerMode || 'hash';
        var router;

        if (mode === 'history' && supportsPushState) {
          router = new HTML5History(config);
        } else {
          router = new HashHistory(config);
        }

        this.router = router;
        this.updateRender();
        lastRoute = this.route;

        // eslint-disable-next-line no-unused-vars
        router.onchange(function (params) {
          this$1.updateRender();
          this$1._updateRender();

          if (lastRoute.path === this$1.route.path) {
            this$1.$resetEvents(params.source);
            return;
          }

          this$1.$fetch(noop, this$1.$resetEvents.bind(this$1, params.source));
          lastRoute = this$1.route;
        });
      };

      return Router;
    }(Base));
  }

  var RGX = /([^{]*?)\w(?=\})/g;

  var MAP = {
    YYYY: 'getFullYear',
    YY: 'getYear',
    MM: function (d) {
      return d.getMonth() + 1;
    },
    DD: 'getDate',
    HH: 'getHours',
    mm: 'getMinutes',
    ss: 'getSeconds',
    fff: 'getMilliseconds'
  };

  function tinydate(str, custom) {
    var parts = [], offset = 0;

    str.replace(RGX, function (key, _, idx) {
      // save preceding string
      parts.push(str.substring(offset, idx - 1));
      offset = idx += key.length + 1;
      // save function
      parts.push(custom && custom[key] || function (d) {
        return ('00' + (typeof MAP[key] === 'string' ? d[MAP[key]]() : MAP[key](d))).slice(-key.length);
      });
    });

    if (offset !== str.length) {
      parts.push(str.substring(offset));
    }

    return function (arg) {
      var out = '', i = 0, d = arg || new Date();
      for (; i < parts.length; i++) {
        out += (typeof parts[i] === 'string') ? parts[i] : parts[i](d);
      }
      return out;
    };
  }

  var barEl;
  var timeId;

  /**
   * Init progress component
   */
  function init() {
    var div = create('div');

    div.classList.add('progress');
    appendTo(body, div);
    barEl = div;
  }

  /**
   * Render progress bar
   */
  function progressbar(ref) {
    var loaded = ref.loaded;
    var total = ref.total;
    var step = ref.step;

    var num;

    !barEl && init();

    if (step) {
      num = parseInt(barEl.style.width || 0, 10) + step;
      num = num > 80 ? 80 : num;
    } else {
      num = Math.floor((loaded / total) * 100);
    }

    barEl.style.opacity = 1;
    barEl.style.width = num >= 95 ? '100%' : num + '%';

    if (num >= 95) {
      clearTimeout(timeId);
      // eslint-disable-next-line no-unused-vars
      timeId = setTimeout(function (_) {
        barEl.style.opacity = 0;
        barEl.style.width = '0%';
      }, 200);
    }
  }

  /* eslint-disable no-unused-vars */

  var cache = {};

  /**
   * Ajax GET implmentation
   * @param {string} url Resource URL
   * @param {boolean} [hasBar=false] Has progress bar
   * @param {String[]} headers Array of headers
   * @return {Promise} Promise response
   */
  function get(url, hasBar, headers) {
    if (hasBar === void 0) hasBar = false;
    if (headers === void 0) headers = {};

    var xhr = new XMLHttpRequest();
    var on = function () {
      xhr.addEventListener.apply(xhr, arguments);
    };

    var cached = cache[url];

    if (cached) {
      return { then: function (cb) { return cb(cached.content, cached.opt); }, abort: noop };
    }

    xhr.open('GET', url);
    for (var i in headers) {
      if (hasOwn.call(headers, i)) {
        xhr.setRequestHeader(i, headers[i]);
      }
    }

    xhr.send();

    return {
      then: function (success, error) {
        if (error === void 0) error = noop;

        if (hasBar) {
          var id = setInterval(
            function (_) {
              return progressbar({
                step: Math.floor(Math.random() * 5 + 1),
              });
            },
            500
          );

          on('progress', progressbar);
          on('loadend', function (evt) {
            progressbar(evt);
            clearInterval(id);
          });
        }

        on('error', error);
        on('load', function (ref) {
          var target = ref.target;

          if (target.status >= 400) {
            error(target);
          } else {
            var result = (cache[url] = {
              content: window.removeFrontmatter(target.response),
              opt: {
                updatedAt: xhr.getResponseHeader('last-modified'),
              },
            });
            success((result.content), result.opt);
          }
        });
      },
      abort: function (_) { return xhr.readyState !== 4 && xhr.abort(); },
    };
  }

  function replaceVar(block, color) {
    block.innerHTML = block.innerHTML.replace(
      /var\(\s*--theme-color.*?\)/g,
      color
    );
  }

  function cssVars(color) {
    // Variable support
    if (window.CSS && window.CSS.supports && window.CSS.supports('(--v:red)')) {
      return;
    }

    var styleBlocks = findAll('style:not(.inserted),link');
    [].forEach.call(styleBlocks, function (block) {
      if (block.nodeName === 'STYLE') {
        replaceVar(block, color);
      } else if (block.nodeName === 'LINK') {
        var href = block.getAttribute('href');

        if (!/\.css$/.test(href)) {
          return;
        }

        get(href).then(function (res) {
          var style = create('style', res);

          head.appendChild(style);
          replaceVar(style, color);
        });
      }
    });
  }

  /* eslint-disable no-unused-vars */

  var title = $.title;
  /**
   * Toggle button
   * @param {Element} el Button to be toggled
   * @void
   */
  function btn(el) {
    var toggle = function (_) { return body.classList.toggle('close'); };

    el = getNode(el);
    if (el === null || el === undefined) {
      return;
    }

    on(el, 'click', function (e) {
      e.stopPropagation();
      toggle();
    });

    isMobile &&
      on(
        body,
        'click',
        function (_) { return body.classList.contains('close') && toggle(); }
      );
  }

  function collapse(el) {
    el = getNode(el);
    if (el === null || el === undefined) {
      return;
    }

    on(el, 'click', function (ref) {
      var target = ref.target;

      if (
        target.nodeName === 'A' &&
        target.nextSibling &&
        target.nextSibling.classList &&
        target.nextSibling.classList.contains('app-sub-sidebar')
      ) {
        toggleClass(target.parentNode, 'collapse');
      }
    });
  }

  function sticky() {
    var cover = getNode('section.cover');
    if (!cover) {
      return;
    }

    var coverHeight = cover.getBoundingClientRect().height;

    if (window.pageYOffset >= coverHeight || cover.classList.contains('hidden')) {
      toggleClass(body, 'add', 'sticky');
    } else {
      toggleClass(body, 'remove', 'sticky');
    }
  }

  /**
   * Get and active link
   * @param  {Object} router Router
   * @param  {String|Element} el Target element
   * @param  {Boolean} isParent Active parent
   * @param  {Boolean} autoTitle Automatically set title
   * @return {Element} Active element
   */
  function getAndActive(router, el, isParent, autoTitle) {
    el = getNode(el);
    var links = [];
    if (el !== null && el !== undefined) {
      links = findAll(el, 'a');
    }

    var hash = decodeURI(router.toURL(router.getCurrentPath()));
    var target;

    links
      .sort(function (a, b) { return b.href.length - a.href.length; })
      .forEach(function (a) {
        var href = decodeURI(a.getAttribute('href'));
        var node = isParent ? a.parentNode : a;

        a.title = a.title || a.innerText;

        if (hash.indexOf(href) === 0 && !target) {
          target = a;
          toggleClass(node, 'add', 'active');
        } else {
          toggleClass(node, 'remove', 'active');
        }
      });

    if (autoTitle) {
      $.title = target
        ? target.title || ((target.innerText) + " - " + title)
        : title;
    }

    return target;
  }

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties(Constructor.prototype, protoProps); } if (staticProps) { defineProperties(Constructor, staticProps); } return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var SingleTweener = function () {
    function SingleTweener() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, SingleTweener);

      this.start = opts.start;
      this.end = opts.end;
      this.decimal = opts.decimal;
    }

    _createClass(SingleTweener, [{
      key: "getIntermediateValue",
      value: function getIntermediateValue(tick) {
        if (this.decimal) {
          return tick;
        } else {
          return Math.round(tick);
        }
      }
    }, {
        key: "getFinalValue",
        value: function getFinalValue() {
          return this.end;
        }
      }]);

    return SingleTweener;
  }();

  var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties(Constructor.prototype, protoProps); } if (staticProps) { defineProperties(Constructor, staticProps); } return Constructor; }; }();

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var Tweezer = function () {
    function Tweezer() {
      var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck$1(this, Tweezer);

      this.duration = opts.duration || 1000;
      this.ease = opts.easing || this._defaultEase;
      this.tweener = opts.tweener || new SingleTweener(opts);
      this.start = this.tweener.start;
      this.end = this.tweener.end;

      this.frame = null;
      this.next = null;
      this.isRunning = false;
      this.events = {};
      this.direction = this.start < this.end ? 'up' : 'down';
    }

    _createClass$1(Tweezer, [{
      key: 'begin',
      value: function begin() {
        if (!this.isRunning && this.next !== this.end) {
          this.frame = window.requestAnimationFrame(this._tick.bind(this));
        }
        return this;
      }
    }, {
        key: 'stop',
        value: function stop() {
          window.cancelAnimationFrame(this.frame);
          this.isRunning = false;
          this.frame = null;
          this.timeStart = null;
          this.next = null;
          return this;
        }
      }, {
        key: 'on',
        value: function on(name, handler) {
          this.events[name] = this.events[name] || [];
          this.events[name].push(handler);
          return this;
        }
      }, {
        key: '_emit',
      value: function _emit(name, val) {
        var _this = this;

        var e = this.events[name];
        e && e.forEach(function (handler) {
          return handler.call(_this, val);
        });
        }
      }, {
        key: '_tick',
        value: function _tick(currentTime) {
          this.isRunning = true;

          var lastTick = this.next || this.start;

          if (!this.timeStart) { this.timeStart = currentTime; }
          this.timeElapsed = currentTime - this.timeStart;
          this.next = this.ease(this.timeElapsed, this.start, this.end - this.start, this.duration);

          if (this._shouldTick(lastTick)) {
            this._emit('tick', this.tweener.getIntermediateValue(this.next));
            this.frame = window.requestAnimationFrame(this._tick.bind(this));
          } else {
            this._emit('tick', this.tweener.getFinalValue());
            this._emit('done', null);
          }
        }
      }, {
        key: '_shouldTick',
        value: function _shouldTick(lastTick) {
          return {
            up: this.next < this.end && lastTick <= this.next,
            down: this.next > this.end && lastTick >= this.next
          }[this.direction];
        }
      }, {
        key: '_defaultEase',
      value: function _defaultEase(t, b, c, d) {
        if ((t /= d / 2) < 1) { return c / 2 * t * t + b; }
        return -c / 2 * (--t * (t - 2) - 1) + b;
      }
      }]);

    return Tweezer;
  }();

  var currentScript = document.currentScript;

  /** @param {import('./Docsify').Docsify} vm */
  function config(vm) {
    var config = merge(
      {
        auto2top: false,
        autoHeader: false,
        basePath: '',
        catchPluginErrors: true,
        cornerExternalLinkTarget: '_blank',
        coverpage: '',
        el: '#app',
        executeScript: null,
        ext: '.md',
        externalLinkRel: 'noopener',
        externalLinkTarget: '_blank',
        formatUpdated: '',
        ga: '',
        homepage: 'README.md',
        loadNavbar: null,
        loadSidebar: null,
        maxLevel: 6,
        mergeNavbar: false,
        name: '',
        nameLink: window.location.pathname,
        nativeEmoji: false,
        noCompileLinks: [],
        noEmoji: false,
        notFoundPage: true,
        relativePath: false,
        repo: '',
        routes: {},
        routerMode: 'hash',
        subMaxLevel: 0,
        themeColor: '',
        topMargin: 0,
      },
      typeof window.$docsify === 'function'
        ? window.$docsify(vm)
        : window.$docsify
    );

    var script =
      currentScript ||
      [].slice
        .call(document.getElementsByTagName('script'))
        .filter(function (n) { return /docsify\./.test(n.src); })[0];

    if (script) {
      for (var prop in config) {
        if (hasOwn.call(config, prop)) {
          var val = script.getAttribute('data-' + hyphenate(prop));

          if (isPrimitive(val)) {
            config[prop] = val === '' ? true : val;
          }
        }
      }
    }

    if (config.loadSidebar === true) {
      config.loadSidebar = '_sidebar' + config.ext;
    }

    if (config.loadNavbar === true) {
      config.loadNavbar = '_navbar' + config.ext;
    }

    if (config.coverpage === true) {
      config.coverpage = '_coverpage' + config.ext;
    }

    if (config.repo === true) {
      config.repo = '';
    }

    if (config.name === true) {
      config.name = '';
    }

    window.$docsify = config;

    return config;
  }

  var nav = {};
  var hoverOver = false;
  var scroller = null;
  var enableScrollEvent = true;
  var coverHeight = 0;

  function scrollTo(el, offset) {
    if (offset === void 0) offset = 0;

    if (scroller) {
      scroller.stop();
    }

    enableScrollEvent = false;
    scroller = new Tweezer({
      start: window.pageYOffset,
      end:
        Math.round(el.getBoundingClientRect().top) + window.pageYOffset - offset,
      duration: 500,
    })
      .on('tick', function (v) { return window.scrollTo(0, v); })
      .on('done', function () {
        enableScrollEvent = true;
        scroller = null;
      })
      .begin();
  }

  function highlight(path) {
    if (!enableScrollEvent) {
      return;
    }

    var sidebar = getNode('.sidebar');
    var anchors = findAll('.anchor');
    var wrap = find(sidebar, '.sidebar-nav');
    var active = find(sidebar, 'li.active');
    var doc = document.documentElement;
    var top = ((doc && doc.scrollTop) || document.body.scrollTop) - coverHeight;
    var last;

    for (var i = 0, len = anchors.length; i < len; i += 1) {
      var node = anchors[i];

      if (node.offsetTop > top) {
        if (!last) {
          last = node;
        }

        break;
      } else {
        last = node;
      }
    }

    if (!last) {
      return;
    }

    var li = nav[getNavKey(path, last.getAttribute('data-id'))];

    if (!li || li === active) {
      return;
    }

    active && active.classList.remove('active');
    li.classList.add('active');
    active = li;

    // Scroll into view
    // https://github.com/vuejs/vuejs.org/blob/master/themes/vue/source/js/common.js#L282-L297
    if (!hoverOver && body.classList.contains('sticky')) {
      var height = sidebar.clientHeight;
      var curOffset = 0;
      var cur = active.offsetTop + active.clientHeight + 40;
      var isInView =
        active.offsetTop >= wrap.scrollTop && cur <= wrap.scrollTop + height;
      var notThan = cur - curOffset < height;

      sidebar.scrollTop = isInView
        ? wrap.scrollTop
        : notThan
          ? curOffset
          : cur - height;
    }
  }

  function getNavKey(path, id) {
    return ((decodeURIComponent(path)) + "?id=" + (decodeURIComponent(id)));
  }

  function scrollActiveSidebar(router) {
    var cover = find('.cover.show');
    coverHeight = cover ? cover.offsetHeight : 0;

    var sidebar = getNode('.sidebar');
    var lis = [];
    if (sidebar !== null && sidebar !== undefined) {
      lis = findAll(sidebar, 'li');
    }

    for (var i = 0, len = lis.length; i < len; i += 1) {
      var li = lis[i];
      var a = li.querySelector('a');
      if (!a) {
        continue;
      }

      var href = a.getAttribute('href');

      if (href !== '/') {
        var ref = router.parse(href);
        var id = ref.query.id;
        var path$1 = ref.path;
        if (id) {
          href = getNavKey(path$1, id);
        }
      }

      if (href) {
        nav[decodeURIComponent(href)] = li;
      }
    }

    if (isMobile) {
      return;
    }

    var path = removeParams(router.getCurrentPath());
    off('scroll', function () { return highlight(path); });
    on('scroll', function () { return highlight(path); });
    on(sidebar, 'mouseover', function () {
      hoverOver = true;
    });
    on(sidebar, 'mouseleave', function () {
      hoverOver = false;
    });
  }

  function scrollIntoView(path, id) {
    if (!id) {
      return;
    }
    var topMargin = config().topMargin;
    var section = find('#' + id);
    section && scrollTo(section, topMargin);

    var li = nav[getNavKey(path, id)];
    var sidebar = getNode('.sidebar');
    var active = find(sidebar, 'li.active');
    active && active.classList.remove('active');
    li && li.classList.add('active');
  }

  var scrollEl = $.scrollingElement || $.documentElement;

  function scroll2Top(offset) {
    if (offset === void 0) offset = 0;

    scrollEl.scrollTop = offset === true ? 0 : Number(offset);
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
    return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var defaults = createCommonjsModule(function (module) {
    function getDefaults() {
      return {
        baseUrl: null,
        breaks: false,
        gfm: true,
        headerIds: true,
        headerPrefix: '',
        highlight: null,
        langPrefix: 'language-',
        mangle: true,
        pedantic: false,
        renderer: null,
        sanitize: false,
        sanitizer: null,
        silent: false,
        smartLists: false,
        smartypants: false,
        tokenizer: null,
        walkTokens: null,
        xhtml: false
      };
    }

    function changeDefaults(newDefaults) {
      module.exports.defaults = newDefaults;
    }

    module.exports = {
      defaults: getDefaults(),
      getDefaults: getDefaults,
      changeDefaults: changeDefaults
    };
  });
  var defaults_1 = defaults.defaults;
  var defaults_2 = defaults.getDefaults;
  var defaults_3 = defaults.changeDefaults;

  /**
   * Helpers
   */
  var escapeTest = /[&<>"']/;
  var escapeReplace = /[&<>"']/g;
  var escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
  var escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
  var escapeReplacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  var getEscapeReplacement = function (ch) { return escapeReplacements[ch]; };
  function escape(html, encode) {
    if (encode) {
      if (escapeTest.test(html)) {
        return html.replace(escapeReplace, getEscapeReplacement);
      }
    } else {
      if (escapeTestNoEncode.test(html)) {
        return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
      }
    }

    return html;
  }

  var unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;

  function unescape(html) {
    // explicitly match decimal, hex, and named HTML entities
    return html.replace(unescapeTest, function (_, n) {
      n = n.toLowerCase();
      if (n === 'colon') { return ':'; }
      if (n.charAt(0) === '#') {
        return n.charAt(1) === 'x'
          ? String.fromCharCode(parseInt(n.substring(2), 16))
          : String.fromCharCode(+n.substring(1));
      }
      return '';
    });
  }

  var caret = /(^|[^\[])\^/g;
  function edit(regex, opt) {
    regex = regex.source || regex;
    opt = opt || '';
    var obj = {
      replace: function (name, val) {
        val = val.source || val;
        val = val.replace(caret, '$1');
        regex = regex.replace(name, val);
        return obj;
      },
      getRegex: function () {
        return new RegExp(regex, opt);
      }
    };
    return obj;
  }

  var nonWordAndColonTest = /[^\w:]/g;
  var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;
  function cleanUrl(sanitize, base, href) {
    if (sanitize) {
      var prot;
      try {
        prot = decodeURIComponent(unescape(href))
          .replace(nonWordAndColonTest, '')
          .toLowerCase();
      } catch (e) {
        return null;
      }
      if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
        return null;
      }
    }
    if (base && !originIndependentUrl.test(href)) {
      href = resolveUrl(base, href);
    }
    try {
      href = encodeURI(href).replace(/%25/g, '%');
    } catch (e) {
      return null;
    }
    return href;
  }

  var baseUrls = {};
  var justDomain = /^[^:]+:\/*[^/]*$/;
  var protocol = /^([^:]+:)[\s\S]*$/;
  var domain = /^([^:]+:\/*[^/]*)[\s\S]*$/;

  function resolveUrl(base, href) {
    if (!baseUrls[' ' + base]) {
      // we can ignore everything in base after the last slash of its path component,
      // but we might need to add _that_
      // https://tools.ietf.org/html/rfc3986#section-3
      if (justDomain.test(base)) {
        baseUrls[' ' + base] = base + '/';
      } else {
        baseUrls[' ' + base] = rtrim(base, '/', true);
      }
    }
    base = baseUrls[' ' + base];
    var relativeBase = base.indexOf(':') === -1;

    if (href.substring(0, 2) === '//') {
      if (relativeBase) {
        return href;
      }
      return base.replace(protocol, '$1') + href;
    } else if (href.charAt(0) === '/') {
      if (relativeBase) {
        return href;
      }
      return base.replace(domain, '$1') + href;
    } else {
      return base + href;
    }
  }

  var noopTest = { exec: function noopTest() { } };

  function merge$1(obj) {
    var arguments$1 = arguments;

    var i = 1,
      target,
      key;

    for (; i < arguments.length; i++) {
      target = arguments$1[i];
      for (key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
          obj[key] = target[key];
        }
      }
    }

    return obj;
  }

  function splitCells(tableRow, count) {
    // ensure that every cell-delimiting pipe has a space
    // before it to distinguish it from an escaped pipe
    var row = tableRow.replace(/\|/g, function (match, offset, str) {
      var escaped = false,
        curr = offset;
      while (--curr >= 0 && str[curr] === '\\') { escaped = !escaped; }
      if (escaped) {
        // odd number of slashes means | is escaped
        // so we leave it alone
        return '|';
      } else {
        // add space before unescaped |
        return ' |';
      }
    }),
      cells = row.split(/ \|/);
    var i = 0;

    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count) { cells.push(''); }
    }

    for (; i < cells.length; i++) {
      // leading or trailing whitespace is ignored per the gfm spec
      cells[i] = cells[i].trim().replace(/\\\|/g, '|');
    }
    return cells;
  }

  // Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
  // /c*$/ is vulnerable to REDOS.
  // invert: Remove suffix of non-c chars instead. Default falsey.
  function rtrim(str, c, invert) {
    var l = str.length;
    if (l === 0) {
      return '';
    }

    // Length of suffix matching the invert condition.
    var suffLen = 0;

    // Step left until we fail to match the invert condition.
    while (suffLen < l) {
      var currChar = str.charAt(l - suffLen - 1);
      if (currChar === c && !invert) {
        suffLen++;
      } else if (currChar !== c && invert) {
        suffLen++;
      } else {
        break;
      }
    }

    return str.substr(0, l - suffLen);
  }

  function findClosingBracket(str, b) {
    if (str.indexOf(b[1]) === -1) {
      return -1;
    }
    var l = str.length;
    var level = 0,
      i = 0;
    for (; i < l; i++) {
      if (str[i] === '\\') {
        i++;
      } else if (str[i] === b[0]) {
        level++;
      } else if (str[i] === b[1]) {
        level--;
        if (level < 0) {
          return i;
        }
      }
    }
    return -1;
  }

  function checkSanitizeDeprecation(opt) {
    if (opt && opt.sanitize && !opt.silent) {
      console.warn('marked(): sanitize and sanitizer parameters are deprecated since version 0.7.0, should not be used and will be removed in the future. Read more here: https://marked.js.org/#/USING_ADVANCED.md#options');
    }
  }

  // copied from https://stackoverflow.com/a/5450113/806777
  function repeatString(pattern, count) {
    if (count < 1) {
      return '';
    }
    var result = '';
    while (count > 1) {
      if (count & 1) {
        result += pattern;
      }
      count >>= 1;
      pattern += pattern;
    }
    return result + pattern;
  }

  var helpers = {
    escape: escape,
    unescape: unescape,
    edit: edit,
    cleanUrl: cleanUrl,
    resolveUrl: resolveUrl,
    noopTest: noopTest,
    merge: merge$1,
    splitCells: splitCells,
    rtrim: rtrim,
    findClosingBracket: findClosingBracket,
    checkSanitizeDeprecation: checkSanitizeDeprecation,
    repeatString: repeatString
  };

  var defaults$1 = defaults.defaults;

  var rtrim$1 = helpers.rtrim;
  var splitCells$1 = helpers.splitCells;
  var escape$1 = helpers.escape;
  var findClosingBracket$1 = helpers.findClosingBracket;

  function outputLink(cap, link, raw) {
    var href = link.href;
    var title = link.title ? escape$1(link.title) : null;
    var text = cap[1].replace(/\\([\[\]])/g, '$1');

    if (cap[0].charAt(0) !== '!') {
      return {
        type: 'link',
        raw: raw,
        href: href,
        title: title,
        text: text
      };
    } else {
      return {
        type: 'image',
        raw: raw,
        href: href,
        title: title,
        text: escape$1(text)
      };
    }
  }

  function indentCodeCompensation(raw, text) {
    var matchIndentToCode = raw.match(/^(\s+)(?:```)/);

    if (matchIndentToCode === null) {
      return text;
    }

    var indentToCode = matchIndentToCode[1];

    return text
      .split('\n')
      .map(function (node) {
        var matchIndentInNode = node.match(/^\s+/);
        if (matchIndentInNode === null) {
          return node;
        }

        var indentInNode = matchIndentInNode[0];

        if (indentInNode.length >= indentToCode.length) {
          return node.slice(indentToCode.length);
        }

        return node;
      })
      .join('\n');
  }

  /**
   * Tokenizer
   */
  var Tokenizer = /*@__PURE__*/(function () {
    function Tokenizer(options) {
      this.options = options || defaults$1;
    }

    Tokenizer.prototype.space = function space(src) {
      var cap = this.rules.block.newline.exec(src);
      if (cap) {
        if (cap[0].length > 1) {
          return {
            type: 'space',
            raw: cap[0]
          };
        }
        return { raw: '\n' };
      }
    };

    Tokenizer.prototype.code = function code(src, tokens) {
      var cap = this.rules.block.code.exec(src);
      if (cap) {
        var lastToken = tokens[tokens.length - 1];
        // An indented code block cannot interrupt a paragraph.
        if (lastToken && lastToken.type === 'paragraph') {
          return {
            raw: cap[0],
            text: cap[0].trimRight()
          };
        }

        var text = cap[0].replace(/^ {1,4}/gm, '');
        return {
          type: 'code',
          raw: cap[0],
          codeBlockStyle: 'indented',
          text: !this.options.pedantic
            ? rtrim$1(text, '\n')
            : text
        };
      }
    };

    Tokenizer.prototype.fences = function fences(src) {
      var cap = this.rules.block.fences.exec(src);
      if (cap) {
        var raw = cap[0];
        var text = indentCodeCompensation(raw, cap[3] || '');

        return {
          type: 'code',
          raw: raw,
          lang: cap[2] ? cap[2].trim() : cap[2],
          text: text
        };
      }
    };

    Tokenizer.prototype.heading = function heading(src) {
      var cap = this.rules.block.heading.exec(src);
      if (cap) {
        var text = cap[2].trim();

        // remove trailing #s
        if (/#$/.test(text)) {
          var trimmed = rtrim$1(text, '#');
          if (this.options.pedantic) {
            text = trimmed.trim();
          } else if (!trimmed || / $/.test(trimmed)) {
            // CommonMark requires space before trailing #s
            text = trimmed.trim();
          }
        }

        return {
          type: 'heading',
          raw: cap[0],
          depth: cap[1].length,
          text: text
        };
      }
    };

    Tokenizer.prototype.nptable = function nptable(src) {
      var cap = this.rules.block.nptable.exec(src);
      if (cap) {
        var item = {
          type: 'table',
          header: splitCells$1(cap[1].replace(/^ *| *\| *$/g, '')),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : [],
          raw: cap[0]
        };

        if (item.header.length === item.align.length) {
          var l = item.align.length;
          var i;
          for (i = 0; i < l; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right';
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center';
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left';
            } else {
              item.align[i] = null;
            }
          }

          l = item.cells.length;
          for (i = 0; i < l; i++) {
            item.cells[i] = splitCells$1(item.cells[i], item.header.length);
          }

          return item;
        }
      }
    };

    Tokenizer.prototype.hr = function hr(src) {
      var cap = this.rules.block.hr.exec(src);
      if (cap) {
        return {
          type: 'hr',
          raw: cap[0]
        };
      }
    };

    Tokenizer.prototype.blockquote = function blockquote(src) {
      var cap = this.rules.block.blockquote.exec(src);
      if (cap) {
        var text = cap[0].replace(/^ *> ?/gm, '');

        return {
          type: 'blockquote',
          raw: cap[0],
          text: text
        };
      }
    };

    Tokenizer.prototype.list = function list(src) {
      var cap = this.rules.block.list.exec(src);
      if (cap) {
        var raw = cap[0];
        var bull = cap[2];
        var isordered = bull.length > 1;

        var list = {
          type: 'list',
          raw: raw,
          ordered: isordered,
          start: isordered ? +bull.slice(0, -1) : '',
          loose: false,
          items: []
        };

        // Get each top-level item.
        var itemMatch = cap[0].match(this.rules.block.item);

        var next = false,
          item,
          space,
          bcurr,
          bnext,
          addBack,
          loose,
          istask,
          ischecked;

        var l = itemMatch.length;
        bcurr = this.rules.block.listItemStart.exec(itemMatch[0]);
        for (var i = 0; i < l; i++) {
          item = itemMatch[i];
          raw = item;

          // Determine whether the next list item belongs here.
          // Backpedal if it does not belong in this list.
          if (i !== l - 1) {
            bnext = this.rules.block.listItemStart.exec(itemMatch[i + 1]);
            if (
              !this.options.pedantic
                ? bnext[1].length > bcurr[0].length || bnext[1].length > 3
                : bnext[1].length > bcurr[1].length
            ) {
              // nested list
              itemMatch.splice(i, 2, itemMatch[i] + '\n' + itemMatch[i + 1]);
              i--;
              l--;
              continue;
            } else {
              if (
                // different bullet style
                !this.options.pedantic || this.options.smartLists
                  ? bnext[2][bnext[2].length - 1] !== bull[bull.length - 1]
                  : isordered === (bnext[2].length === 1)
              ) {
                addBack = itemMatch.slice(i + 1).join('\n');
                list.raw = list.raw.substring(0, list.raw.length - addBack.length);
                i = l - 1;
              }
            }
            bcurr = bnext;
          }

          // Remove the list item's bullet
          // so it is seen as the next token.
          space = item.length;
          item = item.replace(/^ *([*+-]|\d+[.)]) ?/, '');

          // Outdent whatever the
          // list item contains. Hacky.
          if (~item.indexOf('\n ')) {
            space -= item.length;
            item = !this.options.pedantic
              ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
              : item.replace(/^ {1,4}/gm, '');
          }

          // Determine whether item is loose or not.
          // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
          // for discount behavior.
          loose = next || /\n\n(?!\s*$)/.test(item);
          if (i !== l - 1) {
            next = item.charAt(item.length - 1) === '\n';
            if (!loose) { loose = next; }
          }

          if (loose) {
            list.loose = true;
          }

          // Check for task list items
          if (this.options.gfm) {
            istask = /^\[[ xX]\] /.test(item);
            ischecked = undefined;
            if (istask) {
              ischecked = item[1] !== ' ';
              item = item.replace(/^\[[ xX]\] +/, '');
            }
          }

          list.items.push({
            type: 'list_item',
            raw: raw,
            task: istask,
            checked: ischecked,
            loose: loose,
            text: item
          });
        }

        return list;
      }
    };

    Tokenizer.prototype.html = function html(src) {
      var cap = this.rules.block.html.exec(src);
      if (cap) {
        return {
          type: this.options.sanitize
            ? 'paragraph'
            : 'html',
          raw: cap[0],
          pre: !this.options.sanitizer
            && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
          text: this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape$1(cap[0])) : cap[0]
        };
      }
    };

    Tokenizer.prototype.def = function def(src) {
      var cap = this.rules.block.def.exec(src);
      if (cap) {
        if (cap[3]) { cap[3] = cap[3].substring(1, cap[3].length - 1); }
        var tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
        return {
          tag: tag,
          raw: cap[0],
          href: cap[2],
          title: cap[3]
        };
      }
    };

    Tokenizer.prototype.table = function table(src) {
      var cap = this.rules.block.table.exec(src);
      if (cap) {
        var item = {
          type: 'table',
          header: splitCells$1(cap[1].replace(/^ *| *\| *$/g, '')),
          align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
          cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
        };

        if (item.header.length === item.align.length) {
          item.raw = cap[0];

          var l = item.align.length;
          var i;
          for (i = 0; i < l; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right';
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center';
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left';
            } else {
              item.align[i] = null;
            }
          }

          l = item.cells.length;
          for (i = 0; i < l; i++) {
            item.cells[i] = splitCells$1(
              item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
              item.header.length);
          }

          return item;
        }
      }
    };

    Tokenizer.prototype.lheading = function lheading(src) {
      var cap = this.rules.block.lheading.exec(src);
      if (cap) {
        return {
          type: 'heading',
          raw: cap[0],
          depth: cap[2].charAt(0) === '=' ? 1 : 2,
          text: cap[1]
        };
      }
    };

    Tokenizer.prototype.paragraph = function paragraph(src) {
      var cap = this.rules.block.paragraph.exec(src);
      if (cap) {
        return {
          type: 'paragraph',
          raw: cap[0],
          text: cap[1].charAt(cap[1].length - 1) === '\n'
            ? cap[1].slice(0, -1)
            : cap[1]
        };
      }
    };

    Tokenizer.prototype.text = function text(src, tokens) {
      var cap = this.rules.block.text.exec(src);
      if (cap) {
        var lastToken = tokens[tokens.length - 1];
        if (lastToken && lastToken.type === 'text') {
          return {
            raw: cap[0],
            text: cap[0]
          };
        }

        return {
          type: 'text',
          raw: cap[0],
          text: cap[0]
        };
      }
    };

    Tokenizer.prototype.escape = function escape$1$1(src) {
      var cap = this.rules.inline.escape.exec(src);
      if (cap) {
        return {
          type: 'escape',
          raw: cap[0],
          text: escape$1(cap[1])
        };
      }
    };

    Tokenizer.prototype.tag = function tag(src, inLink, inRawBlock) {
      var cap = this.rules.inline.tag.exec(src);
      if (cap) {
        if (!inLink && /^<a /i.test(cap[0])) {
          inLink = true;
        } else if (inLink && /^<\/a>/i.test(cap[0])) {
          inLink = false;
        }
        if (!inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          inRawBlock = true;
        } else if (inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
          inRawBlock = false;
        }

        return {
          type: this.options.sanitize
            ? 'text'
            : 'html',
          raw: cap[0],
          inLink: inLink,
          inRawBlock: inRawBlock,
          text: this.options.sanitize
            ? (this.options.sanitizer
              ? this.options.sanitizer(cap[0])
              : escape$1(cap[0]))
            : cap[0]
        };
      }
    };

    Tokenizer.prototype.link = function link(src) {
      var cap = this.rules.inline.link.exec(src);
      if (cap) {
        var trimmedUrl = cap[2].trim();
        if (!this.options.pedantic && /^</.test(trimmedUrl)) {
          // commonmark requires matching angle brackets
          if (!(/>$/.test(trimmedUrl))) {
            return;
          }

          // ending angle bracket cannot be escaped
          var rtrimSlash = rtrim$1(trimmedUrl.slice(0, -1), '\\');
          if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
            return;
          }
        } else {
          // find closing parenthesis
          var lastParenIndex = findClosingBracket$1(cap[2], '()');
          if (lastParenIndex > -1) {
            var start = cap[0].indexOf('!') === 0 ? 5 : 4;
            var linkLen = start + cap[1].length + lastParenIndex;
            cap[2] = cap[2].substring(0, lastParenIndex);
            cap[0] = cap[0].substring(0, linkLen).trim();
            cap[3] = '';
          }
        }
        var href = cap[2];
        var title = '';
        if (this.options.pedantic) {
          // split pedantic href and title
          var link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

          if (link) {
            href = link[1];
            title = link[3];
          }
        } else {
          title = cap[3] ? cap[3].slice(1, -1) : '';
        }

        href = href.trim();
        if (/^</.test(href)) {
          if (this.options.pedantic && !(/>$/.test(trimmedUrl))) {
            // pedantic allows starting angle bracket without ending angle bracket
            href = href.slice(1);
          } else {
            href = href.slice(1, -1);
          }
        }
        return outputLink(cap, {
          href: href ? href.replace(this.rules.inline._escapes, '$1') : href,
          title: title ? title.replace(this.rules.inline._escapes, '$1') : title
        }, cap[0]);
      }
    };

    Tokenizer.prototype.reflink = function reflink(src, links) {
      var cap;
      if ((cap = this.rules.inline.reflink.exec(src))
        || (cap = this.rules.inline.nolink.exec(src))) {
        var link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
        link = links[link.toLowerCase()];
        if (!link || !link.href) {
          var text = cap[0].charAt(0);
          return {
            type: 'text',
            raw: text,
            text: text
          };
        }
        return outputLink(cap, link, cap[0]);
      }
    };

    Tokenizer.prototype.strong = function strong(src, maskedSrc, prevChar) {
      if (prevChar === void 0) prevChar = '';

      var match = this.rules.inline.strong.start.exec(src);

      if (match && (!match[1] || (match[1] && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar))))) {
        maskedSrc = maskedSrc.slice(-1 * src.length);
        var endReg = match[0] === '**' ? this.rules.inline.strong.endAst : this.rules.inline.strong.endUnd;

        endReg.lastIndex = 0;

        var cap;
        while ((match = endReg.exec(maskedSrc)) != null) {
          cap = this.rules.inline.strong.middle.exec(maskedSrc.slice(0, match.index + 3));
          if (cap) {
            return {
              type: 'strong',
              raw: src.slice(0, cap[0].length),
              text: src.slice(2, cap[0].length - 2)
            };
          }
        }
      }
    };

    Tokenizer.prototype.em = function em(src, maskedSrc, prevChar) {
      if (prevChar === void 0) prevChar = '';

      var match = this.rules.inline.em.start.exec(src);

      if (match && (!match[1] || (match[1] && (prevChar === '' || this.rules.inline.punctuation.exec(prevChar))))) {
        maskedSrc = maskedSrc.slice(-1 * src.length);
        var endReg = match[0] === '*' ? this.rules.inline.em.endAst : this.rules.inline.em.endUnd;

        endReg.lastIndex = 0;

        var cap;
        while ((match = endReg.exec(maskedSrc)) != null) {
          cap = this.rules.inline.em.middle.exec(maskedSrc.slice(0, match.index + 2));
          if (cap) {
            return {
              type: 'em',
              raw: src.slice(0, cap[0].length),
              text: src.slice(1, cap[0].length - 1)
            };
          }
        }
      }
    };

    Tokenizer.prototype.codespan = function codespan(src) {
      var cap = this.rules.inline.code.exec(src);
      if (cap) {
        var text = cap[2].replace(/\n/g, ' ');
        var hasNonSpaceChars = /[^ ]/.test(text);
        var hasSpaceCharsOnBothEnds = /^ /.test(text) && / $/.test(text);
        if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
          text = text.substring(1, text.length - 1);
        }
        text = escape$1(text, true);
        return {
          type: 'codespan',
          raw: cap[0],
          text: text
        };
      }
    };

    Tokenizer.prototype.br = function br(src) {
      var cap = this.rules.inline.br.exec(src);
      if (cap) {
        return {
          type: 'br',
          raw: cap[0]
        };
      }
    };

    Tokenizer.prototype.del = function del(src) {
      var cap = this.rules.inline.del.exec(src);
      if (cap) {
        return {
          type: 'del',
          raw: cap[0],
          text: cap[2]
        };
      }
    };

    Tokenizer.prototype.autolink = function autolink(src, mangle) {
      var cap = this.rules.inline.autolink.exec(src);
      if (cap) {
        var text, href;
        if (cap[2] === '@') {
          text = escape$1(this.options.mangle ? mangle(cap[1]) : cap[1]);
          href = 'mailto:' + text;
        } else {
          text = escape$1(cap[1]);
          href = text;
        }

        return {
          type: 'link',
          raw: cap[0],
          text: text,
          href: href,
          tokens: [
            {
              type: 'text',
              raw: text,
              text: text
            }
          ]
        };
      }
    };

    Tokenizer.prototype.url = function url(src, mangle) {
      var cap;
      if (cap = this.rules.inline.url.exec(src)) {
        var text, href;
        if (cap[2] === '@') {
          text = escape$1(this.options.mangle ? mangle(cap[0]) : cap[0]);
          href = 'mailto:' + text;
        } else {
          // do extended autolink path validation
          var prevCapZero;
          do {
            prevCapZero = cap[0];
            cap[0] = this.rules.inline._backpedal.exec(cap[0])[0];
          } while (prevCapZero !== cap[0]);
          text = escape$1(cap[0]);
          if (cap[1] === 'www.') {
            href = 'http://' + text;
          } else {
            href = text;
          }
        }
        return {
          type: 'link',
          raw: cap[0],
          text: text,
          href: href,
          tokens: [
            {
              type: 'text',
              raw: text,
              text: text
            }
          ]
        };
      }
    };

    Tokenizer.prototype.inlineText = function inlineText(src, inRawBlock, smartypants) {
      var cap = this.rules.inline.text.exec(src);
      if (cap) {
        var text;
        if (inRawBlock) {
          text = this.options.sanitize ? (this.options.sanitizer ? this.options.sanitizer(cap[0]) : escape$1(cap[0])) : cap[0];
        } else {
          text = escape$1(this.options.smartypants ? smartypants(cap[0]) : cap[0]);
        }
        return {
          type: 'text',
          raw: cap[0],
          text: text
        };
      }
    };

    return Tokenizer;
  }());

  var noopTest$1 = helpers.noopTest;
  var edit$1 = helpers.edit;
  var merge$2 = helpers.merge;

  /**
   * Block-Level Grammar
   */
  var block = {
    newline: /^(?: *(?:\n|$))+/,
    code: /^( {4}[^\n]+(?:\n(?: *(?:\n|$))*)?)+/,
    fences: /^ {0,3}(`{3,}(?=[^`\n]*\n)|~{3,})([^\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
    hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
    heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
    blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
    list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?! {0,3}bull )\n*|\s*$)/,
    html: '^ {0,3}(?:' // optional indentation
      + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
      + '|comment[^\\n]*(\\n+|$)' // (2)
      + '|<\\?[\\s\\S]*?(?:\\?>\\n*|$)' // (3)
      + '|<![A-Z][\\s\\S]*?(?:>\\n*|$)' // (4)
      + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)' // (5)
      + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
      + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
      + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
      + ')',
    def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
    nptable: noopTest$1,
    table: noopTest$1,
    lheading: /^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,
    // regex template, placeholders will be replaced according to different paragraph
    // interruption rules of commonmark and the original markdown spec:
    _paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html| +\n)[^\n]+)*)/,
    text: /^[^\n]+/
  };

  block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
  block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
  block.def = edit$1(block.def)
    .replace('label', block._label)
    .replace('title', block._title)
    .getRegex();

  block.bullet = /(?:[*+-]|\d{1,9}[.)])/;
  block.item = /^( *)(bull) ?[^\n]*(?:\n(?! *bull ?)[^\n]*)*/;
  block.item = edit$1(block.item, 'gm')
    .replace(/bull/g, block.bullet)
    .getRegex();

  block.listItemStart = edit$1(/^( *)(bull)/)
    .replace('bull', block.bullet)
    .getRegex();

  block.list = edit$1(block.list)
    .replace(/bull/g, block.bullet)
    .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
    .replace('def', '\\n+(?=' + block.def.source + ')')
    .getRegex();

  block._tag = 'address|article|aside|base|basefont|blockquote|body|caption'
    + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
    + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
    + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
    + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
    + '|track|ul';
  block._comment = /<!--(?!-?>)[\s\S]*?(?:-->|$)/;
  block.html = edit$1(block.html, 'i')
    .replace('comment', block._comment)
    .replace('tag', block._tag)
    .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
    .getRegex();

  block.paragraph = edit$1(block._paragraph)
    .replace('hr', block.hr)
    .replace('heading', ' {0,3}#{1,6} ')
    .replace('|lheading', '') // setex headings don't interrupt commonmark paragraphs
    .replace('blockquote', ' {0,3}>')
    .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
    .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
    .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)')
    .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
    .getRegex();

  block.blockquote = edit$1(block.blockquote)
    .replace('paragraph', block.paragraph)
    .getRegex();

  /**
   * Normal Block Grammar
   */

  block.normal = merge$2({}, block);

  /**
   * GFM Block Grammar
   */

  block.gfm = merge$2({}, block.normal, {
    nptable: '^ *([^|\\n ].*\\|.*)\\n' // Header
      + ' {0,3}([-:]+ *\\|[-| :]*)' // Align
      + '(?:\\n((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)', // Cells
    table: '^ *\\|(.+)\\n' // Header
      + ' {0,3}\\|?( *[-:]+[-| :]*)' // Align
      + '(?:\\n *((?:(?!\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)' // Cells
  });

  block.gfm.nptable = edit$1(block.gfm.nptable)
    .replace('hr', block.hr)
    .replace('heading', ' {0,3}#{1,6} ')
    .replace('blockquote', ' {0,3}>')
    .replace('code', ' {4}[^\\n]')
    .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
    .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
    .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)')
    .replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
    .getRegex();

  block.gfm.table = edit$1(block.gfm.table)
    .replace('hr', block.hr)
    .replace('heading', ' {0,3}#{1,6} ')
    .replace('blockquote', ' {0,3}>')
    .replace('code', ' {4}[^\\n]')
    .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n')
    .replace('list', ' {0,3}(?:[*+-]|1[.)]) ') // only lists starting from 1 can interrupt
    .replace('html', '</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|!--)')
    .replace('tag', block._tag) // tables can be interrupted by type (6) html blocks
    .getRegex();

  /**
   * Pedantic grammar (original John Gruber's loose markdown specification)
   */

  block.pedantic = merge$2({}, block.normal, {
    html: edit$1(
      '^ *(?:comment *(?:\\n|\\s*$)'
      + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
      + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
      .replace('comment', block._comment)
      .replace(/tag/g, '(?!(?:'
        + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
        + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
        + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
      .getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: noopTest$1, // fences not supported
    paragraph: edit$1(block.normal._paragraph)
      .replace('hr', block.hr)
      .replace('heading', ' *#{1,6} *[^\n]')
      .replace('lheading', block.lheading)
      .replace('blockquote', ' {0,3}>')
      .replace('|fences', '')
      .replace('|list', '')
      .replace('|html', '')
      .getRegex()
  });

  /**
   * Inline-Level Grammar
   */
  var inline = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: noopTest$1,
    tag: '^comment'
      + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
      + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
      + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
      + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
      + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
    link: /^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
    nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
    reflinkSearch: 'reflink|nolink(?!\\()',
    strong: {
      start: /^(?:(\*\*(?=[*punctuation]))|\*\*)(?![\s])|__/, // (1) returns if starts w/ punctuation
      middle: /^\*\*(?:(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)|\*(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)*?\*)+?\*\*$|^__(?![\s])((?:(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)|_(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)*?_)+?)__$/,
      endAst: /[^punctuation\s]\*\*(?!\*)|[punctuation]\*\*(?!\*)(?:(?=[punctuation_\s]|$))/, // last char can't be punct, or final * must also be followed by punct (or endline)
      endUnd: /[^\s]__(?!_)(?:(?=[punctuation*\s])|$)/ // last char can't be a space, and final _ must preceed punct or \s (or endline)
    },
    em: {
      start: /^(?:(\*(?=[punctuation]))|\*)(?![*\s])|_/, // (1) returns if starts w/ punctuation
      middle: /^\*(?:(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)|\*(?:(?!overlapSkip)(?:[^*]|\\\*)|overlapSkip)*?\*)+?\*$|^_(?![_\s])(?:(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)|_(?:(?!overlapSkip)(?:[^_]|\\_)|overlapSkip)*?_)+?_$/,
      endAst: /[^punctuation\s]\*(?!\*)|[punctuation]\*(?!\*)(?:(?=[punctuation_\s]|$))/, // last char can't be punct, or final * must also be followed by punct (or endline)
      endUnd: /[^\s]_(?!_)(?:(?=[punctuation*\s])|$)/ // last char can't be a space, and final _ must preceed punct or \s (or endline)
    },
    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: noopTest$1,
    text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n)))/,
    punctuation: /^([\s*punctuation])/
  };

  // list of punctuation marks from common mark spec
  // without * and _ to workaround cases with double emphasis
  inline._punctuation = '!"#$%&\'()+\\-.,/:;<=>?@\\[\\]`^{|}~';
  inline.punctuation = edit$1(inline.punctuation).replace(/punctuation/g, inline._punctuation).getRegex();

  // sequences em should skip over [title](link), `code`, <html>
  inline._blockSkip = '\\[[^\\]]*?\\]\\([^\\)]*?\\)|`[^`]*?`|<[^>]*?>';
  inline._overlapSkip = '__[^_]*?__|\\*\\*\\[^\\*\\]*?\\*\\*';

  inline._comment = edit$1(block._comment).replace('(?:-->|$)', '-->').getRegex();

  inline.em.start = edit$1(inline.em.start)
    .replace(/punctuation/g, inline._punctuation)
    .getRegex();

  inline.em.middle = edit$1(inline.em.middle)
    .replace(/punctuation/g, inline._punctuation)
    .replace(/overlapSkip/g, inline._overlapSkip)
    .getRegex();

  inline.em.endAst = edit$1(inline.em.endAst, 'g')
    .replace(/punctuation/g, inline._punctuation)
    .getRegex();

  inline.em.endUnd = edit$1(inline.em.endUnd, 'g')
    .replace(/punctuation/g, inline._punctuation)
    .getRegex();

  inline.strong.start = edit$1(inline.strong.start)
    .replace(/punctuation/g, inline._punctuation)
    .getRegex();

  inline.strong.middle = edit$1(inline.strong.middle)
    .replace(/punctuation/g, inline._punctuation)
    .replace(/overlapSkip/g, inline._overlapSkip)
    .getRegex();

  inline.strong.endAst = edit$1(inline.strong.endAst, 'g')
    .replace(/punctuation/g, inline._punctuation)
    .getRegex();

  inline.strong.endUnd = edit$1(inline.strong.endUnd, 'g')
    .replace(/punctuation/g, inline._punctuation)
    .getRegex();

  inline.blockSkip = edit$1(inline._blockSkip, 'g')
    .getRegex();

  inline.overlapSkip = edit$1(inline._overlapSkip, 'g')
    .getRegex();

  inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;

  inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
  inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
  inline.autolink = edit$1(inline.autolink)
    .replace('scheme', inline._scheme)
    .replace('email', inline._email)
    .getRegex();

  inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

  inline.tag = edit$1(inline.tag)
    .replace('comment', inline._comment)
    .replace('attribute', inline._attribute)
    .getRegex();

  inline._label = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/;
  inline._href = /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/;
  inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

  inline.link = edit$1(inline.link)
    .replace('label', inline._label)
    .replace('href', inline._href)
    .replace('title', inline._title)
    .getRegex();

  inline.reflink = edit$1(inline.reflink)
    .replace('label', inline._label)
    .getRegex();

  inline.reflinkSearch = edit$1(inline.reflinkSearch, 'g')
    .replace('reflink', inline.reflink)
    .replace('nolink', inline.nolink)
    .getRegex();

  /**
   * Normal Inline Grammar
   */

  inline.normal = merge$2({}, inline);

  /**
   * Pedantic Inline Grammar
   */

  inline.pedantic = merge$2({}, inline.normal, {
    strong: {
      start: /^__|\*\*/,
      middle: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
      endAst: /\*\*(?!\*)/g,
      endUnd: /__(?!_)/g
    },
    em: {
      start: /^_|\*/,
      middle: /^()\*(?=\S)([\s\S]*?\S)\*(?!\*)|^_(?=\S)([\s\S]*?\S)_(?!_)/,
      endAst: /\*(?!\*)/g,
      endUnd: /_(?!_)/g
    },
    link: edit$1(/^!?\[(label)\]\((.*?)\)/)
      .replace('label', inline._label)
      .getRegex(),
    reflink: edit$1(/^!?\[(label)\]\s*\[([^\]]*)\]/)
      .replace('label', inline._label)
      .getRegex()
  });

  /**
   * GFM Inline Grammar
   */

  inline.gfm = merge$2({}, inline.normal, {
    escape: edit$1(inline.escape).replace('])', '~|])').getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/,
    text: /^([`~]+|[^`~])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
  });

  inline.gfm.url = edit$1(inline.gfm.url, 'i')
    .replace('email', inline.gfm._extended_email)
    .getRegex();
  /**
   * GFM + Line Breaks Inline Grammar
   */

  inline.breaks = merge$2({}, inline.gfm, {
    br: edit$1(inline.br).replace('{2,}', '*').getRegex(),
    text: edit$1(inline.gfm.text)
      .replace('\\b_', '\\b_| {2,}\\n')
      .replace(/\{2,\}/g, '*')
      .getRegex()
  });

  var rules = {
    block: block,
    inline: inline
  };

  var defaults$2 = defaults.defaults;

  var block$1 = rules.block;
  var inline$1 = rules.inline;

  var repeatString$1 = helpers.repeatString;

  /**
   * smartypants text replacement
   */
  function smartypants(text) {
    return text
      // em-dashes
      .replace(/---/g, '\u2014')
      // en-dashes
      .replace(/--/g, '\u2013')
      // opening singles
      .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
      // closing singles & apostrophes
      .replace(/'/g, '\u2019')
      // opening doubles
      .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
      // closing doubles
      .replace(/"/g, '\u201d')
      // ellipses
      .replace(/\.{3}/g, '\u2026');
  }

  /**
   * mangle email addresses
   */
  function mangle(text) {
    var out = '',
      i,
      ch;

    var l = text.length;
    for (i = 0; i < l; i++) {
      ch = text.charCodeAt(i);
      if (Math.random() > 0.5) {
        ch = 'x' + ch.toString(16);
      }
      out += '&#' + ch + ';';
    }

    return out;
  }

  /**
   * Block Lexer
   */
  var Lexer = /*@__PURE__*/(function () {
    function Lexer(options) {
      this.tokens = [];
      this.tokens.links = Object.create(null);
      this.options = options || defaults$2;
      this.options.tokenizer = this.options.tokenizer || new Tokenizer();
      this.tokenizer = this.options.tokenizer;
      this.tokenizer.options = this.options;

      var rules = {
        block: block$1.normal,
        inline: inline$1.normal
      };

      if (this.options.pedantic) {
        rules.block = block$1.pedantic;
        rules.inline = inline$1.pedantic;
      } else if (this.options.gfm) {
        rules.block = block$1.gfm;
        if (this.options.breaks) {
          rules.inline = inline$1.breaks;
        } else {
          rules.inline = inline$1.gfm;
        }
      }
      this.tokenizer.rules = rules;
    }

    var staticAccessors = { rules: { configurable: true } };

    /**
     * Expose Rules
     */
    staticAccessors.rules.get = function () {
      return {
        block: block$1,
        inline: inline$1
      };
    };

    /**
     * Static Lex Method
     */
    Lexer.lex = function lex(src, options) {
      var lexer = new Lexer(options);
      return lexer.lex(src);
    };

    /**
     * Static Lex Inline Method
     */
    Lexer.lexInline = function lexInline(src, options) {
      var lexer = new Lexer(options);
      return lexer.inlineTokens(src);
    };

    /**
     * Preprocessing
     */
    Lexer.prototype.lex = function lex(src) {
      src = src
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, '    ');

      this.blockTokens(src, this.tokens, true);

      this.inline(this.tokens);

      return this.tokens;
    };

    /**
     * Lexing
     */
    Lexer.prototype.blockTokens = function blockTokens(src, tokens, top) {
      if (tokens === void 0) tokens = [];
      if (top === void 0) top = true;

      if (this.options.pedantic) {
        src = src.replace(/^ +$/gm, '');
      }
      var token, i, l, lastToken;

      while (src) {
        // newline
        if (token = this.tokenizer.space(src)) {
          src = src.substring(token.raw.length);
          if (token.type) {
            tokens.push(token);
          }
          continue;
        }

        // code
        if (token = this.tokenizer.code(src, tokens)) {
          src = src.substring(token.raw.length);
          if (token.type) {
            tokens.push(token);
          } else {
            lastToken = tokens[tokens.length - 1];
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
          }
          continue;
        }

        // fences
        if (token = this.tokenizer.fences(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // heading
        if (token = this.tokenizer.heading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // table no leading pipe (gfm)
        if (token = this.tokenizer.nptable(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // hr
        if (token = this.tokenizer.hr(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // blockquote
        if (token = this.tokenizer.blockquote(src)) {
          src = src.substring(token.raw.length);
          token.tokens = this.blockTokens(token.text, [], top);
          tokens.push(token);
          continue;
        }

        // list
        if (token = this.tokenizer.list(src)) {
          src = src.substring(token.raw.length);
          l = token.items.length;
          for (i = 0; i < l; i++) {
            token.items[i].tokens = this.blockTokens(token.items[i].text, [], false);
          }
          tokens.push(token);
          continue;
        }

        // html
        if (token = this.tokenizer.html(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // def
        if (top && (token = this.tokenizer.def(src))) {
          src = src.substring(token.raw.length);
          if (!this.tokens.links[token.tag]) {
            this.tokens.links[token.tag] = {
              href: token.href,
              title: token.title
            };
          }
          continue;
        }

        // table (gfm)
        if (token = this.tokenizer.table(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // lheading
        if (token = this.tokenizer.lheading(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // top-level paragraph
        if (top && (token = this.tokenizer.paragraph(src))) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // text
        if (token = this.tokenizer.text(src, tokens)) {
          src = src.substring(token.raw.length);
          if (token.type) {
            tokens.push(token);
          } else {
            lastToken = tokens[tokens.length - 1];
            lastToken.raw += '\n' + token.raw;
            lastToken.text += '\n' + token.text;
          }
          continue;
        }

        if (src) {
          var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }

      return tokens;
    };

    Lexer.prototype.inline = function inline(tokens) {
      var i,
        j,
        k,
        l2,
        row,
        token;

      var l = tokens.length;
      for (i = 0; i < l; i++) {
        token = tokens[i];
        switch (token.type) {
          case 'paragraph':
          case 'text':
          case 'heading': {
            token.tokens = [];
            this.inlineTokens(token.text, token.tokens);
            break;
          }
          case 'table': {
            token.tokens = {
              header: [],
              cells: []
            };

            // header
            l2 = token.header.length;
            for (j = 0; j < l2; j++) {
              token.tokens.header[j] = [];
              this.inlineTokens(token.header[j], token.tokens.header[j]);
            }

            // cells
            l2 = token.cells.length;
            for (j = 0; j < l2; j++) {
              row = token.cells[j];
              token.tokens.cells[j] = [];
              for (k = 0; k < row.length; k++) {
                token.tokens.cells[j][k] = [];
                this.inlineTokens(row[k], token.tokens.cells[j][k]);
              }
            }

            break;
          }
          case 'blockquote': {
            this.inline(token.tokens);
            break;
          }
          case 'list': {
            l2 = token.items.length;
            for (j = 0; j < l2; j++) {
              this.inline(token.items[j].tokens);
            }
            break;
          }
        }
      }

      return tokens;
    };

    /**
     * Lexing/Compiling
     */
    Lexer.prototype.inlineTokens = function inlineTokens(src, tokens, inLink, inRawBlock) {
      if (tokens === void 0) tokens = [];
      if (inLink === void 0) inLink = false;
      if (inRawBlock === void 0) inRawBlock = false;

      var token;

      // String with links masked to avoid interference with em and strong
      var maskedSrc = src;
      var match;
      var keepPrevChar, prevChar;

      // Mask out reflinks
      if (this.tokens.links) {
        var links = Object.keys(this.tokens.links);
        if (links.length > 0) {
          while ((match = this.tokenizer.rules.inline.reflinkSearch.exec(maskedSrc)) != null) {
            if (links.includes(match[0].slice(match[0].lastIndexOf('[') + 1, -1))) {
              maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString$1('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex);
            }
          }
        }
      }
      // Mask out other blocks
      while ((match = this.tokenizer.rules.inline.blockSkip.exec(maskedSrc)) != null) {
        maskedSrc = maskedSrc.slice(0, match.index) + '[' + repeatString$1('a', match[0].length - 2) + ']' + maskedSrc.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
      }

      while (src) {
        if (!keepPrevChar) {
          prevChar = '';
        }
        keepPrevChar = false;
        // escape
        if (token = this.tokenizer.escape(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // tag
        if (token = this.tokenizer.tag(src, inLink, inRawBlock)) {
          src = src.substring(token.raw.length);
          inLink = token.inLink;
          inRawBlock = token.inRawBlock;
          tokens.push(token);
          continue;
        }

        // link
        if (token = this.tokenizer.link(src)) {
          src = src.substring(token.raw.length);
          if (token.type === 'link') {
            token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
          }
          tokens.push(token);
          continue;
        }

        // reflink, nolink
        if (token = this.tokenizer.reflink(src, this.tokens.links)) {
          src = src.substring(token.raw.length);
          if (token.type === 'link') {
            token.tokens = this.inlineTokens(token.text, [], true, inRawBlock);
          }
          tokens.push(token);
          continue;
        }

        // strong
        if (token = this.tokenizer.strong(src, maskedSrc, prevChar)) {
          src = src.substring(token.raw.length);
          token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
          tokens.push(token);
          continue;
        }

        // em
        if (token = this.tokenizer.em(src, maskedSrc, prevChar)) {
          src = src.substring(token.raw.length);
          token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
          tokens.push(token);
          continue;
        }

        // code
        if (token = this.tokenizer.codespan(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // br
        if (token = this.tokenizer.br(src)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // del (gfm)
        if (token = this.tokenizer.del(src)) {
          src = src.substring(token.raw.length);
          token.tokens = this.inlineTokens(token.text, [], inLink, inRawBlock);
          tokens.push(token);
          continue;
        }

        // autolink
        if (token = this.tokenizer.autolink(src, mangle)) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // url (gfm)
        if (!inLink && (token = this.tokenizer.url(src, mangle))) {
          src = src.substring(token.raw.length);
          tokens.push(token);
          continue;
        }

        // text
        if (token = this.tokenizer.inlineText(src, inRawBlock, smartypants)) {
          src = src.substring(token.raw.length);
          prevChar = token.raw.slice(-1);
          keepPrevChar = true;
          tokens.push(token);
          continue;
        }

        if (src) {
          var errMsg = 'Infinite loop on byte: ' + src.charCodeAt(0);
          if (this.options.silent) {
            console.error(errMsg);
            break;
          } else {
            throw new Error(errMsg);
          }
        }
      }

      return tokens;
    };

    Object.defineProperties(Lexer, staticAccessors);

    return Lexer;
  }());

  var defaults$3 = defaults.defaults;

  var cleanUrl$1 = helpers.cleanUrl;
  var escape$2 = helpers.escape;

  /**
   * Renderer
   */
  var Renderer = /*@__PURE__*/(function () {
    function Renderer(options) {
      this.options = options || defaults$3;
    }

    Renderer.prototype.code = function code(code$1, infostring, escaped) {
      var lang = (infostring || '').match(/\S*/)[0];
      if (this.options.highlight) {
        var out = this.options.highlight(code$1, lang);
        if (out != null && out !== code$1) {
          escaped = true;
          code$1 = out;
        }
      }

      code$1 = code$1.replace(/\n$/, '') + '\n';

      if (!lang) {
        return '<pre><code>'
          + (escaped ? code$1 : escape$2(code$1, true))
          + '</code></pre>\n';
      }

      return '<pre><code class="'
        + this.options.langPrefix
        + escape$2(lang, true)
        + '">'
        + (escaped ? code$1 : escape$2(code$1, true))
        + '</code></pre>\n';
    };

    Renderer.prototype.blockquote = function blockquote(quote) {
      return '<blockquote>\n' + quote + '</blockquote>\n';
    };

    Renderer.prototype.html = function html(html$1) {
      return html$1;
    };

    Renderer.prototype.heading = function heading(text, level, raw, slugger) {
      if (this.options.headerIds) {
        return '<h'
          + level
          + ' id="'
          + this.options.headerPrefix
          + slugger.slug(raw)
          + '">'
          + text
          + '</h'
          + level
          + '>\n';
      }
      // ignore IDs
      return '<h' + level + '>' + text + '</h' + level + '>\n';
    };

    Renderer.prototype.hr = function hr() {
      return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
    };

    Renderer.prototype.list = function list(body, ordered, start) {
      var type = ordered ? 'ol' : 'ul',
        startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
      return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
    };

    Renderer.prototype.listitem = function listitem(text) {
      return '<li>' + text + '</li>\n';
    };

    Renderer.prototype.checkbox = function checkbox(checked) {
      return '<input '
        + (checked ? 'checked="" ' : '')
        + 'disabled="" type="checkbox"'
        + (this.options.xhtml ? ' /' : '')
        + '> ';
    };

    Renderer.prototype.paragraph = function paragraph(text) {
      return '<p>' + text + '</p>\n';
    };

    Renderer.prototype.table = function table(header, body) {
      if (body) { body = '<tbody>' + body + '</tbody>'; }

      return '<table>\n'
        + '<thead>\n'
        + header
        + '</thead>\n'
        + body
        + '</table>\n';
    };

    Renderer.prototype.tablerow = function tablerow(content) {
      return '<tr>\n' + content + '</tr>\n';
    };

    Renderer.prototype.tablecell = function tablecell(content, flags) {
      var type = flags.header ? 'th' : 'td';
      var tag = flags.align
        ? '<' + type + ' align="' + flags.align + '">'
        : '<' + type + '>';
      return tag + content + '</' + type + '>\n';
    };

    // span level renderer
    Renderer.prototype.strong = function strong(text) {
      return '<strong>' + text + '</strong>';
    };

    Renderer.prototype.em = function em(text) {
      return '<em>' + text + '</em>';
    };

    Renderer.prototype.codespan = function codespan(text) {
      return '<code>' + text + '</code>';
    };

    Renderer.prototype.br = function br() {
      return this.options.xhtml ? '<br/>' : '<br>';
    };

    Renderer.prototype.del = function del(text) {
      return '<del>' + text + '</del>';
    };

    Renderer.prototype.link = function link(href, title, text) {
      href = cleanUrl$1(this.options.sanitize, this.options.baseUrl, href);
      if (href === null) {
        return text;
      }
      var out = '<a href="' + escape$2(href) + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += '>' + text + '</a>';
      return out;
    };

    Renderer.prototype.image = function image(href, title, text) {
      href = cleanUrl$1(this.options.sanitize, this.options.baseUrl, href);
      if (href === null) {
        return text;
      }

      var out = '<img src="' + href + '" alt="' + text + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += this.options.xhtml ? '/>' : '>';
      return out;
    };

    Renderer.prototype.text = function text(text$1) {
      return text$1;
    };

    return Renderer;
  }());

  /**
   * TextRenderer
   * returns only the textual part of the token
   */
  var TextRenderer = /*@__PURE__*/(function () {
    function TextRenderer() { }

    TextRenderer.prototype.strong = function strong(text) {
      return text;
    };

    TextRenderer.prototype.em = function em(text) {
      return text;
    };

    TextRenderer.prototype.codespan = function codespan(text) {
      return text;
    };

    TextRenderer.prototype.del = function del(text) {
      return text;
    };

    TextRenderer.prototype.html = function html(text) {
      return text;
    };

    TextRenderer.prototype.text = function text(text$1) {
      return text$1;
    };

    TextRenderer.prototype.link = function link(href, title, text) {
      return '' + text;
    };

    TextRenderer.prototype.image = function image(href, title, text) {
      return '' + text;
    };

    TextRenderer.prototype.br = function br() {
      return '';
    };

    return TextRenderer;
  }());

  /**
   * Slugger generates header id
   */
  var Slugger = /*@__PURE__*/(function () {
    function Slugger() {
      this.seen = {};
    }

    Slugger.prototype.serialize = function serialize(value) {
      return value
        .toLowerCase()
        .trim()
        // remove html tags
        .replace(/<[!\/a-z].*?>/ig, '')
        // remove unwanted chars
        .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
        .replace(/\s/g, '-');
    };

    /**
     * Finds the next safe (unique) slug to use
     */
    Slugger.prototype.getNextSafeSlug = function getNextSafeSlug(originalSlug, isDryRun) {
      var slug = originalSlug;
      var occurenceAccumulator = 0;
      if (this.seen.hasOwnProperty(slug)) {
        occurenceAccumulator = this.seen[originalSlug];
        do {
          occurenceAccumulator++;
          slug = originalSlug + '-' + occurenceAccumulator;
        } while (this.seen.hasOwnProperty(slug));
      }
      if (!isDryRun) {
        this.seen[originalSlug] = occurenceAccumulator;
        this.seen[slug] = 0;
      }
      return slug;
    };

    /**
     * Convert string to unique id
     * @param {object} options
     * @param {boolean} options.dryrun Generates the next unique slug without updating the internal accumulator.
     */
    Slugger.prototype.slug = function slug(value, options) {
      if (options === void 0) options = {};

      var slug = this.serialize(value);
      return this.getNextSafeSlug(slug, options.dryrun);
    };

    return Slugger;
  }());

  var defaults$4 = defaults.defaults;

  var unescape$1 = helpers.unescape;

  /**
   * Parsing & Compiling
   */
  var Parser = /*@__PURE__*/(function () {
    function Parser(options) {
      this.options = options || defaults$4;
      this.options.renderer = this.options.renderer || new Renderer();
      this.renderer = this.options.renderer;
      this.renderer.options = this.options;
      this.textRenderer = new TextRenderer();
      this.slugger = new Slugger();
    }

    /**
     * Static Parse Method
     */
    Parser.parse = function parse(tokens, options) {
      var parser = new Parser(options);
      return parser.parse(tokens);
    };

    /**
     * Static Parse Inline Method
     */
    Parser.parseInline = function parseInline(tokens, options) {
      var parser = new Parser(options);
      return parser.parseInline(tokens);
    };

    /**
     * Parse Loop
     */
    Parser.prototype.parse = function parse(tokens, top) {
      if (top === void 0) top = true;

      var out = '',
        i,
        j,
        k,
        l2,
        l3,
        row,
        cell,
        header,
        body,
        token,
        ordered,
        start,
        loose,
        itemBody,
        item,
        checked,
        task,
        checkbox;

      var l = tokens.length;
      for (i = 0; i < l; i++) {
        token = tokens[i];
        switch (token.type) {
          case 'space': {
            continue;
          }
          case 'hr': {
            out += this.renderer.hr();
            continue;
          }
          case 'heading': {
            out += this.renderer.heading(
              this.parseInline(token.tokens),
              token.depth,
              unescape$1(this.parseInline(token.tokens, this.textRenderer)),
              this.slugger);
            continue;
          }
          case 'code': {
            out += this.renderer.code(token.text,
              token.lang,
              token.escaped);
            continue;
          }
          case 'table': {
            header = '';

            // header
            cell = '';
            l2 = token.header.length;
            for (j = 0; j < l2; j++) {
              cell += this.renderer.tablecell(
                this.parseInline(token.tokens.header[j]),
                { header: true, align: token.align[j] }
              );
            }
            header += this.renderer.tablerow(cell);

            body = '';
            l2 = token.cells.length;
            for (j = 0; j < l2; j++) {
              row = token.tokens.cells[j];

              cell = '';
              l3 = row.length;
              for (k = 0; k < l3; k++) {
                cell += this.renderer.tablecell(
                  this.parseInline(row[k]),
                  { header: false, align: token.align[k] }
                );
              }

              body += this.renderer.tablerow(cell);
            }
            out += this.renderer.table(header, body);
            continue;
          }
          case 'blockquote': {
            body = this.parse(token.tokens);
            out += this.renderer.blockquote(body);
            continue;
          }
          case 'list': {
            ordered = token.ordered;
            start = token.start;
            loose = token.loose;
            l2 = token.items.length;

            body = '';
            for (j = 0; j < l2; j++) {
              item = token.items[j];
              checked = item.checked;
              task = item.task;

              itemBody = '';
              if (item.task) {
                checkbox = this.renderer.checkbox(checked);
                if (loose) {
                  if (item.tokens.length > 0 && item.tokens[0].type === 'text') {
                    item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
                    if (item.tokens[0].tokens && item.tokens[0].tokens.length > 0 && item.tokens[0].tokens[0].type === 'text') {
                      item.tokens[0].tokens[0].text = checkbox + ' ' + item.tokens[0].tokens[0].text;
                    }
                  } else {
                    item.tokens.unshift({
                      type: 'text',
                      text: checkbox
                    });
                  }
                } else {
                  itemBody += checkbox;
                }
              }

              itemBody += this.parse(item.tokens, loose);
              body += this.renderer.listitem(itemBody, task, checked);
            }

            out += this.renderer.list(body, ordered, start);
            continue;
          }
          case 'html': {
            // TODO parse inline content if parameter markdown=1
            out += this.renderer.html(token.text);
            continue;
          }
          case 'paragraph': {
            out += this.renderer.paragraph(this.parseInline(token.tokens));
            continue;
          }
          case 'text': {
            body = token.tokens ? this.parseInline(token.tokens) : token.text;
            while (i + 1 < l && tokens[i + 1].type === 'text') {
              token = tokens[++i];
              body += '\n' + (token.tokens ? this.parseInline(token.tokens) : token.text);
            }
            out += top ? this.renderer.paragraph(body) : body;
            continue;
          }
          default: {
            var errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return;
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }

      return out;
    };

    /**
     * Parse Inline Tokens
     */
    Parser.prototype.parseInline = function parseInline(tokens, renderer) {
      renderer = renderer || this.renderer;
      var out = '',
        i,
        token;

      var l = tokens.length;
      for (i = 0; i < l; i++) {
        token = tokens[i];
        switch (token.type) {
          case 'escape': {
            out += renderer.text(token.text);
            break;
          }
          case 'html': {
            out += renderer.html(token.text);
            break;
          }
          case 'link': {
            out += renderer.link(token.href, token.title, this.parseInline(token.tokens, renderer));
            break;
          }
          case 'image': {
            out += renderer.image(token.href, token.title, token.text);
            break;
          }
          case 'strong': {
            out += renderer.strong(this.parseInline(token.tokens, renderer));
            break;
          }
          case 'em': {
            out += renderer.em(this.parseInline(token.tokens, renderer));
            break;
          }
          case 'codespan': {
            out += renderer.codespan(token.text);
            break;
          }
          case 'br': {
            out += renderer.br();
            break;
          }
          case 'del': {
            out += renderer.del(this.parseInline(token.tokens, renderer));
            break;
          }
          case 'text': {
            out += renderer.text(token.text);
            break;
          }
          default: {
            var errMsg = 'Token with "' + token.type + '" type was not found.';
            if (this.options.silent) {
              console.error(errMsg);
              return;
            } else {
              throw new Error(errMsg);
            }
          }
        }
      }
      return out;
    };

    return Parser;
  }());

  var merge$3 = helpers.merge;
  var checkSanitizeDeprecation$1 = helpers.checkSanitizeDeprecation;
  var escape$3 = helpers.escape;

  var getDefaults = defaults.getDefaults;
  var changeDefaults = defaults.changeDefaults;
  var defaults$5 = defaults.defaults;

  /**
   * Marked
   */
  function marked(src, opt, callback) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
      throw new Error('marked(): input parameter is undefined or null');
    }
    if (typeof src !== 'string') {
      throw new Error('marked(): input parameter is of type '
        + Object.prototype.toString.call(src) + ', string expected');
    }

    if (typeof opt === 'function') {
      callback = opt;
      opt = null;
    }

    opt = merge$3({}, marked.defaults, opt || {});
    checkSanitizeDeprecation$1(opt);

    if (callback) {
      var highlight = opt.highlight;
      var tokens;

      try {
        tokens = Lexer.lex(src, opt);
      } catch (e) {
        return callback(e);
      }

      var done = function (err) {
        var out;

        if (!err) {
          try {
            out = Parser.parse(tokens, opt);
          } catch (e) {
            err = e;
          }
        }

        opt.highlight = highlight;

        return err
          ? callback(err)
          : callback(null, out);
      };

      if (!highlight || highlight.length < 3) {
        return done();
      }

      delete opt.highlight;

      if (!tokens.length) { return done(); }

      var pending = 0;
      marked.walkTokens(tokens, function (token) {
        if (token.type === 'code') {
          pending++;
          setTimeout(function () {
            highlight(token.text, token.lang, function (err, code) {
              if (err) {
                return done(err);
              }
              if (code != null && code !== token.text) {
                token.text = code;
                token.escaped = true;
              }

              pending--;
              if (pending === 0) {
                done();
              }
            });
          }, 0);
        }
      });

      if (pending === 0) {
        done();
      }

      return;
    }

    try {
      var tokens$1 = Lexer.lex(src, opt);
      if (opt.walkTokens) {
        marked.walkTokens(tokens$1, opt.walkTokens);
      }
      return Parser.parse(tokens$1, opt);
    } catch (e) {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';
      if (opt.silent) {
        return '<p>An error occurred:</p><pre>'
          + escape$3(e.message + '', true)
          + '</pre>';
      }
      throw e;
    }
  }

  /**
   * Options
   */

  marked.options =
    marked.setOptions = function (opt) {
      merge$3(marked.defaults, opt);
      changeDefaults(marked.defaults);
      return marked;
    };

  marked.getDefaults = getDefaults;

  marked.defaults = defaults$5;

  /**
   * Use Extension
   */

  marked.use = function (extension) {
    var opts = merge$3({}, extension);
    if (extension.renderer) {
      var renderer = marked.defaults.renderer || new Renderer();
      var loop = function (prop) {
        var prevRenderer = renderer[prop];
        renderer[prop] = function () {
          var args = [], len = arguments.length;
          while (len--) args[len] = arguments[len];

          var ret = extension.renderer[prop].apply(renderer, args);
          if (ret === false) {
            ret = prevRenderer.apply(renderer, args);
          }
          return ret;
        };
      };

      for (var prop in extension.renderer) loop(prop);
      opts.renderer = renderer;
    }
    if (extension.tokenizer) {
      var tokenizer = marked.defaults.tokenizer || new Tokenizer();
      var loop$1 = function (prop) {
        var prevTokenizer = tokenizer[prop$1];
        tokenizer[prop$1] = function () {
          var args = [], len = arguments.length;
          while (len--) args[len] = arguments[len];

          var ret = extension.tokenizer[prop$1].apply(tokenizer, args);
          if (ret === false) {
            ret = prevTokenizer.apply(tokenizer, args);
          }
          return ret;
        };
      };

      for (var prop$1 in extension.tokenizer) loop$1(prop);
      opts.tokenizer = tokenizer;
    }
    if (extension.walkTokens) {
      var walkTokens = marked.defaults.walkTokens;
      opts.walkTokens = function (token) {
        extension.walkTokens(token);
        if (walkTokens) {
          walkTokens(token);
        }
      };
    }
    marked.setOptions(opts);
  };

  /**
   * Run callback for every token
   */

  marked.walkTokens = function (tokens, callback) {
    for (var i$3 = 0, list$3 = tokens; i$3 < list$3.length; i$3 += 1) {
      var token = list$3[i$3];

      callback(token);
      switch (token.type) {
        case 'table': {
          for (var i = 0, list = token.tokens.header; i < list.length; i += 1) {
            var cell = list[i];

            marked.walkTokens(cell, callback);
          }
          for (var i$2 = 0, list$2 = token.tokens.cells; i$2 < list$2.length; i$2 += 1) {
            var row = list$2[i$2];

            for (var i$1 = 0, list$1 = row; i$1 < list$1.length; i$1 += 1) {
              var cell$1 = list$1[i$1];

              marked.walkTokens(cell$1, callback);
            }
          }
          break;
        }
        case 'list': {
          marked.walkTokens(token.items, callback);
          break;
        }
        default: {
          if (token.tokens) {
            marked.walkTokens(token.tokens, callback);
          }
        }
      }
    }
  };

  /**
   * Parse Inline
   */
  marked.parseInline = function (src, opt) {
    // throw error in case of non string input
    if (typeof src === 'undefined' || src === null) {
      throw new Error('marked.parseInline(): input parameter is undefined or null');
    }
    if (typeof src !== 'string') {
      throw new Error('marked.parseInline(): input parameter is of type '
        + Object.prototype.toString.call(src) + ', string expected');
    }

    opt = merge$3({}, marked.defaults, opt || {});
    checkSanitizeDeprecation$1(opt);

    try {
      var tokens = Lexer.lexInline(src, opt);
      if (opt.walkTokens) {
        marked.walkTokens(tokens, opt.walkTokens);
      }
      return Parser.parseInline(tokens, opt);
    } catch (e) {
      e.message += '\nPlease report this to https://github.com/markedjs/marked.';
      if (opt.silent) {
        return '<p>An error occurred:</p><pre>'
          + escape$3(e.message + '', true)
          + '</pre>';
      }
      throw e;
    }
  };

  /**
   * Expose
   */

  marked.Parser = Parser;
  marked.parser = Parser.parse;

  marked.Renderer = Renderer;
  marked.TextRenderer = TextRenderer;

  marked.Lexer = Lexer;
  marked.lexer = Lexer.lex;

  marked.Tokenizer = Tokenizer;

  marked.Slugger = Slugger;

  marked.parse = marked;

  var marked_1 = marked;

  /**
   * Render github corner
   * @param  {Object} data URL for the View Source on Github link
   * @param {String} cornerExternalLinkTarget value of the target attribute of the link
   * @return {String} SVG element as string
   */
  function corner(data, cornerExternalLinkTarget) {
    if (!data) {
      return '';
    }

    if (!/\/\//.test(data)) {
      data = 'https://github.com/' + data;
    }

    data = data.replace(/^git\+/, '');
    // Double check
    cornerExternalLinkTarget = cornerExternalLinkTarget || '_blank';

    return (
      "<a href=\"" + data + "\" target=\"" + cornerExternalLinkTarget + "\" class=\"github-corner\" aria-label=\"View source on Github\">" +
      '<svg viewBox="0 0 250 250" aria-hidden="true">' +
      '<path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>' +
      '<path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path>' +
      '<path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path>' +
      '</svg>' +
      '</a>'
    );
  }

  /**
   * Renders main content
   * @param {Object} config Configuration object
   * @returns {String} HTML of the main content
   */
  function main(config) {
    var name = config.name ? config.name : '';

    var aside =
      '<button class="sidebar-toggle" aria-label="Menu">' +
      '<div class="sidebar-toggle-button">' +
      '<span></span><span></span><span></span>' +
      '</div>' +
      '</button>' +
      '<aside class="sidebar">' +
      (config.name
        ? ("<h1 class=\"app-name\"><a class=\"app-name-link\" data-nosearch>" + (config.logo ? ("<img alt=\"" + name + "\" src=" + (config.logo) + ">") : name) + "</a></h1>")
        : '') +
      '<div class="sidebar-nav"><!--sidebar--></div>' +
      '</aside>';
    return (
      "<main>" + aside +
      '<section class="content">' +
      '<article class="markdown-section" id="main"><!--main--></article>' +
      '</section>' +
      '</main>'
    );
  }

  /**
   * Cover Page
   * @returns {String} Cover page
   */
  function cover() {
    var SL = ', 100%, 85%';
    var bgc =
      'linear-gradient(to left bottom, ' +
      "hsl(" + (Math.floor(Math.random() * 255) + SL) + ") 0%," +
      "hsl(" + (Math.floor(Math.random() * 255) + SL) + ") 100%)";

    return (
      "<section class=\"cover show\" style=\"background: " + bgc + "\">" +
      '<div class="mask"></div>' +
      '<div class="cover-main"><!--cover--></div>' +
      '</section>'
    );
  }

  /**
   * Render tree
   * @param  {Array} toc Array of TOC section links
   * @param  {String} tpl TPL list
   * @return {String} Rendered tree
   */
  function tree(toc, tpl) {
    if (tpl === void 0) tpl = '<ul class="app-sub-sidebar">{inner}</ul>';

    if (!toc || !toc.length) {
      return '';
    }

    var innerHTML = '';
    toc.forEach(function (node) {
      var title = node.title.replace(/(<([^>]+)>)/g, '');
      innerHTML += "<li><a class=\"section-link\" href=\"" + (node.slug) + "\" title=\"" + title + "\">" + (node.title) + "</a></li>";
      if (node.children) {
        innerHTML += tree(node.children, tpl);
      }
    });
    return tpl.replace('{inner}', innerHTML);
  }

  function helper(className, content) {
    return ("<p class=\"" + className + "\">" + (content.slice(5).trim()) + "</p>");
  }

  function theme(color) {
    return ("<style>:root{--theme-color: " + color + ";}</style>");
  }

  /**
   * Gen toc tree
   * @link https://github.com/killercup/grock/blob/5280ae63e16c5739e9233d9009bc235ed7d79a50/styles/solarized/assets/js/behavior.coffee#L54-L81
   * @param  {Array} toc List of TOC elements
   * @param  {Number} maxLevel Deep level
   * @return {Array} Headlines
   */
  function genTree(toc, maxLevel) {
    var headlines = [];
    var last = {};

    toc.forEach(function (headline) {
      var level = headline.level || 1;
      var len = level - 1;

      if (level > maxLevel) {
        return;
      }

      if (last[len]) {
        last[len].children = (last[len].children || []).concat(headline);
      } else {
        headlines.push(headline);
      }

      last[level] = headline;
    });

    return headlines;
  }

  var cache$1 = {};
  var re = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g;

  function lower(string) {
    return string.toLowerCase();
  }

  function slugify(str) {
    if (typeof str !== 'string') {
      return '';
    }

    var slug = str
      .trim()
      .replace(/[A-Z]+/g, lower)
      .replace(/<[^>]+>/g, '')
      .replace(re, '')
      .replace(/\s/g, '-')
      .replace(/-+/g, '-')
      .replace(/^(\d)/, '_$1');
    var count = cache$1[slug];

    count = hasOwn.call(cache$1, slug) ? count + 1 : 0;
    cache$1[slug] = count;

    if (count) {
      slug = slug + '-' + count;
    }

    return slug;
  }

  slugify.clear = function () {
    cache$1 = {};
  };

  /* eslint-disable */

  // =============================================================================
  // DO NOT EDIT: This file is auto-generated by an /build/emoji.js
  // =============================================================================

  var emojiData = {
    "baseURL": "https://github.githubassets.com/images/icons/emoji/",
    "data": {
      "100": "unicode/1f4af.png?v8",
      "1234": "unicode/1f522.png?v8",
      "+1": "unicode/1f44d.png?v8",
      "-1": "unicode/1f44e.png?v8",
      "1st_place_medal": "unicode/1f947.png?v8",
      "2nd_place_medal": "unicode/1f948.png?v8",
      "3rd_place_medal": "unicode/1f949.png?v8",
      "8ball": "unicode/1f3b1.png?v8",
      "a": "unicode/1f170.png?v8",
      "ab": "unicode/1f18e.png?v8",
      "abacus": "unicode/1f9ee.png?v8",
      "abc": "unicode/1f524.png?v8",
      "abcd": "unicode/1f521.png?v8",
      "accept": "unicode/1f251.png?v8",
      "accessibility": "accessibility.png?v8",
      "accordion": "unicode/1fa97.png?v8",
      "adhesive_bandage": "unicode/1fa79.png?v8",
      "adult": "unicode/1f9d1.png?v8",
      "aerial_tramway": "unicode/1f6a1.png?v8",
      "afghanistan": "unicode/1f1e6-1f1eb.png?v8",
      "airplane": "unicode/2708.png?v8",
      "aland_islands": "unicode/1f1e6-1f1fd.png?v8",
      "alarm_clock": "unicode/23f0.png?v8",
      "albania": "unicode/1f1e6-1f1f1.png?v8",
      "alembic": "unicode/2697.png?v8",
      "algeria": "unicode/1f1e9-1f1ff.png?v8",
      "alien": "unicode/1f47d.png?v8",
      "ambulance": "unicode/1f691.png?v8",
      "american_samoa": "unicode/1f1e6-1f1f8.png?v8",
      "amphora": "unicode/1f3fa.png?v8",
      "anatomical_heart": "unicode/1fac0.png?v8",
      "anchor": "unicode/2693.png?v8",
      "andorra": "unicode/1f1e6-1f1e9.png?v8",
      "angel": "unicode/1f47c.png?v8",
      "anger": "unicode/1f4a2.png?v8",
      "angola": "unicode/1f1e6-1f1f4.png?v8",
      "angry": "unicode/1f620.png?v8",
      "anguilla": "unicode/1f1e6-1f1ee.png?v8",
      "anguished": "unicode/1f627.png?v8",
      "ant": "unicode/1f41c.png?v8",
      "antarctica": "unicode/1f1e6-1f1f6.png?v8",
      "antigua_barbuda": "unicode/1f1e6-1f1ec.png?v8",
      "apple": "unicode/1f34e.png?v8",
      "aquarius": "unicode/2652.png?v8",
      "argentina": "unicode/1f1e6-1f1f7.png?v8",
      "aries": "unicode/2648.png?v8",
      "armenia": "unicode/1f1e6-1f1f2.png?v8",
      "arrow_backward": "unicode/25c0.png?v8",
      "arrow_double_down": "unicode/23ec.png?v8",
      "arrow_double_up": "unicode/23eb.png?v8",
      "arrow_down": "unicode/2b07.png?v8",
      "arrow_down_small": "unicode/1f53d.png?v8",
      "arrow_forward": "unicode/25b6.png?v8",
      "arrow_heading_down": "unicode/2935.png?v8",
      "arrow_heading_up": "unicode/2934.png?v8",
      "arrow_left": "unicode/2b05.png?v8",
      "arrow_lower_left": "unicode/2199.png?v8",
      "arrow_lower_right": "unicode/2198.png?v8",
      "arrow_right": "unicode/27a1.png?v8",
      "arrow_right_hook": "unicode/21aa.png?v8",
      "arrow_up": "unicode/2b06.png?v8",
      "arrow_up_down": "unicode/2195.png?v8",
      "arrow_up_small": "unicode/1f53c.png?v8",
      "arrow_upper_left": "unicode/2196.png?v8",
      "arrow_upper_right": "unicode/2197.png?v8",
      "arrows_clockwise": "unicode/1f503.png?v8",
      "arrows_counterclockwise": "unicode/1f504.png?v8",
      "art": "unicode/1f3a8.png?v8",
      "articulated_lorry": "unicode/1f69b.png?v8",
      "artificial_satellite": "unicode/1f6f0.png?v8",
      "artist": "unicode/1f9d1-1f3a8.png?v8",
      "aruba": "unicode/1f1e6-1f1fc.png?v8",
      "ascension_island": "unicode/1f1e6-1f1e8.png?v8",
      "asterisk": "unicode/002a-20e3.png?v8",
      "astonished": "unicode/1f632.png?v8",
      "astronaut": "unicode/1f9d1-1f680.png?v8",
      "athletic_shoe": "unicode/1f45f.png?v8",
      "atm": "unicode/1f3e7.png?v8",
      "atom": "atom.png?v8",
      "atom_symbol": "unicode/269b.png?v8",
      "australia": "unicode/1f1e6-1f1fa.png?v8",
      "austria": "unicode/1f1e6-1f1f9.png?v8",
      "auto_rickshaw": "unicode/1f6fa.png?v8",
      "avocado": "unicode/1f951.png?v8",
      "axe": "unicode/1fa93.png?v8",
      "azerbaijan": "unicode/1f1e6-1f1ff.png?v8",
      "b": "unicode/1f171.png?v8",
      "baby": "unicode/1f476.png?v8",
      "baby_bottle": "unicode/1f37c.png?v8",
      "baby_chick": "unicode/1f424.png?v8",
      "baby_symbol": "unicode/1f6bc.png?v8",
      "back": "unicode/1f519.png?v8",
      "bacon": "unicode/1f953.png?v8",
      "badger": "unicode/1f9a1.png?v8",
      "badminton": "unicode/1f3f8.png?v8",
      "bagel": "unicode/1f96f.png?v8",
      "baggage_claim": "unicode/1f6c4.png?v8",
      "baguette_bread": "unicode/1f956.png?v8",
      "bahamas": "unicode/1f1e7-1f1f8.png?v8",
      "bahrain": "unicode/1f1e7-1f1ed.png?v8",
      "balance_scale": "unicode/2696.png?v8",
      "bald_man": "unicode/1f468-1f9b2.png?v8",
      "bald_woman": "unicode/1f469-1f9b2.png?v8",
      "ballet_shoes": "unicode/1fa70.png?v8",
      "balloon": "unicode/1f388.png?v8",
      "ballot_box": "unicode/1f5f3.png?v8",
      "ballot_box_with_check": "unicode/2611.png?v8",
      "bamboo": "unicode/1f38d.png?v8",
      "banana": "unicode/1f34c.png?v8",
      "bangbang": "unicode/203c.png?v8",
      "bangladesh": "unicode/1f1e7-1f1e9.png?v8",
      "banjo": "unicode/1fa95.png?v8",
      "bank": "unicode/1f3e6.png?v8",
      "bar_chart": "unicode/1f4ca.png?v8",
      "barbados": "unicode/1f1e7-1f1e7.png?v8",
      "barber": "unicode/1f488.png?v8",
      "baseball": "unicode/26be.png?v8",
      "basecamp": "basecamp.png?v8",
      "basecampy": "basecampy.png?v8",
      "basket": "unicode/1f9fa.png?v8",
      "basketball": "unicode/1f3c0.png?v8",
      "basketball_man": "unicode/26f9-2642.png?v8",
      "basketball_woman": "unicode/26f9-2640.png?v8",
      "bat": "unicode/1f987.png?v8",
      "bath": "unicode/1f6c0.png?v8",
      "bathtub": "unicode/1f6c1.png?v8",
      "battery": "unicode/1f50b.png?v8",
      "beach_umbrella": "unicode/1f3d6.png?v8",
      "bear": "unicode/1f43b.png?v8",
      "bearded_person": "unicode/1f9d4.png?v8",
      "beaver": "unicode/1f9ab.png?v8",
      "bed": "unicode/1f6cf.png?v8",
      "bee": "unicode/1f41d.png?v8",
      "beer": "unicode/1f37a.png?v8",
      "beers": "unicode/1f37b.png?v8",
      "beetle": "unicode/1fab2.png?v8",
      "beginner": "unicode/1f530.png?v8",
      "belarus": "unicode/1f1e7-1f1fe.png?v8",
      "belgium": "unicode/1f1e7-1f1ea.png?v8",
      "belize": "unicode/1f1e7-1f1ff.png?v8",
      "bell": "unicode/1f514.png?v8",
      "bell_pepper": "unicode/1fad1.png?v8",
      "bellhop_bell": "unicode/1f6ce.png?v8",
      "benin": "unicode/1f1e7-1f1ef.png?v8",
      "bento": "unicode/1f371.png?v8",
      "bermuda": "unicode/1f1e7-1f1f2.png?v8",
      "beverage_box": "unicode/1f9c3.png?v8",
      "bhutan": "unicode/1f1e7-1f1f9.png?v8",
      "bicyclist": "unicode/1f6b4.png?v8",
      "bike": "unicode/1f6b2.png?v8",
      "biking_man": "unicode/1f6b4-2642.png?v8",
      "biking_woman": "unicode/1f6b4-2640.png?v8",
      "bikini": "unicode/1f459.png?v8",
      "billed_cap": "unicode/1f9e2.png?v8",
      "biohazard": "unicode/2623.png?v8",
      "bird": "unicode/1f426.png?v8",
      "birthday": "unicode/1f382.png?v8",
      "bison": "unicode/1f9ac.png?v8",
      "black_cat": "unicode/1f408-2b1b.png?v8",
      "black_circle": "unicode/26ab.png?v8",
      "black_flag": "unicode/1f3f4.png?v8",
      "black_heart": "unicode/1f5a4.png?v8",
      "black_joker": "unicode/1f0cf.png?v8",
      "black_large_square": "unicode/2b1b.png?v8",
      "black_medium_small_square": "unicode/25fe.png?v8",
      "black_medium_square": "unicode/25fc.png?v8",
      "black_nib": "unicode/2712.png?v8",
      "black_small_square": "unicode/25aa.png?v8",
      "black_square_button": "unicode/1f532.png?v8",
      "blond_haired_man": "unicode/1f471-2642.png?v8",
      "blond_haired_person": "unicode/1f471.png?v8",
      "blond_haired_woman": "unicode/1f471-2640.png?v8",
      "blonde_woman": "unicode/1f471-2640.png?v8",
      "blossom": "unicode/1f33c.png?v8",
      "blowfish": "unicode/1f421.png?v8",
      "blue_book": "unicode/1f4d8.png?v8",
      "blue_car": "unicode/1f699.png?v8",
      "blue_heart": "unicode/1f499.png?v8",
      "blue_square": "unicode/1f7e6.png?v8",
      "blueberries": "unicode/1fad0.png?v8",
      "blush": "unicode/1f60a.png?v8",
      "boar": "unicode/1f417.png?v8",
      "boat": "unicode/26f5.png?v8",
      "bolivia": "unicode/1f1e7-1f1f4.png?v8",
      "bomb": "unicode/1f4a3.png?v8",
      "bone": "unicode/1f9b4.png?v8",
      "book": "unicode/1f4d6.png?v8",
      "bookmark": "unicode/1f516.png?v8",
      "bookmark_tabs": "unicode/1f4d1.png?v8",
      "books": "unicode/1f4da.png?v8",
      "boom": "unicode/1f4a5.png?v8",
      "boomerang": "unicode/1fa83.png?v8",
      "boot": "unicode/1f462.png?v8",
      "bosnia_herzegovina": "unicode/1f1e7-1f1e6.png?v8",
      "botswana": "unicode/1f1e7-1f1fc.png?v8",
      "bouncing_ball_man": "unicode/26f9-2642.png?v8",
      "bouncing_ball_person": "unicode/26f9.png?v8",
      "bouncing_ball_woman": "unicode/26f9-2640.png?v8",
      "bouquet": "unicode/1f490.png?v8",
      "bouvet_island": "unicode/1f1e7-1f1fb.png?v8",
      "bow": "unicode/1f647.png?v8",
      "bow_and_arrow": "unicode/1f3f9.png?v8",
      "bowing_man": "unicode/1f647-2642.png?v8",
      "bowing_woman": "unicode/1f647-2640.png?v8",
      "bowl_with_spoon": "unicode/1f963.png?v8",
      "bowling": "unicode/1f3b3.png?v8",
      "bowtie": "bowtie.png?v8",
      "boxing_glove": "unicode/1f94a.png?v8",
      "boy": "unicode/1f466.png?v8",
      "brain": "unicode/1f9e0.png?v8",
      "brazil": "unicode/1f1e7-1f1f7.png?v8",
      "bread": "unicode/1f35e.png?v8",
      "breast_feeding": "unicode/1f931.png?v8",
      "bricks": "unicode/1f9f1.png?v8",
      "bride_with_veil": "unicode/1f470-2640.png?v8",
      "bridge_at_night": "unicode/1f309.png?v8",
      "briefcase": "unicode/1f4bc.png?v8",
      "british_indian_ocean_territory": "unicode/1f1ee-1f1f4.png?v8",
      "british_virgin_islands": "unicode/1f1fb-1f1ec.png?v8",
      "broccoli": "unicode/1f966.png?v8",
      "broken_heart": "unicode/1f494.png?v8",
      "broom": "unicode/1f9f9.png?v8",
      "brown_circle": "unicode/1f7e4.png?v8",
      "brown_heart": "unicode/1f90e.png?v8",
      "brown_square": "unicode/1f7eb.png?v8",
      "brunei": "unicode/1f1e7-1f1f3.png?v8",
      "bubble_tea": "unicode/1f9cb.png?v8",
      "bucket": "unicode/1faa3.png?v8",
      "bug": "unicode/1f41b.png?v8",
      "building_construction": "unicode/1f3d7.png?v8",
      "bulb": "unicode/1f4a1.png?v8",
      "bulgaria": "unicode/1f1e7-1f1ec.png?v8",
      "bullettrain_front": "unicode/1f685.png?v8",
      "bullettrain_side": "unicode/1f684.png?v8",
      "burkina_faso": "unicode/1f1e7-1f1eb.png?v8",
      "burrito": "unicode/1f32f.png?v8",
      "burundi": "unicode/1f1e7-1f1ee.png?v8",
      "bus": "unicode/1f68c.png?v8",
      "business_suit_levitating": "unicode/1f574.png?v8",
      "busstop": "unicode/1f68f.png?v8",
      "bust_in_silhouette": "unicode/1f464.png?v8",
      "busts_in_silhouette": "unicode/1f465.png?v8",
      "butter": "unicode/1f9c8.png?v8",
      "butterfly": "unicode/1f98b.png?v8",
      "cactus": "unicode/1f335.png?v8",
      "cake": "unicode/1f370.png?v8",
      "calendar": "unicode/1f4c6.png?v8",
      "call_me_hand": "unicode/1f919.png?v8",
      "calling": "unicode/1f4f2.png?v8",
      "cambodia": "unicode/1f1f0-1f1ed.png?v8",
      "camel": "unicode/1f42b.png?v8",
      "camera": "unicode/1f4f7.png?v8",
      "camera_flash": "unicode/1f4f8.png?v8",
      "cameroon": "unicode/1f1e8-1f1f2.png?v8",
      "camping": "unicode/1f3d5.png?v8",
      "canada": "unicode/1f1e8-1f1e6.png?v8",
      "canary_islands": "unicode/1f1ee-1f1e8.png?v8",
      "cancer": "unicode/264b.png?v8",
      "candle": "unicode/1f56f.png?v8",
      "candy": "unicode/1f36c.png?v8",
      "canned_food": "unicode/1f96b.png?v8",
      "canoe": "unicode/1f6f6.png?v8",
      "cape_verde": "unicode/1f1e8-1f1fb.png?v8",
      "capital_abcd": "unicode/1f520.png?v8",
      "capricorn": "unicode/2651.png?v8",
      "car": "unicode/1f697.png?v8",
      "card_file_box": "unicode/1f5c3.png?v8",
      "card_index": "unicode/1f4c7.png?v8",
      "card_index_dividers": "unicode/1f5c2.png?v8",
      "caribbean_netherlands": "unicode/1f1e7-1f1f6.png?v8",
      "carousel_horse": "unicode/1f3a0.png?v8",
      "carpentry_saw": "unicode/1fa9a.png?v8",
      "carrot": "unicode/1f955.png?v8",
      "cartwheeling": "unicode/1f938.png?v8",
      "cat": "unicode/1f431.png?v8",
      "cat2": "unicode/1f408.png?v8",
      "cayman_islands": "unicode/1f1f0-1f1fe.png?v8",
      "cd": "unicode/1f4bf.png?v8",
      "central_african_republic": "unicode/1f1e8-1f1eb.png?v8",
      "ceuta_melilla": "unicode/1f1ea-1f1e6.png?v8",
      "chad": "unicode/1f1f9-1f1e9.png?v8",
      "chains": "unicode/26d3.png?v8",
      "chair": "unicode/1fa91.png?v8",
      "champagne": "unicode/1f37e.png?v8",
      "chart": "unicode/1f4b9.png?v8",
      "chart_with_downwards_trend": "unicode/1f4c9.png?v8",
      "chart_with_upwards_trend": "unicode/1f4c8.png?v8",
      "checkered_flag": "unicode/1f3c1.png?v8",
      "cheese": "unicode/1f9c0.png?v8",
      "cherries": "unicode/1f352.png?v8",
      "cherry_blossom": "unicode/1f338.png?v8",
      "chess_pawn": "unicode/265f.png?v8",
      "chestnut": "unicode/1f330.png?v8",
      "chicken": "unicode/1f414.png?v8",
      "child": "unicode/1f9d2.png?v8",
      "children_crossing": "unicode/1f6b8.png?v8",
      "chile": "unicode/1f1e8-1f1f1.png?v8",
      "chipmunk": "unicode/1f43f.png?v8",
      "chocolate_bar": "unicode/1f36b.png?v8",
      "chopsticks": "unicode/1f962.png?v8",
      "christmas_island": "unicode/1f1e8-1f1fd.png?v8",
      "christmas_tree": "unicode/1f384.png?v8",
      "church": "unicode/26ea.png?v8",
      "cinema": "unicode/1f3a6.png?v8",
      "circus_tent": "unicode/1f3aa.png?v8",
      "city_sunrise": "unicode/1f307.png?v8",
      "city_sunset": "unicode/1f306.png?v8",
      "cityscape": "unicode/1f3d9.png?v8",
      "cl": "unicode/1f191.png?v8",
      "clamp": "unicode/1f5dc.png?v8",
      "clap": "unicode/1f44f.png?v8",
      "clapper": "unicode/1f3ac.png?v8",
      "classical_building": "unicode/1f3db.png?v8",
      "climbing": "unicode/1f9d7.png?v8",
      "climbing_man": "unicode/1f9d7-2642.png?v8",
      "climbing_woman": "unicode/1f9d7-2640.png?v8",
      "clinking_glasses": "unicode/1f942.png?v8",
      "clipboard": "unicode/1f4cb.png?v8",
      "clipperton_island": "unicode/1f1e8-1f1f5.png?v8",
      "clock1": "unicode/1f550.png?v8",
      "clock10": "unicode/1f559.png?v8",
      "clock1030": "unicode/1f565.png?v8",
      "clock11": "unicode/1f55a.png?v8",
      "clock1130": "unicode/1f566.png?v8",
      "clock12": "unicode/1f55b.png?v8",
      "clock1230": "unicode/1f567.png?v8",
      "clock130": "unicode/1f55c.png?v8",
      "clock2": "unicode/1f551.png?v8",
      "clock230": "unicode/1f55d.png?v8",
      "clock3": "unicode/1f552.png?v8",
      "clock330": "unicode/1f55e.png?v8",
      "clock4": "unicode/1f553.png?v8",
      "clock430": "unicode/1f55f.png?v8",
      "clock5": "unicode/1f554.png?v8",
      "clock530": "unicode/1f560.png?v8",
      "clock6": "unicode/1f555.png?v8",
      "clock630": "unicode/1f561.png?v8",
      "clock7": "unicode/1f556.png?v8",
      "clock730": "unicode/1f562.png?v8",
      "clock8": "unicode/1f557.png?v8",
      "clock830": "unicode/1f563.png?v8",
      "clock9": "unicode/1f558.png?v8",
      "clock930": "unicode/1f564.png?v8",
      "closed_book": "unicode/1f4d5.png?v8",
      "closed_lock_with_key": "unicode/1f510.png?v8",
      "closed_umbrella": "unicode/1f302.png?v8",
      "cloud": "unicode/2601.png?v8",
      "cloud_with_lightning": "unicode/1f329.png?v8",
      "cloud_with_lightning_and_rain": "unicode/26c8.png?v8",
      "cloud_with_rain": "unicode/1f327.png?v8",
      "cloud_with_snow": "unicode/1f328.png?v8",
      "clown_face": "unicode/1f921.png?v8",
      "clubs": "unicode/2663.png?v8",
      "cn": "unicode/1f1e8-1f1f3.png?v8",
      "coat": "unicode/1f9e5.png?v8",
      "cockroach": "unicode/1fab3.png?v8",
      "cocktail": "unicode/1f378.png?v8",
      "coconut": "unicode/1f965.png?v8",
      "cocos_islands": "unicode/1f1e8-1f1e8.png?v8",
      "coffee": "unicode/2615.png?v8",
      "coffin": "unicode/26b0.png?v8",
      "coin": "unicode/1fa99.png?v8",
      "cold_face": "unicode/1f976.png?v8",
      "cold_sweat": "unicode/1f630.png?v8",
      "collision": "unicode/1f4a5.png?v8",
      "colombia": "unicode/1f1e8-1f1f4.png?v8",
      "comet": "unicode/2604.png?v8",
      "comoros": "unicode/1f1f0-1f1f2.png?v8",
      "compass": "unicode/1f9ed.png?v8",
      "computer": "unicode/1f4bb.png?v8",
      "computer_mouse": "unicode/1f5b1.png?v8",
      "confetti_ball": "unicode/1f38a.png?v8",
      "confounded": "unicode/1f616.png?v8",
      "confused": "unicode/1f615.png?v8",
      "congo_brazzaville": "unicode/1f1e8-1f1ec.png?v8",
      "congo_kinshasa": "unicode/1f1e8-1f1e9.png?v8",
      "congratulations": "unicode/3297.png?v8",
      "construction": "unicode/1f6a7.png?v8",
      "construction_worker": "unicode/1f477.png?v8",
      "construction_worker_man": "unicode/1f477-2642.png?v8",
      "construction_worker_woman": "unicode/1f477-2640.png?v8",
      "control_knobs": "unicode/1f39b.png?v8",
      "convenience_store": "unicode/1f3ea.png?v8",
      "cook": "unicode/1f9d1-1f373.png?v8",
      "cook_islands": "unicode/1f1e8-1f1f0.png?v8",
      "cookie": "unicode/1f36a.png?v8",
      "cool": "unicode/1f192.png?v8",
      "cop": "unicode/1f46e.png?v8",
      "copyright": "unicode/00a9.png?v8",
      "corn": "unicode/1f33d.png?v8",
      "costa_rica": "unicode/1f1e8-1f1f7.png?v8",
      "cote_divoire": "unicode/1f1e8-1f1ee.png?v8",
      "couch_and_lamp": "unicode/1f6cb.png?v8",
      "couple": "unicode/1f46b.png?v8",
      "couple_with_heart": "unicode/1f491.png?v8",
      "couple_with_heart_man_man": "unicode/1f468-2764-1f468.png?v8",
      "couple_with_heart_woman_man": "unicode/1f469-2764-1f468.png?v8",
      "couple_with_heart_woman_woman": "unicode/1f469-2764-1f469.png?v8",
      "couplekiss": "unicode/1f48f.png?v8",
      "couplekiss_man_man": "unicode/1f468-2764-1f48b-1f468.png?v8",
      "couplekiss_man_woman": "unicode/1f469-2764-1f48b-1f468.png?v8",
      "couplekiss_woman_woman": "unicode/1f469-2764-1f48b-1f469.png?v8",
      "cow": "unicode/1f42e.png?v8",
      "cow2": "unicode/1f404.png?v8",
      "cowboy_hat_face": "unicode/1f920.png?v8",
      "crab": "unicode/1f980.png?v8",
      "crayon": "unicode/1f58d.png?v8",
      "credit_card": "unicode/1f4b3.png?v8",
      "crescent_moon": "unicode/1f319.png?v8",
      "cricket": "unicode/1f997.png?v8",
      "cricket_game": "unicode/1f3cf.png?v8",
      "croatia": "unicode/1f1ed-1f1f7.png?v8",
      "crocodile": "unicode/1f40a.png?v8",
      "croissant": "unicode/1f950.png?v8",
      "crossed_fingers": "unicode/1f91e.png?v8",
      "crossed_flags": "unicode/1f38c.png?v8",
      "crossed_swords": "unicode/2694.png?v8",
      "crown": "unicode/1f451.png?v8",
      "cry": "unicode/1f622.png?v8",
      "crying_cat_face": "unicode/1f63f.png?v8",
      "crystal_ball": "unicode/1f52e.png?v8",
      "cuba": "unicode/1f1e8-1f1fa.png?v8",
      "cucumber": "unicode/1f952.png?v8",
      "cup_with_straw": "unicode/1f964.png?v8",
      "cupcake": "unicode/1f9c1.png?v8",
      "cupid": "unicode/1f498.png?v8",
      "curacao": "unicode/1f1e8-1f1fc.png?v8",
      "curling_stone": "unicode/1f94c.png?v8",
      "curly_haired_man": "unicode/1f468-1f9b1.png?v8",
      "curly_haired_woman": "unicode/1f469-1f9b1.png?v8",
      "curly_loop": "unicode/27b0.png?v8",
      "currency_exchange": "unicode/1f4b1.png?v8",
      "curry": "unicode/1f35b.png?v8",
      "cursing_face": "unicode/1f92c.png?v8",
      "custard": "unicode/1f36e.png?v8",
      "customs": "unicode/1f6c3.png?v8",
      "cut_of_meat": "unicode/1f969.png?v8",
      "cyclone": "unicode/1f300.png?v8",
      "cyprus": "unicode/1f1e8-1f1fe.png?v8",
      "czech_republic": "unicode/1f1e8-1f1ff.png?v8",
      "dagger": "unicode/1f5e1.png?v8",
      "dancer": "unicode/1f483.png?v8",
      "dancers": "unicode/1f46f.png?v8",
      "dancing_men": "unicode/1f46f-2642.png?v8",
      "dancing_women": "unicode/1f46f-2640.png?v8",
      "dango": "unicode/1f361.png?v8",
      "dark_sunglasses": "unicode/1f576.png?v8",
      "dart": "unicode/1f3af.png?v8",
      "dash": "unicode/1f4a8.png?v8",
      "date": "unicode/1f4c5.png?v8",
      "de": "unicode/1f1e9-1f1ea.png?v8",
      "deaf_man": "unicode/1f9cf-2642.png?v8",
      "deaf_person": "unicode/1f9cf.png?v8",
      "deaf_woman": "unicode/1f9cf-2640.png?v8",
      "deciduous_tree": "unicode/1f333.png?v8",
      "deer": "unicode/1f98c.png?v8",
      "denmark": "unicode/1f1e9-1f1f0.png?v8",
      "department_store": "unicode/1f3ec.png?v8",
      "dependabot": "dependabot.png?v8",
      "derelict_house": "unicode/1f3da.png?v8",
      "desert": "unicode/1f3dc.png?v8",
      "desert_island": "unicode/1f3dd.png?v8",
      "desktop_computer": "unicode/1f5a5.png?v8",
      "detective": "unicode/1f575.png?v8",
      "diamond_shape_with_a_dot_inside": "unicode/1f4a0.png?v8",
      "diamonds": "unicode/2666.png?v8",
      "diego_garcia": "unicode/1f1e9-1f1ec.png?v8",
      "disappointed": "unicode/1f61e.png?v8",
      "disappointed_relieved": "unicode/1f625.png?v8",
      "disguised_face": "unicode/1f978.png?v8",
      "diving_mask": "unicode/1f93f.png?v8",
      "diya_lamp": "unicode/1fa94.png?v8",
      "dizzy": "unicode/1f4ab.png?v8",
      "dizzy_face": "unicode/1f635.png?v8",
      "djibouti": "unicode/1f1e9-1f1ef.png?v8",
      "dna": "unicode/1f9ec.png?v8",
      "do_not_litter": "unicode/1f6af.png?v8",
      "dodo": "unicode/1f9a4.png?v8",
      "dog": "unicode/1f436.png?v8",
      "dog2": "unicode/1f415.png?v8",
      "dollar": "unicode/1f4b5.png?v8",
      "dolls": "unicode/1f38e.png?v8",
      "dolphin": "unicode/1f42c.png?v8",
      "dominica": "unicode/1f1e9-1f1f2.png?v8",
      "dominican_republic": "unicode/1f1e9-1f1f4.png?v8",
      "door": "unicode/1f6aa.png?v8",
      "doughnut": "unicode/1f369.png?v8",
      "dove": "unicode/1f54a.png?v8",
      "dragon": "unicode/1f409.png?v8",
      "dragon_face": "unicode/1f432.png?v8",
      "dress": "unicode/1f457.png?v8",
      "dromedary_camel": "unicode/1f42a.png?v8",
      "drooling_face": "unicode/1f924.png?v8",
      "drop_of_blood": "unicode/1fa78.png?v8",
      "droplet": "unicode/1f4a7.png?v8",
      "drum": "unicode/1f941.png?v8",
      "duck": "unicode/1f986.png?v8",
      "dumpling": "unicode/1f95f.png?v8",
      "dvd": "unicode/1f4c0.png?v8",
      "e-mail": "unicode/1f4e7.png?v8",
      "eagle": "unicode/1f985.png?v8",
      "ear": "unicode/1f442.png?v8",
      "ear_of_rice": "unicode/1f33e.png?v8",
      "ear_with_hearing_aid": "unicode/1f9bb.png?v8",
      "earth_africa": "unicode/1f30d.png?v8",
      "earth_americas": "unicode/1f30e.png?v8",
      "earth_asia": "unicode/1f30f.png?v8",
      "ecuador": "unicode/1f1ea-1f1e8.png?v8",
      "egg": "unicode/1f95a.png?v8",
      "eggplant": "unicode/1f346.png?v8",
      "egypt": "unicode/1f1ea-1f1ec.png?v8",
      "eight": "unicode/0038-20e3.png?v8",
      "eight_pointed_black_star": "unicode/2734.png?v8",
      "eight_spoked_asterisk": "unicode/2733.png?v8",
      "eject_button": "unicode/23cf.png?v8",
      "el_salvador": "unicode/1f1f8-1f1fb.png?v8",
      "electric_plug": "unicode/1f50c.png?v8",
      "electron": "electron.png?v8",
      "elephant": "unicode/1f418.png?v8",
      "elevator": "unicode/1f6d7.png?v8",
      "elf": "unicode/1f9dd.png?v8",
      "elf_man": "unicode/1f9dd-2642.png?v8",
      "elf_woman": "unicode/1f9dd-2640.png?v8",
      "email": "unicode/1f4e7.png?v8",
      "end": "unicode/1f51a.png?v8",
      "england": "unicode/1f3f4-e0067-e0062-e0065-e006e-e0067-e007f.png?v8",
      "envelope": "unicode/2709.png?v8",
      "envelope_with_arrow": "unicode/1f4e9.png?v8",
      "equatorial_guinea": "unicode/1f1ec-1f1f6.png?v8",
      "eritrea": "unicode/1f1ea-1f1f7.png?v8",
      "es": "unicode/1f1ea-1f1f8.png?v8",
      "estonia": "unicode/1f1ea-1f1ea.png?v8",
      "ethiopia": "unicode/1f1ea-1f1f9.png?v8",
      "eu": "unicode/1f1ea-1f1fa.png?v8",
      "euro": "unicode/1f4b6.png?v8",
      "european_castle": "unicode/1f3f0.png?v8",
      "european_post_office": "unicode/1f3e4.png?v8",
      "european_union": "unicode/1f1ea-1f1fa.png?v8",
      "evergreen_tree": "unicode/1f332.png?v8",
      "exclamation": "unicode/2757.png?v8",
      "exploding_head": "unicode/1f92f.png?v8",
      "expressionless": "unicode/1f611.png?v8",
      "eye": "unicode/1f441.png?v8",
      "eye_speech_bubble": "unicode/1f441-1f5e8.png?v8",
      "eyeglasses": "unicode/1f453.png?v8",
      "eyes": "unicode/1f440.png?v8",
      "face_exhaling": "unicode/1f62e-1f4a8.png?v8",
      "face_in_clouds": "unicode/1f636-1f32b.png?v8",
      "face_with_head_bandage": "unicode/1f915.png?v8",
      "face_with_spiral_eyes": "unicode/1f635-1f4ab.png?v8",
      "face_with_thermometer": "unicode/1f912.png?v8",
      "facepalm": "unicode/1f926.png?v8",
      "facepunch": "unicode/1f44a.png?v8",
      "factory": "unicode/1f3ed.png?v8",
      "factory_worker": "unicode/1f9d1-1f3ed.png?v8",
      "fairy": "unicode/1f9da.png?v8",
      "fairy_man": "unicode/1f9da-2642.png?v8",
      "fairy_woman": "unicode/1f9da-2640.png?v8",
      "falafel": "unicode/1f9c6.png?v8",
      "falkland_islands": "unicode/1f1eb-1f1f0.png?v8",
      "fallen_leaf": "unicode/1f342.png?v8",
      "family": "unicode/1f46a.png?v8",
      "family_man_boy": "unicode/1f468-1f466.png?v8",
      "family_man_boy_boy": "unicode/1f468-1f466-1f466.png?v8",
      "family_man_girl": "unicode/1f468-1f467.png?v8",
      "family_man_girl_boy": "unicode/1f468-1f467-1f466.png?v8",
      "family_man_girl_girl": "unicode/1f468-1f467-1f467.png?v8",
      "family_man_man_boy": "unicode/1f468-1f468-1f466.png?v8",
      "family_man_man_boy_boy": "unicode/1f468-1f468-1f466-1f466.png?v8",
      "family_man_man_girl": "unicode/1f468-1f468-1f467.png?v8",
      "family_man_man_girl_boy": "unicode/1f468-1f468-1f467-1f466.png?v8",
      "family_man_man_girl_girl": "unicode/1f468-1f468-1f467-1f467.png?v8",
      "family_man_woman_boy": "unicode/1f468-1f469-1f466.png?v8",
      "family_man_woman_boy_boy": "unicode/1f468-1f469-1f466-1f466.png?v8",
      "family_man_woman_girl": "unicode/1f468-1f469-1f467.png?v8",
      "family_man_woman_girl_boy": "unicode/1f468-1f469-1f467-1f466.png?v8",
      "family_man_woman_girl_girl": "unicode/1f468-1f469-1f467-1f467.png?v8",
      "family_woman_boy": "unicode/1f469-1f466.png?v8",
      "family_woman_boy_boy": "unicode/1f469-1f466-1f466.png?v8",
      "family_woman_girl": "unicode/1f469-1f467.png?v8",
      "family_woman_girl_boy": "unicode/1f469-1f467-1f466.png?v8",
      "family_woman_girl_girl": "unicode/1f469-1f467-1f467.png?v8",
      "family_woman_woman_boy": "unicode/1f469-1f469-1f466.png?v8",
      "family_woman_woman_boy_boy": "unicode/1f469-1f469-1f466-1f466.png?v8",
      "family_woman_woman_girl": "unicode/1f469-1f469-1f467.png?v8",
      "family_woman_woman_girl_boy": "unicode/1f469-1f469-1f467-1f466.png?v8",
      "family_woman_woman_girl_girl": "unicode/1f469-1f469-1f467-1f467.png?v8",
      "farmer": "unicode/1f9d1-1f33e.png?v8",
      "faroe_islands": "unicode/1f1eb-1f1f4.png?v8",
      "fast_forward": "unicode/23e9.png?v8",
      "fax": "unicode/1f4e0.png?v8",
      "fearful": "unicode/1f628.png?v8",
      "feather": "unicode/1fab6.png?v8",
      "feelsgood": "feelsgood.png?v8",
      "feet": "unicode/1f43e.png?v8",
      "female_detective": "unicode/1f575-2640.png?v8",
      "female_sign": "unicode/2640.png?v8",
      "ferris_wheel": "unicode/1f3a1.png?v8",
      "ferry": "unicode/26f4.png?v8",
      "field_hockey": "unicode/1f3d1.png?v8",
      "fiji": "unicode/1f1eb-1f1ef.png?v8",
      "file_cabinet": "unicode/1f5c4.png?v8",
      "file_folder": "unicode/1f4c1.png?v8",
      "film_projector": "unicode/1f4fd.png?v8",
      "film_strip": "unicode/1f39e.png?v8",
      "finland": "unicode/1f1eb-1f1ee.png?v8",
      "finnadie": "finnadie.png?v8",
      "fire": "unicode/1f525.png?v8",
      "fire_engine": "unicode/1f692.png?v8",
      "fire_extinguisher": "unicode/1f9ef.png?v8",
      "firecracker": "unicode/1f9e8.png?v8",
      "firefighter": "unicode/1f9d1-1f692.png?v8",
      "fireworks": "unicode/1f386.png?v8",
      "first_quarter_moon": "unicode/1f313.png?v8",
      "first_quarter_moon_with_face": "unicode/1f31b.png?v8",
      "fish": "unicode/1f41f.png?v8",
      "fish_cake": "unicode/1f365.png?v8",
      "fishing_pole_and_fish": "unicode/1f3a3.png?v8",
      "fishsticks": "fishsticks.png?v8",
      "fist": "unicode/270a.png?v8",
      "fist_left": "unicode/1f91b.png?v8",
      "fist_oncoming": "unicode/1f44a.png?v8",
      "fist_raised": "unicode/270a.png?v8",
      "fist_right": "unicode/1f91c.png?v8",
      "five": "unicode/0035-20e3.png?v8",
      "flags": "unicode/1f38f.png?v8",
      "flamingo": "unicode/1f9a9.png?v8",
      "flashlight": "unicode/1f526.png?v8",
      "flat_shoe": "unicode/1f97f.png?v8",
      "flatbread": "unicode/1fad3.png?v8",
      "fleur_de_lis": "unicode/269c.png?v8",
      "flight_arrival": "unicode/1f6ec.png?v8",
      "flight_departure": "unicode/1f6eb.png?v8",
      "flipper": "unicode/1f42c.png?v8",
      "floppy_disk": "unicode/1f4be.png?v8",
      "flower_playing_cards": "unicode/1f3b4.png?v8",
      "flushed": "unicode/1f633.png?v8",
      "fly": "unicode/1fab0.png?v8",
      "flying_disc": "unicode/1f94f.png?v8",
      "flying_saucer": "unicode/1f6f8.png?v8",
      "fog": "unicode/1f32b.png?v8",
      "foggy": "unicode/1f301.png?v8",
      "fondue": "unicode/1fad5.png?v8",
      "foot": "unicode/1f9b6.png?v8",
      "football": "unicode/1f3c8.png?v8",
      "footprints": "unicode/1f463.png?v8",
      "fork_and_knife": "unicode/1f374.png?v8",
      "fortune_cookie": "unicode/1f960.png?v8",
      "fountain": "unicode/26f2.png?v8",
      "fountain_pen": "unicode/1f58b.png?v8",
      "four": "unicode/0034-20e3.png?v8",
      "four_leaf_clover": "unicode/1f340.png?v8",
      "fox_face": "unicode/1f98a.png?v8",
      "fr": "unicode/1f1eb-1f1f7.png?v8",
      "framed_picture": "unicode/1f5bc.png?v8",
      "free": "unicode/1f193.png?v8",
      "french_guiana": "unicode/1f1ec-1f1eb.png?v8",
      "french_polynesia": "unicode/1f1f5-1f1eb.png?v8",
      "french_southern_territories": "unicode/1f1f9-1f1eb.png?v8",
      "fried_egg": "unicode/1f373.png?v8",
      "fried_shrimp": "unicode/1f364.png?v8",
      "fries": "unicode/1f35f.png?v8",
      "frog": "unicode/1f438.png?v8",
      "frowning": "unicode/1f626.png?v8",
      "frowning_face": "unicode/2639.png?v8",
      "frowning_man": "unicode/1f64d-2642.png?v8",
      "frowning_person": "unicode/1f64d.png?v8",
      "frowning_woman": "unicode/1f64d-2640.png?v8",
      "fu": "unicode/1f595.png?v8",
      "fuelpump": "unicode/26fd.png?v8",
      "full_moon": "unicode/1f315.png?v8",
      "full_moon_with_face": "unicode/1f31d.png?v8",
      "funeral_urn": "unicode/26b1.png?v8",
      "gabon": "unicode/1f1ec-1f1e6.png?v8",
      "gambia": "unicode/1f1ec-1f1f2.png?v8",
      "game_die": "unicode/1f3b2.png?v8",
      "garlic": "unicode/1f9c4.png?v8",
      "gb": "unicode/1f1ec-1f1e7.png?v8",
      "gear": "unicode/2699.png?v8",
      "gem": "unicode/1f48e.png?v8",
      "gemini": "unicode/264a.png?v8",
      "genie": "unicode/1f9de.png?v8",
      "genie_man": "unicode/1f9de-2642.png?v8",
      "genie_woman": "unicode/1f9de-2640.png?v8",
      "georgia": "unicode/1f1ec-1f1ea.png?v8",
      "ghana": "unicode/1f1ec-1f1ed.png?v8",
      "ghost": "unicode/1f47b.png?v8",
      "gibraltar": "unicode/1f1ec-1f1ee.png?v8",
      "gift": "unicode/1f381.png?v8",
      "gift_heart": "unicode/1f49d.png?v8",
      "giraffe": "unicode/1f992.png?v8",
      "girl": "unicode/1f467.png?v8",
      "globe_with_meridians": "unicode/1f310.png?v8",
      "gloves": "unicode/1f9e4.png?v8",
      "goal_net": "unicode/1f945.png?v8",
      "goat": "unicode/1f410.png?v8",
      "goberserk": "goberserk.png?v8",
      "godmode": "godmode.png?v8",
      "goggles": "unicode/1f97d.png?v8",
      "golf": "unicode/26f3.png?v8",
      "golfing": "unicode/1f3cc.png?v8",
      "golfing_man": "unicode/1f3cc-2642.png?v8",
      "golfing_woman": "unicode/1f3cc-2640.png?v8",
      "gorilla": "unicode/1f98d.png?v8",
      "grapes": "unicode/1f347.png?v8",
      "greece": "unicode/1f1ec-1f1f7.png?v8",
      "green_apple": "unicode/1f34f.png?v8",
      "green_book": "unicode/1f4d7.png?v8",
      "green_circle": "unicode/1f7e2.png?v8",
      "green_heart": "unicode/1f49a.png?v8",
      "green_salad": "unicode/1f957.png?v8",
      "green_square": "unicode/1f7e9.png?v8",
      "greenland": "unicode/1f1ec-1f1f1.png?v8",
      "grenada": "unicode/1f1ec-1f1e9.png?v8",
      "grey_exclamation": "unicode/2755.png?v8",
      "grey_question": "unicode/2754.png?v8",
      "grimacing": "unicode/1f62c.png?v8",
      "grin": "unicode/1f601.png?v8",
      "grinning": "unicode/1f600.png?v8",
      "guadeloupe": "unicode/1f1ec-1f1f5.png?v8",
      "guam": "unicode/1f1ec-1f1fa.png?v8",
      "guard": "unicode/1f482.png?v8",
      "guardsman": "unicode/1f482-2642.png?v8",
      "guardswoman": "unicode/1f482-2640.png?v8",
      "guatemala": "unicode/1f1ec-1f1f9.png?v8",
      "guernsey": "unicode/1f1ec-1f1ec.png?v8",
      "guide_dog": "unicode/1f9ae.png?v8",
      "guinea": "unicode/1f1ec-1f1f3.png?v8",
      "guinea_bissau": "unicode/1f1ec-1f1fc.png?v8",
      "guitar": "unicode/1f3b8.png?v8",
      "gun": "unicode/1f52b.png?v8",
      "guyana": "unicode/1f1ec-1f1fe.png?v8",
      "haircut": "unicode/1f487.png?v8",
      "haircut_man": "unicode/1f487-2642.png?v8",
      "haircut_woman": "unicode/1f487-2640.png?v8",
      "haiti": "unicode/1f1ed-1f1f9.png?v8",
      "hamburger": "unicode/1f354.png?v8",
      "hammer": "unicode/1f528.png?v8",
      "hammer_and_pick": "unicode/2692.png?v8",
      "hammer_and_wrench": "unicode/1f6e0.png?v8",
      "hamster": "unicode/1f439.png?v8",
      "hand": "unicode/270b.png?v8",
      "hand_over_mouth": "unicode/1f92d.png?v8",
      "handbag": "unicode/1f45c.png?v8",
      "handball_person": "unicode/1f93e.png?v8",
      "handshake": "unicode/1f91d.png?v8",
      "hankey": "unicode/1f4a9.png?v8",
      "hash": "unicode/0023-20e3.png?v8",
      "hatched_chick": "unicode/1f425.png?v8",
      "hatching_chick": "unicode/1f423.png?v8",
      "headphones": "unicode/1f3a7.png?v8",
      "headstone": "unicode/1faa6.png?v8",
      "health_worker": "unicode/1f9d1-2695.png?v8",
      "hear_no_evil": "unicode/1f649.png?v8",
      "heard_mcdonald_islands": "unicode/1f1ed-1f1f2.png?v8",
      "heart": "unicode/2764.png?v8",
      "heart_decoration": "unicode/1f49f.png?v8",
      "heart_eyes": "unicode/1f60d.png?v8",
      "heart_eyes_cat": "unicode/1f63b.png?v8",
      "heart_on_fire": "unicode/2764-1f525.png?v8",
      "heartbeat": "unicode/1f493.png?v8",
      "heartpulse": "unicode/1f497.png?v8",
      "hearts": "unicode/2665.png?v8",
      "heavy_check_mark": "unicode/2714.png?v8",
      "heavy_division_sign": "unicode/2797.png?v8",
      "heavy_dollar_sign": "unicode/1f4b2.png?v8",
      "heavy_exclamation_mark": "unicode/2757.png?v8",
      "heavy_heart_exclamation": "unicode/2763.png?v8",
      "heavy_minus_sign": "unicode/2796.png?v8",
      "heavy_multiplication_x": "unicode/2716.png?v8",
      "heavy_plus_sign": "unicode/2795.png?v8",
      "hedgehog": "unicode/1f994.png?v8",
      "helicopter": "unicode/1f681.png?v8",
      "herb": "unicode/1f33f.png?v8",
      "hibiscus": "unicode/1f33a.png?v8",
      "high_brightness": "unicode/1f506.png?v8",
      "high_heel": "unicode/1f460.png?v8",
      "hiking_boot": "unicode/1f97e.png?v8",
      "hindu_temple": "unicode/1f6d5.png?v8",
      "hippopotamus": "unicode/1f99b.png?v8",
      "hocho": "unicode/1f52a.png?v8",
      "hole": "unicode/1f573.png?v8",
      "honduras": "unicode/1f1ed-1f1f3.png?v8",
      "honey_pot": "unicode/1f36f.png?v8",
      "honeybee": "unicode/1f41d.png?v8",
      "hong_kong": "unicode/1f1ed-1f1f0.png?v8",
      "hook": "unicode/1fa9d.png?v8",
      "horse": "unicode/1f434.png?v8",
      "horse_racing": "unicode/1f3c7.png?v8",
      "hospital": "unicode/1f3e5.png?v8",
      "hot_face": "unicode/1f975.png?v8",
      "hot_pepper": "unicode/1f336.png?v8",
      "hotdog": "unicode/1f32d.png?v8",
      "hotel": "unicode/1f3e8.png?v8",
      "hotsprings": "unicode/2668.png?v8",
      "hourglass": "unicode/231b.png?v8",
      "hourglass_flowing_sand": "unicode/23f3.png?v8",
      "house": "unicode/1f3e0.png?v8",
      "house_with_garden": "unicode/1f3e1.png?v8",
      "houses": "unicode/1f3d8.png?v8",
      "hugs": "unicode/1f917.png?v8",
      "hungary": "unicode/1f1ed-1f1fa.png?v8",
      "hurtrealbad": "hurtrealbad.png?v8",
      "hushed": "unicode/1f62f.png?v8",
      "hut": "unicode/1f6d6.png?v8",
      "ice_cream": "unicode/1f368.png?v8",
      "ice_cube": "unicode/1f9ca.png?v8",
      "ice_hockey": "unicode/1f3d2.png?v8",
      "ice_skate": "unicode/26f8.png?v8",
      "icecream": "unicode/1f366.png?v8",
      "iceland": "unicode/1f1ee-1f1f8.png?v8",
      "id": "unicode/1f194.png?v8",
      "ideograph_advantage": "unicode/1f250.png?v8",
      "imp": "unicode/1f47f.png?v8",
      "inbox_tray": "unicode/1f4e5.png?v8",
      "incoming_envelope": "unicode/1f4e8.png?v8",
      "india": "unicode/1f1ee-1f1f3.png?v8",
      "indonesia": "unicode/1f1ee-1f1e9.png?v8",
      "infinity": "unicode/267e.png?v8",
      "information_desk_person": "unicode/1f481.png?v8",
      "information_source": "unicode/2139.png?v8",
      "innocent": "unicode/1f607.png?v8",
      "interrobang": "unicode/2049.png?v8",
      "iphone": "unicode/1f4f1.png?v8",
      "iran": "unicode/1f1ee-1f1f7.png?v8",
      "iraq": "unicode/1f1ee-1f1f6.png?v8",
      "ireland": "unicode/1f1ee-1f1ea.png?v8",
      "isle_of_man": "unicode/1f1ee-1f1f2.png?v8",
      "israel": "unicode/1f1ee-1f1f1.png?v8",
      "it": "unicode/1f1ee-1f1f9.png?v8",
      "izakaya_lantern": "unicode/1f3ee.png?v8",
      "jack_o_lantern": "unicode/1f383.png?v8",
      "jamaica": "unicode/1f1ef-1f1f2.png?v8",
      "japan": "unicode/1f5fe.png?v8",
      "japanese_castle": "unicode/1f3ef.png?v8",
      "japanese_goblin": "unicode/1f47a.png?v8",
      "japanese_ogre": "unicode/1f479.png?v8",
      "jeans": "unicode/1f456.png?v8",
      "jersey": "unicode/1f1ef-1f1ea.png?v8",
      "jigsaw": "unicode/1f9e9.png?v8",
      "jordan": "unicode/1f1ef-1f1f4.png?v8",
      "joy": "unicode/1f602.png?v8",
      "joy_cat": "unicode/1f639.png?v8",
      "joystick": "unicode/1f579.png?v8",
      "jp": "unicode/1f1ef-1f1f5.png?v8",
      "judge": "unicode/1f9d1-2696.png?v8",
      "juggling_person": "unicode/1f939.png?v8",
      "kaaba": "unicode/1f54b.png?v8",
      "kangaroo": "unicode/1f998.png?v8",
      "kazakhstan": "unicode/1f1f0-1f1ff.png?v8",
      "kenya": "unicode/1f1f0-1f1ea.png?v8",
      "key": "unicode/1f511.png?v8",
      "keyboard": "unicode/2328.png?v8",
      "keycap_ten": "unicode/1f51f.png?v8",
      "kick_scooter": "unicode/1f6f4.png?v8",
      "kimono": "unicode/1f458.png?v8",
      "kiribati": "unicode/1f1f0-1f1ee.png?v8",
      "kiss": "unicode/1f48b.png?v8",
      "kissing": "unicode/1f617.png?v8",
      "kissing_cat": "unicode/1f63d.png?v8",
      "kissing_closed_eyes": "unicode/1f61a.png?v8",
      "kissing_heart": "unicode/1f618.png?v8",
      "kissing_smiling_eyes": "unicode/1f619.png?v8",
      "kite": "unicode/1fa81.png?v8",
      "kiwi_fruit": "unicode/1f95d.png?v8",
      "kneeling_man": "unicode/1f9ce-2642.png?v8",
      "kneeling_person": "unicode/1f9ce.png?v8",
      "kneeling_woman": "unicode/1f9ce-2640.png?v8",
      "knife": "unicode/1f52a.png?v8",
      "knot": "unicode/1faa2.png?v8",
      "koala": "unicode/1f428.png?v8",
      "koko": "unicode/1f201.png?v8",
      "kosovo": "unicode/1f1fd-1f1f0.png?v8",
      "kr": "unicode/1f1f0-1f1f7.png?v8",
      "kuwait": "unicode/1f1f0-1f1fc.png?v8",
      "kyrgyzstan": "unicode/1f1f0-1f1ec.png?v8",
      "lab_coat": "unicode/1f97c.png?v8",
      "label": "unicode/1f3f7.png?v8",
      "lacrosse": "unicode/1f94d.png?v8",
      "ladder": "unicode/1fa9c.png?v8",
      "lady_beetle": "unicode/1f41e.png?v8",
      "lantern": "unicode/1f3ee.png?v8",
      "laos": "unicode/1f1f1-1f1e6.png?v8",
      "large_blue_circle": "unicode/1f535.png?v8",
      "large_blue_diamond": "unicode/1f537.png?v8",
      "large_orange_diamond": "unicode/1f536.png?v8",
      "last_quarter_moon": "unicode/1f317.png?v8",
      "last_quarter_moon_with_face": "unicode/1f31c.png?v8",
      "latin_cross": "unicode/271d.png?v8",
      "latvia": "unicode/1f1f1-1f1fb.png?v8",
      "laughing": "unicode/1f606.png?v8",
      "leafy_green": "unicode/1f96c.png?v8",
      "leaves": "unicode/1f343.png?v8",
      "lebanon": "unicode/1f1f1-1f1e7.png?v8",
      "ledger": "unicode/1f4d2.png?v8",
      "left_luggage": "unicode/1f6c5.png?v8",
      "left_right_arrow": "unicode/2194.png?v8",
      "left_speech_bubble": "unicode/1f5e8.png?v8",
      "leftwards_arrow_with_hook": "unicode/21a9.png?v8",
      "leg": "unicode/1f9b5.png?v8",
      "lemon": "unicode/1f34b.png?v8",
      "leo": "unicode/264c.png?v8",
      "leopard": "unicode/1f406.png?v8",
      "lesotho": "unicode/1f1f1-1f1f8.png?v8",
      "level_slider": "unicode/1f39a.png?v8",
      "liberia": "unicode/1f1f1-1f1f7.png?v8",
      "libra": "unicode/264e.png?v8",
      "libya": "unicode/1f1f1-1f1fe.png?v8",
      "liechtenstein": "unicode/1f1f1-1f1ee.png?v8",
      "light_rail": "unicode/1f688.png?v8",
      "link": "unicode/1f517.png?v8",
      "lion": "unicode/1f981.png?v8",
      "lips": "unicode/1f444.png?v8",
      "lipstick": "unicode/1f484.png?v8",
      "lithuania": "unicode/1f1f1-1f1f9.png?v8",
      "lizard": "unicode/1f98e.png?v8",
      "llama": "unicode/1f999.png?v8",
      "lobster": "unicode/1f99e.png?v8",
      "lock": "unicode/1f512.png?v8",
      "lock_with_ink_pen": "unicode/1f50f.png?v8",
      "lollipop": "unicode/1f36d.png?v8",
      "long_drum": "unicode/1fa98.png?v8",
      "loop": "unicode/27bf.png?v8",
      "lotion_bottle": "unicode/1f9f4.png?v8",
      "lotus_position": "unicode/1f9d8.png?v8",
      "lotus_position_man": "unicode/1f9d8-2642.png?v8",
      "lotus_position_woman": "unicode/1f9d8-2640.png?v8",
      "loud_sound": "unicode/1f50a.png?v8",
      "loudspeaker": "unicode/1f4e2.png?v8",
      "love_hotel": "unicode/1f3e9.png?v8",
      "love_letter": "unicode/1f48c.png?v8",
      "love_you_gesture": "unicode/1f91f.png?v8",
      "low_brightness": "unicode/1f505.png?v8",
      "luggage": "unicode/1f9f3.png?v8",
      "lungs": "unicode/1fac1.png?v8",
      "luxembourg": "unicode/1f1f1-1f1fa.png?v8",
      "lying_face": "unicode/1f925.png?v8",
      "m": "unicode/24c2.png?v8",
      "macau": "unicode/1f1f2-1f1f4.png?v8",
      "macedonia": "unicode/1f1f2-1f1f0.png?v8",
      "madagascar": "unicode/1f1f2-1f1ec.png?v8",
      "mag": "unicode/1f50d.png?v8",
      "mag_right": "unicode/1f50e.png?v8",
      "mage": "unicode/1f9d9.png?v8",
      "mage_man": "unicode/1f9d9-2642.png?v8",
      "mage_woman": "unicode/1f9d9-2640.png?v8",
      "magic_wand": "unicode/1fa84.png?v8",
      "magnet": "unicode/1f9f2.png?v8",
      "mahjong": "unicode/1f004.png?v8",
      "mailbox": "unicode/1f4eb.png?v8",
      "mailbox_closed": "unicode/1f4ea.png?v8",
      "mailbox_with_mail": "unicode/1f4ec.png?v8",
      "mailbox_with_no_mail": "unicode/1f4ed.png?v8",
      "malawi": "unicode/1f1f2-1f1fc.png?v8",
      "malaysia": "unicode/1f1f2-1f1fe.png?v8",
      "maldives": "unicode/1f1f2-1f1fb.png?v8",
      "male_detective": "unicode/1f575-2642.png?v8",
      "male_sign": "unicode/2642.png?v8",
      "mali": "unicode/1f1f2-1f1f1.png?v8",
      "malta": "unicode/1f1f2-1f1f9.png?v8",
      "mammoth": "unicode/1f9a3.png?v8",
      "man": "unicode/1f468.png?v8",
      "man_artist": "unicode/1f468-1f3a8.png?v8",
      "man_astronaut": "unicode/1f468-1f680.png?v8",
      "man_beard": "unicode/1f9d4-2642.png?v8",
      "man_cartwheeling": "unicode/1f938-2642.png?v8",
      "man_cook": "unicode/1f468-1f373.png?v8",
      "man_dancing": "unicode/1f57a.png?v8",
      "man_facepalming": "unicode/1f926-2642.png?v8",
      "man_factory_worker": "unicode/1f468-1f3ed.png?v8",
      "man_farmer": "unicode/1f468-1f33e.png?v8",
      "man_feeding_baby": "unicode/1f468-1f37c.png?v8",
      "man_firefighter": "unicode/1f468-1f692.png?v8",
      "man_health_worker": "unicode/1f468-2695.png?v8",
      "man_in_manual_wheelchair": "unicode/1f468-1f9bd.png?v8",
      "man_in_motorized_wheelchair": "unicode/1f468-1f9bc.png?v8",
      "man_in_tuxedo": "unicode/1f935-2642.png?v8",
      "man_judge": "unicode/1f468-2696.png?v8",
      "man_juggling": "unicode/1f939-2642.png?v8",
      "man_mechanic": "unicode/1f468-1f527.png?v8",
      "man_office_worker": "unicode/1f468-1f4bc.png?v8",
      "man_pilot": "unicode/1f468-2708.png?v8",
      "man_playing_handball": "unicode/1f93e-2642.png?v8",
      "man_playing_water_polo": "unicode/1f93d-2642.png?v8",
      "man_scientist": "unicode/1f468-1f52c.png?v8",
      "man_shrugging": "unicode/1f937-2642.png?v8",
      "man_singer": "unicode/1f468-1f3a4.png?v8",
      "man_student": "unicode/1f468-1f393.png?v8",
      "man_teacher": "unicode/1f468-1f3eb.png?v8",
      "man_technologist": "unicode/1f468-1f4bb.png?v8",
      "man_with_gua_pi_mao": "unicode/1f472.png?v8",
      "man_with_probing_cane": "unicode/1f468-1f9af.png?v8",
      "man_with_turban": "unicode/1f473-2642.png?v8",
      "man_with_veil": "unicode/1f470-2642.png?v8",
      "mandarin": "unicode/1f34a.png?v8",
      "mango": "unicode/1f96d.png?v8",
      "mans_shoe": "unicode/1f45e.png?v8",
      "mantelpiece_clock": "unicode/1f570.png?v8",
      "manual_wheelchair": "unicode/1f9bd.png?v8",
      "maple_leaf": "unicode/1f341.png?v8",
      "marshall_islands": "unicode/1f1f2-1f1ed.png?v8",
      "martial_arts_uniform": "unicode/1f94b.png?v8",
      "martinique": "unicode/1f1f2-1f1f6.png?v8",
      "mask": "unicode/1f637.png?v8",
      "massage": "unicode/1f486.png?v8",
      "massage_man": "unicode/1f486-2642.png?v8",
      "massage_woman": "unicode/1f486-2640.png?v8",
      "mate": "unicode/1f9c9.png?v8",
      "mauritania": "unicode/1f1f2-1f1f7.png?v8",
      "mauritius": "unicode/1f1f2-1f1fa.png?v8",
      "mayotte": "unicode/1f1fe-1f1f9.png?v8",
      "meat_on_bone": "unicode/1f356.png?v8",
      "mechanic": "unicode/1f9d1-1f527.png?v8",
      "mechanical_arm": "unicode/1f9be.png?v8",
      "mechanical_leg": "unicode/1f9bf.png?v8",
      "medal_military": "unicode/1f396.png?v8",
      "medal_sports": "unicode/1f3c5.png?v8",
      "medical_symbol": "unicode/2695.png?v8",
      "mega": "unicode/1f4e3.png?v8",
      "melon": "unicode/1f348.png?v8",
      "memo": "unicode/1f4dd.png?v8",
      "men_wrestling": "unicode/1f93c-2642.png?v8",
      "mending_heart": "unicode/2764-1fa79.png?v8",
      "menorah": "unicode/1f54e.png?v8",
      "mens": "unicode/1f6b9.png?v8",
      "mermaid": "unicode/1f9dc-2640.png?v8",
      "merman": "unicode/1f9dc-2642.png?v8",
      "merperson": "unicode/1f9dc.png?v8",
      "metal": "unicode/1f918.png?v8",
      "metro": "unicode/1f687.png?v8",
      "mexico": "unicode/1f1f2-1f1fd.png?v8",
      "microbe": "unicode/1f9a0.png?v8",
      "micronesia": "unicode/1f1eb-1f1f2.png?v8",
      "microphone": "unicode/1f3a4.png?v8",
      "microscope": "unicode/1f52c.png?v8",
      "middle_finger": "unicode/1f595.png?v8",
      "military_helmet": "unicode/1fa96.png?v8",
      "milk_glass": "unicode/1f95b.png?v8",
      "milky_way": "unicode/1f30c.png?v8",
      "minibus": "unicode/1f690.png?v8",
      "minidisc": "unicode/1f4bd.png?v8",
      "mirror": "unicode/1fa9e.png?v8",
      "mobile_phone_off": "unicode/1f4f4.png?v8",
      "moldova": "unicode/1f1f2-1f1e9.png?v8",
      "monaco": "unicode/1f1f2-1f1e8.png?v8",
      "money_mouth_face": "unicode/1f911.png?v8",
      "money_with_wings": "unicode/1f4b8.png?v8",
      "moneybag": "unicode/1f4b0.png?v8",
      "mongolia": "unicode/1f1f2-1f1f3.png?v8",
      "monkey": "unicode/1f412.png?v8",
      "monkey_face": "unicode/1f435.png?v8",
      "monocle_face": "unicode/1f9d0.png?v8",
      "monorail": "unicode/1f69d.png?v8",
      "montenegro": "unicode/1f1f2-1f1ea.png?v8",
      "montserrat": "unicode/1f1f2-1f1f8.png?v8",
      "moon": "unicode/1f314.png?v8",
      "moon_cake": "unicode/1f96e.png?v8",
      "morocco": "unicode/1f1f2-1f1e6.png?v8",
      "mortar_board": "unicode/1f393.png?v8",
      "mosque": "unicode/1f54c.png?v8",
      "mosquito": "unicode/1f99f.png?v8",
      "motor_boat": "unicode/1f6e5.png?v8",
      "motor_scooter": "unicode/1f6f5.png?v8",
      "motorcycle": "unicode/1f3cd.png?v8",
      "motorized_wheelchair": "unicode/1f9bc.png?v8",
      "motorway": "unicode/1f6e3.png?v8",
      "mount_fuji": "unicode/1f5fb.png?v8",
      "mountain": "unicode/26f0.png?v8",
      "mountain_bicyclist": "unicode/1f6b5.png?v8",
      "mountain_biking_man": "unicode/1f6b5-2642.png?v8",
      "mountain_biking_woman": "unicode/1f6b5-2640.png?v8",
      "mountain_cableway": "unicode/1f6a0.png?v8",
      "mountain_railway": "unicode/1f69e.png?v8",
      "mountain_snow": "unicode/1f3d4.png?v8",
      "mouse": "unicode/1f42d.png?v8",
      "mouse2": "unicode/1f401.png?v8",
      "mouse_trap": "unicode/1faa4.png?v8",
      "movie_camera": "unicode/1f3a5.png?v8",
      "moyai": "unicode/1f5ff.png?v8",
      "mozambique": "unicode/1f1f2-1f1ff.png?v8",
      "mrs_claus": "unicode/1f936.png?v8",
      "muscle": "unicode/1f4aa.png?v8",
      "mushroom": "unicode/1f344.png?v8",
      "musical_keyboard": "unicode/1f3b9.png?v8",
      "musical_note": "unicode/1f3b5.png?v8",
      "musical_score": "unicode/1f3bc.png?v8",
      "mute": "unicode/1f507.png?v8",
      "mx_claus": "unicode/1f9d1-1f384.png?v8",
      "myanmar": "unicode/1f1f2-1f1f2.png?v8",
      "nail_care": "unicode/1f485.png?v8",
      "name_badge": "unicode/1f4db.png?v8",
      "namibia": "unicode/1f1f3-1f1e6.png?v8",
      "national_park": "unicode/1f3de.png?v8",
      "nauru": "unicode/1f1f3-1f1f7.png?v8",
      "nauseated_face": "unicode/1f922.png?v8",
      "nazar_amulet": "unicode/1f9ff.png?v8",
      "neckbeard": "neckbeard.png?v8",
      "necktie": "unicode/1f454.png?v8",
      "negative_squared_cross_mark": "unicode/274e.png?v8",
      "nepal": "unicode/1f1f3-1f1f5.png?v8",
      "nerd_face": "unicode/1f913.png?v8",
      "nesting_dolls": "unicode/1fa86.png?v8",
      "netherlands": "unicode/1f1f3-1f1f1.png?v8",
      "neutral_face": "unicode/1f610.png?v8",
      "new": "unicode/1f195.png?v8",
      "new_caledonia": "unicode/1f1f3-1f1e8.png?v8",
      "new_moon": "unicode/1f311.png?v8",
      "new_moon_with_face": "unicode/1f31a.png?v8",
      "new_zealand": "unicode/1f1f3-1f1ff.png?v8",
      "newspaper": "unicode/1f4f0.png?v8",
      "newspaper_roll": "unicode/1f5de.png?v8",
      "next_track_button": "unicode/23ed.png?v8",
      "ng": "unicode/1f196.png?v8",
      "ng_man": "unicode/1f645-2642.png?v8",
      "ng_woman": "unicode/1f645-2640.png?v8",
      "nicaragua": "unicode/1f1f3-1f1ee.png?v8",
      "niger": "unicode/1f1f3-1f1ea.png?v8",
      "nigeria": "unicode/1f1f3-1f1ec.png?v8",
      "night_with_stars": "unicode/1f303.png?v8",
      "nine": "unicode/0039-20e3.png?v8",
      "ninja": "unicode/1f977.png?v8",
      "niue": "unicode/1f1f3-1f1fa.png?v8",
      "no_bell": "unicode/1f515.png?v8",
      "no_bicycles": "unicode/1f6b3.png?v8",
      "no_entry": "unicode/26d4.png?v8",
      "no_entry_sign": "unicode/1f6ab.png?v8",
      "no_good": "unicode/1f645.png?v8",
      "no_good_man": "unicode/1f645-2642.png?v8",
      "no_good_woman": "unicode/1f645-2640.png?v8",
      "no_mobile_phones": "unicode/1f4f5.png?v8",
      "no_mouth": "unicode/1f636.png?v8",
      "no_pedestrians": "unicode/1f6b7.png?v8",
      "no_smoking": "unicode/1f6ad.png?v8",
      "non-potable_water": "unicode/1f6b1.png?v8",
      "norfolk_island": "unicode/1f1f3-1f1eb.png?v8",
      "north_korea": "unicode/1f1f0-1f1f5.png?v8",
      "northern_mariana_islands": "unicode/1f1f2-1f1f5.png?v8",
      "norway": "unicode/1f1f3-1f1f4.png?v8",
      "nose": "unicode/1f443.png?v8",
      "notebook": "unicode/1f4d3.png?v8",
      "notebook_with_decorative_cover": "unicode/1f4d4.png?v8",
      "notes": "unicode/1f3b6.png?v8",
      "nut_and_bolt": "unicode/1f529.png?v8",
      "o": "unicode/2b55.png?v8",
      "o2": "unicode/1f17e.png?v8",
      "ocean": "unicode/1f30a.png?v8",
      "octocat": "octocat.png?v8",
      "octopus": "unicode/1f419.png?v8",
      "oden": "unicode/1f362.png?v8",
      "office": "unicode/1f3e2.png?v8",
      "office_worker": "unicode/1f9d1-1f4bc.png?v8",
      "oil_drum": "unicode/1f6e2.png?v8",
      "ok": "unicode/1f197.png?v8",
      "ok_hand": "unicode/1f44c.png?v8",
      "ok_man": "unicode/1f646-2642.png?v8",
      "ok_person": "unicode/1f646.png?v8",
      "ok_woman": "unicode/1f646-2640.png?v8",
      "old_key": "unicode/1f5dd.png?v8",
      "older_adult": "unicode/1f9d3.png?v8",
      "older_man": "unicode/1f474.png?v8",
      "older_woman": "unicode/1f475.png?v8",
      "olive": "unicode/1fad2.png?v8",
      "om": "unicode/1f549.png?v8",
      "oman": "unicode/1f1f4-1f1f2.png?v8",
      "on": "unicode/1f51b.png?v8",
      "oncoming_automobile": "unicode/1f698.png?v8",
      "oncoming_bus": "unicode/1f68d.png?v8",
      "oncoming_police_car": "unicode/1f694.png?v8",
      "oncoming_taxi": "unicode/1f696.png?v8",
      "one": "unicode/0031-20e3.png?v8",
      "one_piece_swimsuit": "unicode/1fa71.png?v8",
      "onion": "unicode/1f9c5.png?v8",
      "open_book": "unicode/1f4d6.png?v8",
      "open_file_folder": "unicode/1f4c2.png?v8",
      "open_hands": "unicode/1f450.png?v8",
      "open_mouth": "unicode/1f62e.png?v8",
      "open_umbrella": "unicode/2602.png?v8",
      "ophiuchus": "unicode/26ce.png?v8",
      "orange": "unicode/1f34a.png?v8",
      "orange_book": "unicode/1f4d9.png?v8",
      "orange_circle": "unicode/1f7e0.png?v8",
      "orange_heart": "unicode/1f9e1.png?v8",
      "orange_square": "unicode/1f7e7.png?v8",
      "orangutan": "unicode/1f9a7.png?v8",
      "orthodox_cross": "unicode/2626.png?v8",
      "otter": "unicode/1f9a6.png?v8",
      "outbox_tray": "unicode/1f4e4.png?v8",
      "owl": "unicode/1f989.png?v8",
      "ox": "unicode/1f402.png?v8",
      "oyster": "unicode/1f9aa.png?v8",
      "package": "unicode/1f4e6.png?v8",
      "page_facing_up": "unicode/1f4c4.png?v8",
      "page_with_curl": "unicode/1f4c3.png?v8",
      "pager": "unicode/1f4df.png?v8",
      "paintbrush": "unicode/1f58c.png?v8",
      "pakistan": "unicode/1f1f5-1f1f0.png?v8",
      "palau": "unicode/1f1f5-1f1fc.png?v8",
      "palestinian_territories": "unicode/1f1f5-1f1f8.png?v8",
      "palm_tree": "unicode/1f334.png?v8",
      "palms_up_together": "unicode/1f932.png?v8",
      "panama": "unicode/1f1f5-1f1e6.png?v8",
      "pancakes": "unicode/1f95e.png?v8",
      "panda_face": "unicode/1f43c.png?v8",
      "paperclip": "unicode/1f4ce.png?v8",
      "paperclips": "unicode/1f587.png?v8",
      "papua_new_guinea": "unicode/1f1f5-1f1ec.png?v8",
      "parachute": "unicode/1fa82.png?v8",
      "paraguay": "unicode/1f1f5-1f1fe.png?v8",
      "parasol_on_ground": "unicode/26f1.png?v8",
      "parking": "unicode/1f17f.png?v8",
      "parrot": "unicode/1f99c.png?v8",
      "part_alternation_mark": "unicode/303d.png?v8",
      "partly_sunny": "unicode/26c5.png?v8",
      "partying_face": "unicode/1f973.png?v8",
      "passenger_ship": "unicode/1f6f3.png?v8",
      "passport_control": "unicode/1f6c2.png?v8",
      "pause_button": "unicode/23f8.png?v8",
      "paw_prints": "unicode/1f43e.png?v8",
      "peace_symbol": "unicode/262e.png?v8",
      "peach": "unicode/1f351.png?v8",
      "peacock": "unicode/1f99a.png?v8",
      "peanuts": "unicode/1f95c.png?v8",
      "pear": "unicode/1f350.png?v8",
      "pen": "unicode/1f58a.png?v8",
      "pencil": "unicode/1f4dd.png?v8",
      "pencil2": "unicode/270f.png?v8",
      "penguin": "unicode/1f427.png?v8",
      "pensive": "unicode/1f614.png?v8",
      "people_holding_hands": "unicode/1f9d1-1f91d-1f9d1.png?v8",
      "people_hugging": "unicode/1fac2.png?v8",
      "performing_arts": "unicode/1f3ad.png?v8",
      "persevere": "unicode/1f623.png?v8",
      "person_bald": "unicode/1f9d1-1f9b2.png?v8",
      "person_curly_hair": "unicode/1f9d1-1f9b1.png?v8",
      "person_feeding_baby": "unicode/1f9d1-1f37c.png?v8",
      "person_fencing": "unicode/1f93a.png?v8",
      "person_in_manual_wheelchair": "unicode/1f9d1-1f9bd.png?v8",
      "person_in_motorized_wheelchair": "unicode/1f9d1-1f9bc.png?v8",
      "person_in_tuxedo": "unicode/1f935.png?v8",
      "person_red_hair": "unicode/1f9d1-1f9b0.png?v8",
      "person_white_hair": "unicode/1f9d1-1f9b3.png?v8",
      "person_with_probing_cane": "unicode/1f9d1-1f9af.png?v8",
      "person_with_turban": "unicode/1f473.png?v8",
      "person_with_veil": "unicode/1f470.png?v8",
      "peru": "unicode/1f1f5-1f1ea.png?v8",
      "petri_dish": "unicode/1f9eb.png?v8",
      "philippines": "unicode/1f1f5-1f1ed.png?v8",
      "phone": "unicode/260e.png?v8",
      "pick": "unicode/26cf.png?v8",
      "pickup_truck": "unicode/1f6fb.png?v8",
      "pie": "unicode/1f967.png?v8",
      "pig": "unicode/1f437.png?v8",
      "pig2": "unicode/1f416.png?v8",
      "pig_nose": "unicode/1f43d.png?v8",
      "pill": "unicode/1f48a.png?v8",
      "pilot": "unicode/1f9d1-2708.png?v8",
      "pinata": "unicode/1fa85.png?v8",
      "pinched_fingers": "unicode/1f90c.png?v8",
      "pinching_hand": "unicode/1f90f.png?v8",
      "pineapple": "unicode/1f34d.png?v8",
      "ping_pong": "unicode/1f3d3.png?v8",
      "pirate_flag": "unicode/1f3f4-2620.png?v8",
      "pisces": "unicode/2653.png?v8",
      "pitcairn_islands": "unicode/1f1f5-1f1f3.png?v8",
      "pizza": "unicode/1f355.png?v8",
      "placard": "unicode/1faa7.png?v8",
      "place_of_worship": "unicode/1f6d0.png?v8",
      "plate_with_cutlery": "unicode/1f37d.png?v8",
      "play_or_pause_button": "unicode/23ef.png?v8",
      "pleading_face": "unicode/1f97a.png?v8",
      "plunger": "unicode/1faa0.png?v8",
      "point_down": "unicode/1f447.png?v8",
      "point_left": "unicode/1f448.png?v8",
      "point_right": "unicode/1f449.png?v8",
      "point_up": "unicode/261d.png?v8",
      "point_up_2": "unicode/1f446.png?v8",
      "poland": "unicode/1f1f5-1f1f1.png?v8",
      "polar_bear": "unicode/1f43b-2744.png?v8",
      "police_car": "unicode/1f693.png?v8",
      "police_officer": "unicode/1f46e.png?v8",
      "policeman": "unicode/1f46e-2642.png?v8",
      "policewoman": "unicode/1f46e-2640.png?v8",
      "poodle": "unicode/1f429.png?v8",
      "poop": "unicode/1f4a9.png?v8",
      "popcorn": "unicode/1f37f.png?v8",
      "portugal": "unicode/1f1f5-1f1f9.png?v8",
      "post_office": "unicode/1f3e3.png?v8",
      "postal_horn": "unicode/1f4ef.png?v8",
      "postbox": "unicode/1f4ee.png?v8",
      "potable_water": "unicode/1f6b0.png?v8",
      "potato": "unicode/1f954.png?v8",
      "potted_plant": "unicode/1fab4.png?v8",
      "pouch": "unicode/1f45d.png?v8",
      "poultry_leg": "unicode/1f357.png?v8",
      "pound": "unicode/1f4b7.png?v8",
      "pout": "unicode/1f621.png?v8",
      "pouting_cat": "unicode/1f63e.png?v8",
      "pouting_face": "unicode/1f64e.png?v8",
      "pouting_man": "unicode/1f64e-2642.png?v8",
      "pouting_woman": "unicode/1f64e-2640.png?v8",
      "pray": "unicode/1f64f.png?v8",
      "prayer_beads": "unicode/1f4ff.png?v8",
      "pregnant_woman": "unicode/1f930.png?v8",
      "pretzel": "unicode/1f968.png?v8",
      "previous_track_button": "unicode/23ee.png?v8",
      "prince": "unicode/1f934.png?v8",
      "princess": "unicode/1f478.png?v8",
      "printer": "unicode/1f5a8.png?v8",
      "probing_cane": "unicode/1f9af.png?v8",
      "puerto_rico": "unicode/1f1f5-1f1f7.png?v8",
      "punch": "unicode/1f44a.png?v8",
      "purple_circle": "unicode/1f7e3.png?v8",
      "purple_heart": "unicode/1f49c.png?v8",
      "purple_square": "unicode/1f7ea.png?v8",
      "purse": "unicode/1f45b.png?v8",
      "pushpin": "unicode/1f4cc.png?v8",
      "put_litter_in_its_place": "unicode/1f6ae.png?v8",
      "qatar": "unicode/1f1f6-1f1e6.png?v8",
      "question": "unicode/2753.png?v8",
      "rabbit": "unicode/1f430.png?v8",
      "rabbit2": "unicode/1f407.png?v8",
      "raccoon": "unicode/1f99d.png?v8",
      "racehorse": "unicode/1f40e.png?v8",
      "racing_car": "unicode/1f3ce.png?v8",
      "radio": "unicode/1f4fb.png?v8",
      "radio_button": "unicode/1f518.png?v8",
      "radioactive": "unicode/2622.png?v8",
      "rage": "unicode/1f621.png?v8",
      "rage1": "rage1.png?v8",
      "rage2": "rage2.png?v8",
      "rage3": "rage3.png?v8",
      "rage4": "rage4.png?v8",
      "railway_car": "unicode/1f683.png?v8",
      "railway_track": "unicode/1f6e4.png?v8",
      "rainbow": "unicode/1f308.png?v8",
      "rainbow_flag": "unicode/1f3f3-1f308.png?v8",
      "raised_back_of_hand": "unicode/1f91a.png?v8",
      "raised_eyebrow": "unicode/1f928.png?v8",
      "raised_hand": "unicode/270b.png?v8",
      "raised_hand_with_fingers_splayed": "unicode/1f590.png?v8",
      "raised_hands": "unicode/1f64c.png?v8",
      "raising_hand": "unicode/1f64b.png?v8",
      "raising_hand_man": "unicode/1f64b-2642.png?v8",
      "raising_hand_woman": "unicode/1f64b-2640.png?v8",
      "ram": "unicode/1f40f.png?v8",
      "ramen": "unicode/1f35c.png?v8",
      "rat": "unicode/1f400.png?v8",
      "razor": "unicode/1fa92.png?v8",
      "receipt": "unicode/1f9fe.png?v8",
      "record_button": "unicode/23fa.png?v8",
      "recycle": "unicode/267b.png?v8",
      "red_car": "unicode/1f697.png?v8",
      "red_circle": "unicode/1f534.png?v8",
      "red_envelope": "unicode/1f9e7.png?v8",
      "red_haired_man": "unicode/1f468-1f9b0.png?v8",
      "red_haired_woman": "unicode/1f469-1f9b0.png?v8",
      "red_square": "unicode/1f7e5.png?v8",
      "registered": "unicode/00ae.png?v8",
      "relaxed": "unicode/263a.png?v8",
      "relieved": "unicode/1f60c.png?v8",
      "reminder_ribbon": "unicode/1f397.png?v8",
      "repeat": "unicode/1f501.png?v8",
      "repeat_one": "unicode/1f502.png?v8",
      "rescue_worker_helmet": "unicode/26d1.png?v8",
      "restroom": "unicode/1f6bb.png?v8",
      "reunion": "unicode/1f1f7-1f1ea.png?v8",
      "revolving_hearts": "unicode/1f49e.png?v8",
      "rewind": "unicode/23ea.png?v8",
      "rhinoceros": "unicode/1f98f.png?v8",
      "ribbon": "unicode/1f380.png?v8",
      "rice": "unicode/1f35a.png?v8",
      "rice_ball": "unicode/1f359.png?v8",
      "rice_cracker": "unicode/1f358.png?v8",
      "rice_scene": "unicode/1f391.png?v8",
      "right_anger_bubble": "unicode/1f5ef.png?v8",
      "ring": "unicode/1f48d.png?v8",
      "ringed_planet": "unicode/1fa90.png?v8",
      "robot": "unicode/1f916.png?v8",
      "rock": "unicode/1faa8.png?v8",
      "rocket": "unicode/1f680.png?v8",
      "rofl": "unicode/1f923.png?v8",
      "roll_eyes": "unicode/1f644.png?v8",
      "roll_of_paper": "unicode/1f9fb.png?v8",
      "roller_coaster": "unicode/1f3a2.png?v8",
      "roller_skate": "unicode/1f6fc.png?v8",
      "romania": "unicode/1f1f7-1f1f4.png?v8",
      "rooster": "unicode/1f413.png?v8",
      "rose": "unicode/1f339.png?v8",
      "rosette": "unicode/1f3f5.png?v8",
      "rotating_light": "unicode/1f6a8.png?v8",
      "round_pushpin": "unicode/1f4cd.png?v8",
      "rowboat": "unicode/1f6a3.png?v8",
      "rowing_man": "unicode/1f6a3-2642.png?v8",
      "rowing_woman": "unicode/1f6a3-2640.png?v8",
      "ru": "unicode/1f1f7-1f1fa.png?v8",
      "rugby_football": "unicode/1f3c9.png?v8",
      "runner": "unicode/1f3c3.png?v8",
      "running": "unicode/1f3c3.png?v8",
      "running_man": "unicode/1f3c3-2642.png?v8",
      "running_shirt_with_sash": "unicode/1f3bd.png?v8",
      "running_woman": "unicode/1f3c3-2640.png?v8",
      "rwanda": "unicode/1f1f7-1f1fc.png?v8",
      "sa": "unicode/1f202.png?v8",
      "safety_pin": "unicode/1f9f7.png?v8",
      "safety_vest": "unicode/1f9ba.png?v8",
      "sagittarius": "unicode/2650.png?v8",
      "sailboat": "unicode/26f5.png?v8",
      "sake": "unicode/1f376.png?v8",
      "salt": "unicode/1f9c2.png?v8",
      "samoa": "unicode/1f1fc-1f1f8.png?v8",
      "san_marino": "unicode/1f1f8-1f1f2.png?v8",
      "sandal": "unicode/1f461.png?v8",
      "sandwich": "unicode/1f96a.png?v8",
      "santa": "unicode/1f385.png?v8",
      "sao_tome_principe": "unicode/1f1f8-1f1f9.png?v8",
      "sari": "unicode/1f97b.png?v8",
      "sassy_man": "unicode/1f481-2642.png?v8",
      "sassy_woman": "unicode/1f481-2640.png?v8",
      "satellite": "unicode/1f4e1.png?v8",
      "satisfied": "unicode/1f606.png?v8",
      "saudi_arabia": "unicode/1f1f8-1f1e6.png?v8",
      "sauna_man": "unicode/1f9d6-2642.png?v8",
      "sauna_person": "unicode/1f9d6.png?v8",
      "sauna_woman": "unicode/1f9d6-2640.png?v8",
      "sauropod": "unicode/1f995.png?v8",
      "saxophone": "unicode/1f3b7.png?v8",
      "scarf": "unicode/1f9e3.png?v8",
      "school": "unicode/1f3eb.png?v8",
      "school_satchel": "unicode/1f392.png?v8",
      "scientist": "unicode/1f9d1-1f52c.png?v8",
      "scissors": "unicode/2702.png?v8",
      "scorpion": "unicode/1f982.png?v8",
      "scorpius": "unicode/264f.png?v8",
      "scotland": "unicode/1f3f4-e0067-e0062-e0073-e0063-e0074-e007f.png?v8",
      "scream": "unicode/1f631.png?v8",
      "scream_cat": "unicode/1f640.png?v8",
      "screwdriver": "unicode/1fa9b.png?v8",
      "scroll": "unicode/1f4dc.png?v8",
      "seal": "unicode/1f9ad.png?v8",
      "seat": "unicode/1f4ba.png?v8",
      "secret": "unicode/3299.png?v8",
      "see_no_evil": "unicode/1f648.png?v8",
      "seedling": "unicode/1f331.png?v8",
      "selfie": "unicode/1f933.png?v8",
      "senegal": "unicode/1f1f8-1f1f3.png?v8",
      "serbia": "unicode/1f1f7-1f1f8.png?v8",
      "service_dog": "unicode/1f415-1f9ba.png?v8",
      "seven": "unicode/0037-20e3.png?v8",
      "sewing_needle": "unicode/1faa1.png?v8",
      "seychelles": "unicode/1f1f8-1f1e8.png?v8",
      "shallow_pan_of_food": "unicode/1f958.png?v8",
      "shamrock": "unicode/2618.png?v8",
      "shark": "unicode/1f988.png?v8",
      "shaved_ice": "unicode/1f367.png?v8",
      "sheep": "unicode/1f411.png?v8",
      "shell": "unicode/1f41a.png?v8",
      "shield": "unicode/1f6e1.png?v8",
      "shinto_shrine": "unicode/26e9.png?v8",
      "ship": "unicode/1f6a2.png?v8",
      "shipit": "shipit.png?v8",
      "shirt": "unicode/1f455.png?v8",
      "shit": "unicode/1f4a9.png?v8",
      "shoe": "unicode/1f45e.png?v8",
      "shopping": "unicode/1f6cd.png?v8",
      "shopping_cart": "unicode/1f6d2.png?v8",
      "shorts": "unicode/1fa73.png?v8",
      "shower": "unicode/1f6bf.png?v8",
      "shrimp": "unicode/1f990.png?v8",
      "shrug": "unicode/1f937.png?v8",
      "shushing_face": "unicode/1f92b.png?v8",
      "sierra_leone": "unicode/1f1f8-1f1f1.png?v8",
      "signal_strength": "unicode/1f4f6.png?v8",
      "singapore": "unicode/1f1f8-1f1ec.png?v8",
      "singer": "unicode/1f9d1-1f3a4.png?v8",
      "sint_maarten": "unicode/1f1f8-1f1fd.png?v8",
      "six": "unicode/0036-20e3.png?v8",
      "six_pointed_star": "unicode/1f52f.png?v8",
      "skateboard": "unicode/1f6f9.png?v8",
      "ski": "unicode/1f3bf.png?v8",
      "skier": "unicode/26f7.png?v8",
      "skull": "unicode/1f480.png?v8",
      "skull_and_crossbones": "unicode/2620.png?v8",
      "skunk": "unicode/1f9a8.png?v8",
      "sled": "unicode/1f6f7.png?v8",
      "sleeping": "unicode/1f634.png?v8",
      "sleeping_bed": "unicode/1f6cc.png?v8",
      "sleepy": "unicode/1f62a.png?v8",
      "slightly_frowning_face": "unicode/1f641.png?v8",
      "slightly_smiling_face": "unicode/1f642.png?v8",
      "slot_machine": "unicode/1f3b0.png?v8",
      "sloth": "unicode/1f9a5.png?v8",
      "slovakia": "unicode/1f1f8-1f1f0.png?v8",
      "slovenia": "unicode/1f1f8-1f1ee.png?v8",
      "small_airplane": "unicode/1f6e9.png?v8",
      "small_blue_diamond": "unicode/1f539.png?v8",
      "small_orange_diamond": "unicode/1f538.png?v8",
      "small_red_triangle": "unicode/1f53a.png?v8",
      "small_red_triangle_down": "unicode/1f53b.png?v8",
      "smile": "unicode/1f604.png?v8",
      "smile_cat": "unicode/1f638.png?v8",
      "smiley": "unicode/1f603.png?v8",
      "smiley_cat": "unicode/1f63a.png?v8",
      "smiling_face_with_tear": "unicode/1f972.png?v8",
      "smiling_face_with_three_hearts": "unicode/1f970.png?v8",
      "smiling_imp": "unicode/1f608.png?v8",
      "smirk": "unicode/1f60f.png?v8",
      "smirk_cat": "unicode/1f63c.png?v8",
      "smoking": "unicode/1f6ac.png?v8",
      "snail": "unicode/1f40c.png?v8",
      "snake": "unicode/1f40d.png?v8",
      "sneezing_face": "unicode/1f927.png?v8",
      "snowboarder": "unicode/1f3c2.png?v8",
      "snowflake": "unicode/2744.png?v8",
      "snowman": "unicode/26c4.png?v8",
      "snowman_with_snow": "unicode/2603.png?v8",
      "soap": "unicode/1f9fc.png?v8",
      "sob": "unicode/1f62d.png?v8",
      "soccer": "unicode/26bd.png?v8",
      "socks": "unicode/1f9e6.png?v8",
      "softball": "unicode/1f94e.png?v8",
      "solomon_islands": "unicode/1f1f8-1f1e7.png?v8",
      "somalia": "unicode/1f1f8-1f1f4.png?v8",
      "soon": "unicode/1f51c.png?v8",
      "sos": "unicode/1f198.png?v8",
      "sound": "unicode/1f509.png?v8",
      "south_africa": "unicode/1f1ff-1f1e6.png?v8",
      "south_georgia_south_sandwich_islands": "unicode/1f1ec-1f1f8.png?v8",
      "south_sudan": "unicode/1f1f8-1f1f8.png?v8",
      "space_invader": "unicode/1f47e.png?v8",
      "spades": "unicode/2660.png?v8",
      "spaghetti": "unicode/1f35d.png?v8",
      "sparkle": "unicode/2747.png?v8",
      "sparkler": "unicode/1f387.png?v8",
      "sparkles": "unicode/2728.png?v8",
      "sparkling_heart": "unicode/1f496.png?v8",
      "speak_no_evil": "unicode/1f64a.png?v8",
      "speaker": "unicode/1f508.png?v8",
      "speaking_head": "unicode/1f5e3.png?v8",
      "speech_balloon": "unicode/1f4ac.png?v8",
      "speedboat": "unicode/1f6a4.png?v8",
      "spider": "unicode/1f577.png?v8",
      "spider_web": "unicode/1f578.png?v8",
      "spiral_calendar": "unicode/1f5d3.png?v8",
      "spiral_notepad": "unicode/1f5d2.png?v8",
      "sponge": "unicode/1f9fd.png?v8",
      "spoon": "unicode/1f944.png?v8",
      "squid": "unicode/1f991.png?v8",
      "sri_lanka": "unicode/1f1f1-1f1f0.png?v8",
      "st_barthelemy": "unicode/1f1e7-1f1f1.png?v8",
      "st_helena": "unicode/1f1f8-1f1ed.png?v8",
      "st_kitts_nevis": "unicode/1f1f0-1f1f3.png?v8",
      "st_lucia": "unicode/1f1f1-1f1e8.png?v8",
      "st_martin": "unicode/1f1f2-1f1eb.png?v8",
      "st_pierre_miquelon": "unicode/1f1f5-1f1f2.png?v8",
      "st_vincent_grenadines": "unicode/1f1fb-1f1e8.png?v8",
      "stadium": "unicode/1f3df.png?v8",
      "standing_man": "unicode/1f9cd-2642.png?v8",
      "standing_person": "unicode/1f9cd.png?v8",
      "standing_woman": "unicode/1f9cd-2640.png?v8",
      "star": "unicode/2b50.png?v8",
      "star2": "unicode/1f31f.png?v8",
      "star_and_crescent": "unicode/262a.png?v8",
      "star_of_david": "unicode/2721.png?v8",
      "star_struck": "unicode/1f929.png?v8",
      "stars": "unicode/1f320.png?v8",
      "station": "unicode/1f689.png?v8",
      "statue_of_liberty": "unicode/1f5fd.png?v8",
      "steam_locomotive": "unicode/1f682.png?v8",
      "stethoscope": "unicode/1fa7a.png?v8",
      "stew": "unicode/1f372.png?v8",
      "stop_button": "unicode/23f9.png?v8",
      "stop_sign": "unicode/1f6d1.png?v8",
      "stopwatch": "unicode/23f1.png?v8",
      "straight_ruler": "unicode/1f4cf.png?v8",
      "strawberry": "unicode/1f353.png?v8",
      "stuck_out_tongue": "unicode/1f61b.png?v8",
      "stuck_out_tongue_closed_eyes": "unicode/1f61d.png?v8",
      "stuck_out_tongue_winking_eye": "unicode/1f61c.png?v8",
      "student": "unicode/1f9d1-1f393.png?v8",
      "studio_microphone": "unicode/1f399.png?v8",
      "stuffed_flatbread": "unicode/1f959.png?v8",
      "sudan": "unicode/1f1f8-1f1e9.png?v8",
      "sun_behind_large_cloud": "unicode/1f325.png?v8",
      "sun_behind_rain_cloud": "unicode/1f326.png?v8",
      "sun_behind_small_cloud": "unicode/1f324.png?v8",
      "sun_with_face": "unicode/1f31e.png?v8",
      "sunflower": "unicode/1f33b.png?v8",
      "sunglasses": "unicode/1f60e.png?v8",
      "sunny": "unicode/2600.png?v8",
      "sunrise": "unicode/1f305.png?v8",
      "sunrise_over_mountains": "unicode/1f304.png?v8",
      "superhero": "unicode/1f9b8.png?v8",
      "superhero_man": "unicode/1f9b8-2642.png?v8",
      "superhero_woman": "unicode/1f9b8-2640.png?v8",
      "supervillain": "unicode/1f9b9.png?v8",
      "supervillain_man": "unicode/1f9b9-2642.png?v8",
      "supervillain_woman": "unicode/1f9b9-2640.png?v8",
      "surfer": "unicode/1f3c4.png?v8",
      "surfing_man": "unicode/1f3c4-2642.png?v8",
      "surfing_woman": "unicode/1f3c4-2640.png?v8",
      "suriname": "unicode/1f1f8-1f1f7.png?v8",
      "sushi": "unicode/1f363.png?v8",
      "suspect": "suspect.png?v8",
      "suspension_railway": "unicode/1f69f.png?v8",
      "svalbard_jan_mayen": "unicode/1f1f8-1f1ef.png?v8",
      "swan": "unicode/1f9a2.png?v8",
      "swaziland": "unicode/1f1f8-1f1ff.png?v8",
      "sweat": "unicode/1f613.png?v8",
      "sweat_drops": "unicode/1f4a6.png?v8",
      "sweat_smile": "unicode/1f605.png?v8",
      "sweden": "unicode/1f1f8-1f1ea.png?v8",
      "sweet_potato": "unicode/1f360.png?v8",
      "swim_brief": "unicode/1fa72.png?v8",
      "swimmer": "unicode/1f3ca.png?v8",
      "swimming_man": "unicode/1f3ca-2642.png?v8",
      "swimming_woman": "unicode/1f3ca-2640.png?v8",
      "switzerland": "unicode/1f1e8-1f1ed.png?v8",
      "symbols": "unicode/1f523.png?v8",
      "synagogue": "unicode/1f54d.png?v8",
      "syria": "unicode/1f1f8-1f1fe.png?v8",
      "syringe": "unicode/1f489.png?v8",
      "t-rex": "unicode/1f996.png?v8",
      "taco": "unicode/1f32e.png?v8",
      "tada": "unicode/1f389.png?v8",
      "taiwan": "unicode/1f1f9-1f1fc.png?v8",
      "tajikistan": "unicode/1f1f9-1f1ef.png?v8",
      "takeout_box": "unicode/1f961.png?v8",
      "tamale": "unicode/1fad4.png?v8",
      "tanabata_tree": "unicode/1f38b.png?v8",
      "tangerine": "unicode/1f34a.png?v8",
      "tanzania": "unicode/1f1f9-1f1ff.png?v8",
      "taurus": "unicode/2649.png?v8",
      "taxi": "unicode/1f695.png?v8",
      "tea": "unicode/1f375.png?v8",
      "teacher": "unicode/1f9d1-1f3eb.png?v8",
      "teapot": "unicode/1fad6.png?v8",
      "technologist": "unicode/1f9d1-1f4bb.png?v8",
      "teddy_bear": "unicode/1f9f8.png?v8",
      "telephone": "unicode/260e.png?v8",
      "telephone_receiver": "unicode/1f4de.png?v8",
      "telescope": "unicode/1f52d.png?v8",
      "tennis": "unicode/1f3be.png?v8",
      "tent": "unicode/26fa.png?v8",
      "test_tube": "unicode/1f9ea.png?v8",
      "thailand": "unicode/1f1f9-1f1ed.png?v8",
      "thermometer": "unicode/1f321.png?v8",
      "thinking": "unicode/1f914.png?v8",
      "thong_sandal": "unicode/1fa74.png?v8",
      "thought_balloon": "unicode/1f4ad.png?v8",
      "thread": "unicode/1f9f5.png?v8",
      "three": "unicode/0033-20e3.png?v8",
      "thumbsdown": "unicode/1f44e.png?v8",
      "thumbsup": "unicode/1f44d.png?v8",
      "ticket": "unicode/1f3ab.png?v8",
      "tickets": "unicode/1f39f.png?v8",
      "tiger": "unicode/1f42f.png?v8",
      "tiger2": "unicode/1f405.png?v8",
      "timer_clock": "unicode/23f2.png?v8",
      "timor_leste": "unicode/1f1f9-1f1f1.png?v8",
      "tipping_hand_man": "unicode/1f481-2642.png?v8",
      "tipping_hand_person": "unicode/1f481.png?v8",
      "tipping_hand_woman": "unicode/1f481-2640.png?v8",
      "tired_face": "unicode/1f62b.png?v8",
      "tm": "unicode/2122.png?v8",
      "togo": "unicode/1f1f9-1f1ec.png?v8",
      "toilet": "unicode/1f6bd.png?v8",
      "tokelau": "unicode/1f1f9-1f1f0.png?v8",
      "tokyo_tower": "unicode/1f5fc.png?v8",
      "tomato": "unicode/1f345.png?v8",
      "tonga": "unicode/1f1f9-1f1f4.png?v8",
      "tongue": "unicode/1f445.png?v8",
      "toolbox": "unicode/1f9f0.png?v8",
      "tooth": "unicode/1f9b7.png?v8",
      "toothbrush": "unicode/1faa5.png?v8",
      "top": "unicode/1f51d.png?v8",
      "tophat": "unicode/1f3a9.png?v8",
      "tornado": "unicode/1f32a.png?v8",
      "tr": "unicode/1f1f9-1f1f7.png?v8",
      "trackball": "unicode/1f5b2.png?v8",
      "tractor": "unicode/1f69c.png?v8",
      "traffic_light": "unicode/1f6a5.png?v8",
      "train": "unicode/1f68b.png?v8",
      "train2": "unicode/1f686.png?v8",
      "tram": "unicode/1f68a.png?v8",
      "transgender_flag": "unicode/1f3f3-26a7.png?v8",
      "transgender_symbol": "unicode/26a7.png?v8",
      "triangular_flag_on_post": "unicode/1f6a9.png?v8",
      "triangular_ruler": "unicode/1f4d0.png?v8",
      "trident": "unicode/1f531.png?v8",
      "trinidad_tobago": "unicode/1f1f9-1f1f9.png?v8",
      "tristan_da_cunha": "unicode/1f1f9-1f1e6.png?v8",
      "triumph": "unicode/1f624.png?v8",
      "trolleybus": "unicode/1f68e.png?v8",
      "trollface": "trollface.png?v8",
      "trophy": "unicode/1f3c6.png?v8",
      "tropical_drink": "unicode/1f379.png?v8",
      "tropical_fish": "unicode/1f420.png?v8",
      "truck": "unicode/1f69a.png?v8",
      "trumpet": "unicode/1f3ba.png?v8",
      "tshirt": "unicode/1f455.png?v8",
      "tulip": "unicode/1f337.png?v8",
      "tumbler_glass": "unicode/1f943.png?v8",
      "tunisia": "unicode/1f1f9-1f1f3.png?v8",
      "turkey": "unicode/1f983.png?v8",
      "turkmenistan": "unicode/1f1f9-1f1f2.png?v8",
      "turks_caicos_islands": "unicode/1f1f9-1f1e8.png?v8",
      "turtle": "unicode/1f422.png?v8",
      "tuvalu": "unicode/1f1f9-1f1fb.png?v8",
      "tv": "unicode/1f4fa.png?v8",
      "twisted_rightwards_arrows": "unicode/1f500.png?v8",
      "two": "unicode/0032-20e3.png?v8",
      "two_hearts": "unicode/1f495.png?v8",
      "two_men_holding_hands": "unicode/1f46c.png?v8",
      "two_women_holding_hands": "unicode/1f46d.png?v8",
      "u5272": "unicode/1f239.png?v8",
      "u5408": "unicode/1f234.png?v8",
      "u55b6": "unicode/1f23a.png?v8",
      "u6307": "unicode/1f22f.png?v8",
      "u6708": "unicode/1f237.png?v8",
      "u6709": "unicode/1f236.png?v8",
      "u6e80": "unicode/1f235.png?v8",
      "u7121": "unicode/1f21a.png?v8",
      "u7533": "unicode/1f238.png?v8",
      "u7981": "unicode/1f232.png?v8",
      "u7a7a": "unicode/1f233.png?v8",
      "uganda": "unicode/1f1fa-1f1ec.png?v8",
      "uk": "unicode/1f1ec-1f1e7.png?v8",
      "ukraine": "unicode/1f1fa-1f1e6.png?v8",
      "umbrella": "unicode/2614.png?v8",
      "unamused": "unicode/1f612.png?v8",
      "underage": "unicode/1f51e.png?v8",
      "unicorn": "unicode/1f984.png?v8",
      "united_arab_emirates": "unicode/1f1e6-1f1ea.png?v8",
      "united_nations": "unicode/1f1fa-1f1f3.png?v8",
      "unlock": "unicode/1f513.png?v8",
      "up": "unicode/1f199.png?v8",
      "upside_down_face": "unicode/1f643.png?v8",
      "uruguay": "unicode/1f1fa-1f1fe.png?v8",
      "us": "unicode/1f1fa-1f1f8.png?v8",
      "us_outlying_islands": "unicode/1f1fa-1f1f2.png?v8",
      "us_virgin_islands": "unicode/1f1fb-1f1ee.png?v8",
      "uzbekistan": "unicode/1f1fa-1f1ff.png?v8",
      "v": "unicode/270c.png?v8",
      "vampire": "unicode/1f9db.png?v8",
      "vampire_man": "unicode/1f9db-2642.png?v8",
      "vampire_woman": "unicode/1f9db-2640.png?v8",
      "vanuatu": "unicode/1f1fb-1f1fa.png?v8",
      "vatican_city": "unicode/1f1fb-1f1e6.png?v8",
      "venezuela": "unicode/1f1fb-1f1ea.png?v8",
      "vertical_traffic_light": "unicode/1f6a6.png?v8",
      "vhs": "unicode/1f4fc.png?v8",
      "vibration_mode": "unicode/1f4f3.png?v8",
      "video_camera": "unicode/1f4f9.png?v8",
      "video_game": "unicode/1f3ae.png?v8",
      "vietnam": "unicode/1f1fb-1f1f3.png?v8",
      "violin": "unicode/1f3bb.png?v8",
      "virgo": "unicode/264d.png?v8",
      "volcano": "unicode/1f30b.png?v8",
      "volleyball": "unicode/1f3d0.png?v8",
      "vomiting_face": "unicode/1f92e.png?v8",
      "vs": "unicode/1f19a.png?v8",
      "vulcan_salute": "unicode/1f596.png?v8",
      "waffle": "unicode/1f9c7.png?v8",
      "wales": "unicode/1f3f4-e0067-e0062-e0077-e006c-e0073-e007f.png?v8",
      "walking": "unicode/1f6b6.png?v8",
      "walking_man": "unicode/1f6b6-2642.png?v8",
      "walking_woman": "unicode/1f6b6-2640.png?v8",
      "wallis_futuna": "unicode/1f1fc-1f1eb.png?v8",
      "waning_crescent_moon": "unicode/1f318.png?v8",
      "waning_gibbous_moon": "unicode/1f316.png?v8",
      "warning": "unicode/26a0.png?v8",
      "wastebasket": "unicode/1f5d1.png?v8",
      "watch": "unicode/231a.png?v8",
      "water_buffalo": "unicode/1f403.png?v8",
      "water_polo": "unicode/1f93d.png?v8",
      "watermelon": "unicode/1f349.png?v8",
      "wave": "unicode/1f44b.png?v8",
      "wavy_dash": "unicode/3030.png?v8",
      "waxing_crescent_moon": "unicode/1f312.png?v8",
      "waxing_gibbous_moon": "unicode/1f314.png?v8",
      "wc": "unicode/1f6be.png?v8",
      "weary": "unicode/1f629.png?v8",
      "wedding": "unicode/1f492.png?v8",
      "weight_lifting": "unicode/1f3cb.png?v8",
      "weight_lifting_man": "unicode/1f3cb-2642.png?v8",
      "weight_lifting_woman": "unicode/1f3cb-2640.png?v8",
      "western_sahara": "unicode/1f1ea-1f1ed.png?v8",
      "whale": "unicode/1f433.png?v8",
      "whale2": "unicode/1f40b.png?v8",
      "wheel_of_dharma": "unicode/2638.png?v8",
      "wheelchair": "unicode/267f.png?v8",
      "white_check_mark": "unicode/2705.png?v8",
      "white_circle": "unicode/26aa.png?v8",
      "white_flag": "unicode/1f3f3.png?v8",
      "white_flower": "unicode/1f4ae.png?v8",
      "white_haired_man": "unicode/1f468-1f9b3.png?v8",
      "white_haired_woman": "unicode/1f469-1f9b3.png?v8",
      "white_heart": "unicode/1f90d.png?v8",
      "white_large_square": "unicode/2b1c.png?v8",
      "white_medium_small_square": "unicode/25fd.png?v8",
      "white_medium_square": "unicode/25fb.png?v8",
      "white_small_square": "unicode/25ab.png?v8",
      "white_square_button": "unicode/1f533.png?v8",
      "wilted_flower": "unicode/1f940.png?v8",
      "wind_chime": "unicode/1f390.png?v8",
      "wind_face": "unicode/1f32c.png?v8",
      "window": "unicode/1fa9f.png?v8",
      "wine_glass": "unicode/1f377.png?v8",
      "wink": "unicode/1f609.png?v8",
      "wolf": "unicode/1f43a.png?v8",
      "woman": "unicode/1f469.png?v8",
      "woman_artist": "unicode/1f469-1f3a8.png?v8",
      "woman_astronaut": "unicode/1f469-1f680.png?v8",
      "woman_beard": "unicode/1f9d4-2640.png?v8",
      "woman_cartwheeling": "unicode/1f938-2640.png?v8",
      "woman_cook": "unicode/1f469-1f373.png?v8",
      "woman_dancing": "unicode/1f483.png?v8",
      "woman_facepalming": "unicode/1f926-2640.png?v8",
      "woman_factory_worker": "unicode/1f469-1f3ed.png?v8",
      "woman_farmer": "unicode/1f469-1f33e.png?v8",
      "woman_feeding_baby": "unicode/1f469-1f37c.png?v8",
      "woman_firefighter": "unicode/1f469-1f692.png?v8",
      "woman_health_worker": "unicode/1f469-2695.png?v8",
      "woman_in_manual_wheelchair": "unicode/1f469-1f9bd.png?v8",
      "woman_in_motorized_wheelchair": "unicode/1f469-1f9bc.png?v8",
      "woman_in_tuxedo": "unicode/1f935-2640.png?v8",
      "woman_judge": "unicode/1f469-2696.png?v8",
      "woman_juggling": "unicode/1f939-2640.png?v8",
      "woman_mechanic": "unicode/1f469-1f527.png?v8",
      "woman_office_worker": "unicode/1f469-1f4bc.png?v8",
      "woman_pilot": "unicode/1f469-2708.png?v8",
      "woman_playing_handball": "unicode/1f93e-2640.png?v8",
      "woman_playing_water_polo": "unicode/1f93d-2640.png?v8",
      "woman_scientist": "unicode/1f469-1f52c.png?v8",
      "woman_shrugging": "unicode/1f937-2640.png?v8",
      "woman_singer": "unicode/1f469-1f3a4.png?v8",
      "woman_student": "unicode/1f469-1f393.png?v8",
      "woman_teacher": "unicode/1f469-1f3eb.png?v8",
      "woman_technologist": "unicode/1f469-1f4bb.png?v8",
      "woman_with_headscarf": "unicode/1f9d5.png?v8",
      "woman_with_probing_cane": "unicode/1f469-1f9af.png?v8",
      "woman_with_turban": "unicode/1f473-2640.png?v8",
      "woman_with_veil": "unicode/1f470-2640.png?v8",
      "womans_clothes": "unicode/1f45a.png?v8",
      "womans_hat": "unicode/1f452.png?v8",
      "women_wrestling": "unicode/1f93c-2640.png?v8",
      "womens": "unicode/1f6ba.png?v8",
      "wood": "unicode/1fab5.png?v8",
      "woozy_face": "unicode/1f974.png?v8",
      "world_map": "unicode/1f5fa.png?v8",
      "worm": "unicode/1fab1.png?v8",
      "worried": "unicode/1f61f.png?v8",
      "wrench": "unicode/1f527.png?v8",
      "wrestling": "unicode/1f93c.png?v8",
      "writing_hand": "unicode/270d.png?v8",
      "x": "unicode/274c.png?v8",
      "yarn": "unicode/1f9f6.png?v8",
      "yawning_face": "unicode/1f971.png?v8",
      "yellow_circle": "unicode/1f7e1.png?v8",
      "yellow_heart": "unicode/1f49b.png?v8",
      "yellow_square": "unicode/1f7e8.png?v8",
      "yemen": "unicode/1f1fe-1f1ea.png?v8",
      "yen": "unicode/1f4b4.png?v8",
      "yin_yang": "unicode/262f.png?v8",
      "yo_yo": "unicode/1fa80.png?v8",
      "yum": "unicode/1f60b.png?v8",
      "zambia": "unicode/1f1ff-1f1f2.png?v8",
      "zany_face": "unicode/1f92a.png?v8",
      "zap": "unicode/26a1.png?v8",
      "zebra": "unicode/1f993.png?v8",
      "zero": "unicode/0030-20e3.png?v8",
      "zimbabwe": "unicode/1f1ff-1f1fc.png?v8",
      "zipper_mouth_face": "unicode/1f910.png?v8",
      "zombie": "unicode/1f9df.png?v8",
      "zombie_man": "unicode/1f9df-2642.png?v8",
      "zombie_woman": "unicode/1f9df-2640.png?v8",
      "zzz": "unicode/1f4a4.png?v8"
    }
  };

  function replaceEmojiShorthand(m, $1, useNativeEmoji) {
    var emojiMatch = emojiData.data[$1];

    var result = m;

    if (emojiMatch) {
      if (useNativeEmoji && /unicode/.test(emojiMatch)) {
        var emojiUnicode = emojiMatch
          .replace('unicode/', '')
          .replace(/\.png.*/, '')
          .split('-')
          .map(function (u) { return ("&#x" + u + ";"); })
          // Separate multi-character emoji with zero width joiner sequence (ZWJ)
          // Hat tip: https://about.gitlab.com/blog/2018/05/30/journey-in-native-unicode-emoji/#emoji-made-up-of-multiple-characters
          .join('&zwj;')
          .concat('&#xFE0E;');
        result = "<span class=\"emoji\">" + emojiUnicode + "</span>";
      } else {
        result = "<img src=\"" + (emojiData.baseURL) + emojiMatch + ".png\" alt=\"" + $1 + "\" class=\"emoji\" loading=\"lazy\">";
      }
    }

    return result;
  }

  function emojify(text, useNativeEmoji) {
    return (
      text
        // Mark colons in tags
        .replace(
          /<(code|pre|script|template)[^>]*?>[\s\S]+?<\/(code|pre|script|template)>/g,
          function (m) { return m.replace(/:/g, '__colon__'); }
        )
        // Mark colons in comments
        .replace(/<!--[\s\S]+?-->/g, function (m) { return m.replace(/:/g, '__colon__'); })
        // Mark colons in URIs
        .replace(/([a-z]{2,}:)?\/\/[^\s'">)]+/gi, function (m) { return m.replace(/:/g, '__colon__'); }
        )
        // Replace emoji shorthand codes
        .replace(/:([a-z0-9_\-+]+?):/g, function (m, $1) { return replaceEmojiShorthand(m, $1, useNativeEmoji); }
        )
        // Restore colons in tags and comments
        .replace(/__colon__/g, ':')
    );
  }

  /**
   * Converts a colon formatted string to a object with properties.
   *
   * This is process a provided string and look for any tokens in the format
   * of `:name[=value]` and then convert it to a object and return.
   * An example of this is ':include :type=code :fragment=demo' is taken and
   * then converted to:
   *
   * ```
   * {
   *  include: '',
   *  type: 'code',
   *  fragment: 'demo'
   * }
   * ```
   *
   * @param {string}   str   The string to parse.
   *
   * @return {object}  The original string and parsed object, { str, config }.
   */
  function getAndRemoveConfig(str) {
    if (str === void 0) str = '';

    var config = {};

    if (str) {
      str = str
        .replace(/^('|")/, '')
        .replace(/('|")$/, '')
        .replace(/(?:^|\s):([\w-]+:?)=?([\w-%]+)?/g, function (m, key, value) {
          if (key.indexOf(':') === -1) {
            config[key] = (value && value.replace(/&quot;/g, '')) || true;
            return '';
          }

          return m;
        })
        .trim();
    }

    return { str: str, config: config };
  }

  /**
   * Remove the <a> tag from sidebar when the header with link, details see issue 1069
   * @param {string}   str   The string to deal with.
   *
   * @return {string}   str   The string after delete the <a> element.
   */
  function removeAtag(str) {
    if (str === void 0) str = '';

    return str.replace(/(<\/?a.*?>)/gi, '');
  }

  var imageCompiler = function (ref) {
    var renderer = ref.renderer;
    var contentBase = ref.contentBase;
    var router = ref.router;

    return (renderer.image = function (href, title, text) {
      var url = href;
      var attrs = [];

      var ref = getAndRemoveConfig(title);
      var str = ref.str;
      var config = ref.config;
      title = str;

      if (config['no-zoom']) {
        attrs.push('data-no-zoom');
      }

      if (title) {
        attrs.push(("title=\"" + title + "\""));
      }

      if (config.size) {
        var ref$1 = config.size.split('x');
        var width = ref$1[0];
        var height = ref$1[1];
        if (height) {
          attrs.push(("width=\"" + width + "\" height=\"" + height + "\""));
        } else {
          attrs.push(("width=\"" + width + "\""));
        }
      }

      if (config.class) {
        attrs.push(("class=\"" + (config.class) + "\""));
      }

      if (config.id) {
        attrs.push(("id=\"" + (config.id) + "\""));
      }

      if (!isAbsolutePath(href)) {
        url = getPath(contentBase, getParentPath(router.getCurrentPath()), href);
      }

      if (attrs.length > 0) {
        return ("<img src=\"" + url + "\" data-origin=\"" + href + "\" alt=\"" + text + "\" " + (attrs.join(
          ' '
        )) + " />");
      }

      return ("<img src=\"" + url + "\" data-origin=\"" + href + "\" alt=\"" + text + "\"" + attrs + ">");
    });
  };

  var prism = createCommonjsModule(function (module) {
    /* **********************************************
         Begin prism-core.js
    ********************************************** */

    /// <reference lib="WebWorker"/>

    var _self = (typeof window !== 'undefined')
      ? window   // if in browser
      : (
        (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
          ? self // if in worker
          : {}   // if in node js
      );

    /**
     * Prism: Lightweight, robust, elegant syntax highlighting
     *
     * @license MIT <https://opensource.org/licenses/MIT>
     * @author Lea Verou <https://lea.verou.me>
     * @namespace
     * @public
     */
    var Prism = (function (_self) {

      // Private helper vars
      var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
      var uniqueId = 0;

      // The grammar object for plaintext
      var plainTextGrammar = {};


      var _ = {
        /**
         * By default, Prism will attempt to highlight all code elements (by calling {@link Prism.highlightAll}) on the
         * current page after the page finished loading. This might be a problem if e.g. you wanted to asynchronously load
         * additional languages or plugins yourself.
         *
         * By setting this value to `true`, Prism will not automatically highlight all code elements on the page.
         *
         * You obviously have to change this value before the automatic highlighting started. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.manual = true;
         * // add a new <script> to load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        manual: _self.Prism && _self.Prism.manual,
        /**
         * By default, if Prism is in a web worker, it assumes that it is in a worker it created itself, so it uses
         * `addEventListener` to communicate with its parent instance. However, if you're using Prism manually in your
         * own worker, you don't want it to do this.
         *
         * By setting this value to `true`, Prism will not add its own listeners to the worker.
         *
         * You obviously have to change this value before Prism executes. To do this, you can add an
         * empty Prism object into the global scope before loading the Prism script like this:
         *
         * ```js
         * window.Prism = window.Prism || {};
         * Prism.disableWorkerMessageHandler = true;
         * // Load Prism's script
         * ```
         *
         * @default false
         * @type {boolean}
         * @memberof Prism
         * @public
         */
        disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,

        /**
         * A namespace for utility methods.
         *
         * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
         * change or disappear at any time.
         *
         * @namespace
         * @memberof Prism
         */
        util: {
          encode: function encode(tokens) {
            if (tokens instanceof Token) {
              return new Token(tokens.type, encode(tokens.content), tokens.alias);
            } else if (Array.isArray(tokens)) {
              return tokens.map(encode);
            } else {
              return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
            }
          },

          /**
           * Returns the name of the type of the given value.
           *
           * @param {any} o
           * @returns {string}
           * @example
           * type(null)      === 'Null'
           * type(undefined) === 'Undefined'
           * type(123)       === 'Number'
           * type('foo')     === 'String'
           * type(true)      === 'Boolean'
           * type([1, 2])    === 'Array'
           * type({})        === 'Object'
           * type(String)    === 'Function'
           * type(/abc+/)    === 'RegExp'
           */
          type: function (o) {
            return Object.prototype.toString.call(o).slice(8, -1);
          },

          /**
           * Returns a unique number for the given object. Later calls will still return the same number.
           *
           * @param {Object} obj
           * @returns {number}
           */
          objId: function (obj) {
            if (!obj['__id']) {
              Object.defineProperty(obj, '__id', { value: ++uniqueId });
            }
            return obj['__id'];
          },

          /**
           * Creates a deep clone of the given object.
           *
           * The main intended use of this function is to clone language definitions.
           *
           * @param {T} o
           * @param {Record<number, any>} [visited]
           * @returns {T}
           * @template T
           */
          clone: function deepClone(o, visited) {
            visited = visited || {};

            var clone; var id;
            switch (_.util.type(o)) {
              case 'Object':
                id = _.util.objId(o);
                if (visited[id]) {
                  return visited[id];
                }
                clone = /** @type {Record<string, any>} */ ({});
                visited[id] = clone;

                for (var key in o) {
                  if (o.hasOwnProperty(key)) {
                    clone[key] = deepClone(o[key], visited);
                  }
                }

                return /** @type {any} */ (clone);

              case 'Array':
                id = _.util.objId(o);
                if (visited[id]) {
                  return visited[id];
                }
                clone = [];
                visited[id] = clone;

                (/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
                  clone[i] = deepClone(v, visited);
                });

                return /** @type {any} */ (clone);

              default:
                return o;
            }
          },

          /**
           * Returns the Prism language of the given element set by a `language-xxxx` or `lang-xxxx` class.
           *
           * If no language is set for the element or the element is `null` or `undefined`, `none` will be returned.
           *
           * @param {Element} element
           * @returns {string}
           */
          getLanguage: function (element) {
            while (element) {
              var m = lang.exec(element.className);
              if (m) {
                return m[1].toLowerCase();
              }
              element = element.parentElement;
            }
            return 'none';
          },

          /**
           * Sets the Prism `language-xxxx` class of the given element.
           *
           * @param {Element} element
           * @param {string} language
           * @returns {void}
           */
          setLanguage: function (element, language) {
            // remove all `language-xxxx` classes
            // (this might leave behind a leading space)
            element.className = element.className.replace(RegExp(lang, 'gi'), '');

            // add the new `language-xxxx` class
            // (using `classList` will automatically clean up spaces for us)
            element.classList.add('language-' + language);
          },

          /**
           * Returns the script element that is currently executing.
           *
           * This does __not__ work for line script element.
           *
           * @returns {HTMLScriptElement | null}
           */
          currentScript: function () {
            if (typeof document === 'undefined') {
              return null;
            }
            if ('currentScript' in document && 1 < 2 /* hack to trip TS' flow analysis */) {
              return /** @type {any} */ (document.currentScript);
            }

            // IE11 workaround
            // we'll get the src of the current script by parsing IE11's error stack trace
            // this will not work for inline scripts

            try {
              throw new Error();
            } catch (err) {
              // Get file src url from stack. Specifically works with the format of stack traces in IE.
              // A stack will look like this:
              //
              // Error
              //    at _.util.currentScript (http://localhost/components/prism-core.js:119:5)
              //    at Global code (http://localhost/components/prism-core.js:606:1)

              var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
              if (src) {
                var scripts = document.getElementsByTagName('script');
                for (var i in scripts) {
                  if (scripts[i].src == src) {
                    return scripts[i];
                  }
                }
              }
              return null;
            }
          },

          /**
           * Returns whether a given class is active for `element`.
           *
           * The class can be activated if `element` or one of its ancestors has the given class and it can be deactivated
           * if `element` or one of its ancestors has the negated version of the given class. The _negated version_ of the
           * given class is just the given class with a `no-` prefix.
           *
           * Whether the class is active is determined by the closest ancestor of `element` (where `element` itself is
           * closest ancestor) that has the given class or the negated version of it. If neither `element` nor any of its
           * ancestors have the given class or the negated version of it, then the default activation will be returned.
           *
           * In the paradoxical situation where the closest ancestor contains __both__ the given class and the negated
           * version of it, the class is considered active.
           *
           * @param {Element} element
           * @param {string} className
           * @param {boolean} [defaultActivation=false]
           * @returns {boolean}
           */
          isActive: function (element, className, defaultActivation) {
            var no = 'no-' + className;

            while (element) {
              var classList = element.classList;
              if (classList.contains(className)) {
                return true;
              }
              if (classList.contains(no)) {
                return false;
              }
              element = element.parentElement;
            }
            return !!defaultActivation;
          }
        },

        /**
         * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
         *
         * @namespace
         * @memberof Prism
         * @public
         */
        languages: {
          /**
           * The grammar for plain, unformatted text.
           */
          plain: plainTextGrammar,
          plaintext: plainTextGrammar,
          text: plainTextGrammar,
          txt: plainTextGrammar,

          /**
           * Creates a deep copy of the language with the given id and appends the given tokens.
           *
           * If a token in `redef` also appears in the copied language, then the existing token in the copied language
           * will be overwritten at its original position.
           *
           * ## Best practices
           *
           * Since the position of overwriting tokens (token in `redef` that overwrite tokens in the copied language)
           * doesn't matter, they can technically be in any order. However, this can be confusing to others that trying to
           * understand the language definition because, normally, the order of tokens matters in Prism grammars.
           *
           * Therefore, it is encouraged to order overwriting tokens according to the positions of the overwritten tokens.
           * Furthermore, all non-overwriting tokens should be placed after the overwriting ones.
           *
           * @param {string} id The id of the language to extend. This has to be a key in `Prism.languages`.
           * @param {Grammar} redef The new tokens to append.
           * @returns {Grammar} The new language created.
           * @public
           * @example
           * Prism.languages['css-with-colors'] = Prism.languages.extend('css', {
           *     // Prism.languages.css already has a 'comment' token, so this token will overwrite CSS' 'comment' token
           *     // at its original position
           *     'comment': { ... },
           *     // CSS doesn't have a 'color' token, so this token will be appended
           *     'color': /\b(?:red|green|blue)\b/
           * });
           */
          extend: function (id, redef) {
            var lang = _.util.clone(_.languages[id]);

            for (var key in redef) {
              lang[key] = redef[key];
            }

            return lang;
          },

          /**
           * Inserts tokens _before_ another token in a language definition or any other grammar.
           *
           * ## Usage
           *
           * This helper method makes it easy to modify existing languages. For example, the CSS language definition
           * not only defines CSS highlighting for CSS documents, but also needs to define highlighting for CSS embedded
           * in HTML through `<style>` elements. To do this, it needs to modify `Prism.languages.markup` and add the
           * appropriate tokens. However, `Prism.languages.markup` is a regular JavaScript object literal, so if you do
           * this:
           *
           * ```js
           * Prism.languages.markup.style = {
           *     // token
           * };
           * ```
           *
           * then the `style` token will be added (and processed) at the end. `insertBefore` allows you to insert tokens
           * before existing tokens. For the CSS example above, you would use it like this:
           *
           * ```js
           * Prism.languages.insertBefore('markup', 'cdata', {
           *     'style': {
           *         // token
           *     }
           * });
           * ```
           *
           * ## Special cases
           *
           * If the grammars of `inside` and `insert` have tokens with the same name, the tokens in `inside`'s grammar
           * will be ignored.
           *
           * This behavior can be used to insert tokens after `before`:
           *
           * ```js
           * Prism.languages.insertBefore('markup', 'comment', {
           *     'comment': Prism.languages.markup.comment,
           *     // tokens after 'comment'
           * });
           * ```
           *
           * ## Limitations
           *
           * The main problem `insertBefore` has to solve is iteration order. Since ES2015, the iteration order for object
           * properties is guaranteed to be the insertion order (except for integer keys) but some browsers behave
           * differently when keys are deleted and re-inserted. So `insertBefore` can't be implemented by temporarily
           * deleting properties which is necessary to insert at arbitrary positions.
           *
           * To solve this problem, `insertBefore` doesn't actually insert the given tokens into the target object.
           * Instead, it will create a new object and replace all references to the target object with the new one. This
           * can be done without temporarily deleting properties, so the iteration order is well-defined.
           *
           * However, only references that can be reached from `Prism.languages` or `insert` will be replaced. I.e. if
           * you hold the target object in a variable, then the value of the variable will not change.
           *
           * ```js
           * var oldMarkup = Prism.languages.markup;
           * var newMarkup = Prism.languages.insertBefore('markup', 'comment', { ... });
           *
           * assert(oldMarkup !== Prism.languages.markup);
           * assert(newMarkup === Prism.languages.markup);
           * ```
           *
           * @param {string} inside The property of `root` (e.g. a language id in `Prism.languages`) that contains the
           * object to be modified.
           * @param {string} before The key to insert before.
           * @param {Grammar} insert An object containing the key-value pairs to be inserted.
           * @param {Object<string, any>} [root] The object containing `inside`, i.e. the object that contains the
           * object to be modified.
           *
           * Defaults to `Prism.languages`.
           * @returns {Grammar} The new grammar object.
           * @public
           */
          insertBefore: function (inside, before, insert, root) {
            root = root || /** @type {any} */ (_.languages);
            var grammar = root[inside];
            /** @type {Grammar} */
            var ret = {};

            for (var token in grammar) {
              if (grammar.hasOwnProperty(token)) {

                if (token == before) {
                  for (var newToken in insert) {
                    if (insert.hasOwnProperty(newToken)) {
                      ret[newToken] = insert[newToken];
                    }
                  }
                }

                // Do not insert token which also occur in insert. See #1525
                if (!insert.hasOwnProperty(token)) {
                  ret[token] = grammar[token];
                }
              }
            }

            var old = root[inside];
            root[inside] = ret;

            // Update references in other language definitions
            _.languages.DFS(_.languages, function (key, value) {
              if (value === old && key != inside) {
                this[key] = ret;
              }
            });

            return ret;
          },

          // Traverse a language definition with Depth First Search
          DFS: function DFS(o, callback, type, visited) {
            visited = visited || {};

            var objId = _.util.objId;

            for (var i in o) {
              if (o.hasOwnProperty(i)) {
                callback.call(o, i, o[i], type || i);

                var property = o[i];
                var propertyType = _.util.type(property);

                if (propertyType === 'Object' && !visited[objId(property)]) {
                  visited[objId(property)] = true;
                  DFS(property, callback, null, visited);
                } else if (propertyType === 'Array' && !visited[objId(property)]) {
                  visited[objId(property)] = true;
                  DFS(property, callback, i, visited);
                }
              }
            }
          }
        },

        plugins: {},

        /**
         * This is the most high-level function in Prism’s API.
         * It fetches all the elements that have a `.language-xxxx` class and then calls {@link Prism.highlightElement} on
         * each one of them.
         *
         * This is equivalent to `Prism.highlightAllUnder(document, async, callback)`.
         *
         * @param {boolean} [async=false] Same as in {@link Prism.highlightAllUnder}.
         * @param {HighlightCallback} [callback] Same as in {@link Prism.highlightAllUnder}.
         * @memberof Prism
         * @public
         */
        highlightAll: function (async, callback) {
          _.highlightAllUnder(document, async, callback);
        },

        /**
         * Fetches all the descendants of `container` that have a `.language-xxxx` class and then calls
         * {@link Prism.highlightElement} on each one of them.
         *
         * The following hooks will be run:
         * 1. `before-highlightall`
         * 2. `before-all-elements-highlight`
         * 3. All hooks of {@link Prism.highlightElement} for each element.
         *
         * @param {ParentNode} container The root element, whose descendants that have a `.language-xxxx` class will be highlighted.
         * @param {boolean} [async=false] Whether each element is to be highlighted asynchronously using Web Workers.
         * @param {HighlightCallback} [callback] An optional callback to be invoked on each element after its highlighting is done.
         * @memberof Prism
         * @public
         */
        highlightAllUnder: function (container, async, callback) {
          var env = {
            callback: callback,
            container: container,
            selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
          };

          _.hooks.run('before-highlightall', env);

          env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));

          _.hooks.run('before-all-elements-highlight', env);

          for (var i = 0, element; (element = env.elements[i++]);) {
            _.highlightElement(element, async === true, env.callback);
          }
        },

        /**
         * Highlights the code inside a single element.
         *
         * The following hooks will be run:
         * 1. `before-sanity-check`
         * 2. `before-highlight`
         * 3. All hooks of {@link Prism.highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
         * 4. `before-insert`
         * 5. `after-highlight`
         * 6. `complete`
         *
         * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
         * the element's language.
         *
         * @param {Element} element The element containing the code.
         * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
         * @param {boolean} [async=false] Whether the element is to be highlighted asynchronously using Web Workers
         * to improve performance and avoid blocking the UI when highlighting very large chunks of code. This option is
         * [disabled by default](https://prismjs.com/faq.html#why-is-asynchronous-highlighting-disabled-by-default).
         *
         * Note: All language definitions required to highlight the code must be included in the main `prism.js` file for
         * asynchronous highlighting to work. You can build your own bundle on the
         * [Download page](https://prismjs.com/download.html).
         * @param {HighlightCallback} [callback] An optional callback to be invoked after the highlighting is done.
         * Mostly useful when `async` is `true`, since in that case, the highlighting is done asynchronously.
         * @memberof Prism
         * @public
         */
        highlightElement: function (element, async, callback) {
          // Find language
          var language = _.util.getLanguage(element);
          var grammar = _.languages[language];

          // Set language on the element, if not present
          _.util.setLanguage(element, language);

          // Set language on the parent, for styling
          var parent = element.parentElement;
          if (parent && parent.nodeName.toLowerCase() === 'pre') {
            _.util.setLanguage(parent, language);
          }

          var code = element.textContent;

          var env = {
            element: element,
            language: language,
            grammar: grammar,
            code: code
          };

          function insertHighlightedCode(highlightedCode) {
            env.highlightedCode = highlightedCode;

            _.hooks.run('before-insert', env);

            env.element.innerHTML = env.highlightedCode;

            _.hooks.run('after-highlight', env);
            _.hooks.run('complete', env);
            callback && callback.call(env.element);
          }

          _.hooks.run('before-sanity-check', env);

          // plugins may change/add the parent/element
          parent = env.element.parentElement;
          if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
            parent.setAttribute('tabindex', '0');
          }

          if (!env.code) {
            _.hooks.run('complete', env);
            callback && callback.call(env.element);
            return;
          }

          _.hooks.run('before-highlight', env);

          if (!env.grammar) {
            insertHighlightedCode(_.util.encode(env.code));
            return;
          }

          if (async && _self.Worker) {
            var worker = new Worker(_.filename);

            worker.onmessage = function (evt) {
              insertHighlightedCode(evt.data);
            };

            worker.postMessage(JSON.stringify({
              language: env.language,
              code: env.code,
              immediateClose: true
            }));
          } else {
            insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
          }
        },

        /**
         * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
         * and the language definitions to use, and returns a string with the HTML produced.
         *
         * The following hooks will be run:
         * 1. `before-tokenize`
         * 2. `after-tokenize`
         * 3. `wrap`: On each {@link Token}.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @param {string} language The name of the language definition passed to `grammar`.
         * @returns {string} The highlighted HTML.
         * @memberof Prism
         * @public
         * @example
         * Prism.highlight('var foo = true;', Prism.languages.javascript, 'javascript');
         */
        highlight: function (text, grammar, language) {
          var env = {
            code: text,
            grammar: grammar,
            language: language
          };
          _.hooks.run('before-tokenize', env);
          if (!env.grammar) {
            throw new Error('The language "' + env.language + '" has no grammar.');
          }
          env.tokens = _.tokenize(env.code, env.grammar);
          _.hooks.run('after-tokenize', env);
          return Token.stringify(_.util.encode(env.tokens), env.language);
        },

        /**
         * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
         * and the language definitions to use, and returns an array with the tokenized code.
         *
         * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
         *
         * This method could be useful in other contexts as well, as a very crude parser.
         *
         * @param {string} text A string with the code to be highlighted.
         * @param {Grammar} grammar An object containing the tokens to use.
         *
         * Usually a language definition like `Prism.languages.markup`.
         * @returns {TokenStream} An array of strings and tokens, a token stream.
         * @memberof Prism
         * @public
         * @example
         * let code = `var foo = 0;`;
         * let tokens = Prism.tokenize(code, Prism.languages.javascript);
         * tokens.forEach(token => {
         *     if (token instanceof Prism.Token && token.type === 'number') {
         *         console.log(`Found numeric literal: ${token.content}`);
         *     }
         * });
         */
        tokenize: function (text, grammar) {
          var rest = grammar.rest;
          if (rest) {
            for (var token in rest) {
              grammar[token] = rest[token];
            }

            delete grammar.rest;
          }

          var tokenList = new LinkedList();
          addAfter(tokenList, tokenList.head, text);

          matchGrammar(text, tokenList, grammar, tokenList.head, 0);

          return toArray(tokenList);
        },

        /**
         * @namespace
         * @memberof Prism
         * @public
         */
        hooks: {
          all: {},

          /**
           * Adds the given callback to the list of callbacks for the given hook.
           *
           * The callback will be invoked when the hook it is registered for is run.
           * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
           *
           * One callback function can be registered to multiple hooks and the same hook multiple times.
           *
           * @param {string} name The name of the hook.
           * @param {HookCallback} callback The callback function which is given environment variables.
           * @public
           */
          add: function (name, callback) {
            var hooks = _.hooks.all;

            hooks[name] = hooks[name] || [];

            hooks[name].push(callback);
          },

          /**
           * Runs a hook invoking all registered callbacks with the given environment variables.
           *
           * Callbacks will be invoked synchronously and in the order in which they were registered.
           *
           * @param {string} name The name of the hook.
           * @param {Object<string, any>} env The environment variables of the hook passed to all callbacks registered.
           * @public
           */
          run: function (name, env) {
            var callbacks = _.hooks.all[name];

            if (!callbacks || !callbacks.length) {
              return;
            }

            for (var i = 0, callback; (callback = callbacks[i++]);) {
              callback(env);
            }
          }
        },

        Token: Token
      };
      _self.Prism = _;


      // Typescript note:
      // The following can be used to import the Token type in JSDoc:
      //
      //   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

      /**
       * Creates a new token.
       *
       * @param {string} type See {@link Token#type type}
       * @param {string | TokenStream} content See {@link Token#content content}
       * @param {string|string[]} [alias] The alias(es) of the token.
       * @param {string} [matchedStr=""] A copy of the full string this token was created from.
       * @class
       * @global
       * @public
       */
      function Token(type, content, alias, matchedStr) {
        /**
         * The type of the token.
         *
         * This is usually the key of a pattern in a {@link Grammar}.
         *
         * @type {string}
         * @see GrammarToken
         * @public
         */
        this.type = type;
        /**
         * The strings or tokens contained by this token.
         *
         * This will be a token stream if the pattern matched also defined an `inside` grammar.
         *
         * @type {string | TokenStream}
         * @public
         */
        this.content = content;
        /**
         * The alias(es) of the token.
         *
         * @type {string|string[]}
         * @see GrammarToken
         * @public
         */
        this.alias = alias;
        // Copy of the full string this token was created from
        this.length = (matchedStr || '').length | 0;
      }

      /**
       * A token stream is an array of strings and {@link Token Token} objects.
       *
       * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
       * them.
       *
       * 1. No adjacent strings.
       * 2. No empty strings.
       *
       *    The only exception here is the token stream that only contains the empty string and nothing else.
       *
       * @typedef {Array<string | Token>} TokenStream
       * @global
       * @public
       */

      /**
       * Converts the given token or token stream to an HTML representation.
       *
       * The following hooks will be run:
       * 1. `wrap`: On each {@link Token}.
       *
       * @param {string | Token | TokenStream} o The token or token stream to be converted.
       * @param {string} language The name of current language.
       * @returns {string} The HTML representation of the token or token stream.
       * @memberof Token
       * @static
       */
      Token.stringify = function stringify(o, language) {
        if (typeof o == 'string') {
          return o;
        }
        if (Array.isArray(o)) {
          var s = '';
          o.forEach(function (e) {
            s += stringify(e, language);
          });
          return s;
        }

        var env = {
          type: o.type,
          content: stringify(o.content, language),
          tag: 'span',
          classes: ['token', o.type],
          attributes: {},
          language: language
        };

        var aliases = o.alias;
        if (aliases) {
          if (Array.isArray(aliases)) {
            Array.prototype.push.apply(env.classes, aliases);
          } else {
            env.classes.push(aliases);
          }
        }

        _.hooks.run('wrap', env);

        var attributes = '';
        for (var name in env.attributes) {
          attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
        }

        return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
      };

      /**
       * @param {RegExp} pattern
       * @param {number} pos
       * @param {string} text
       * @param {boolean} lookbehind
       * @returns {RegExpExecArray | null}
       */
      function matchPattern(pattern, pos, text, lookbehind) {
        pattern.lastIndex = pos;
        var match = pattern.exec(text);
        if (match && lookbehind && match[1]) {
          // change the match to remove the text matched by the Prism lookbehind group
          var lookbehindLength = match[1].length;
          match.index += lookbehindLength;
          match[0] = match[0].slice(lookbehindLength);
        }
        return match;
      }

      /**
       * @param {string} text
       * @param {LinkedList<string | Token>} tokenList
       * @param {any} grammar
       * @param {LinkedListNode<string | Token>} startNode
       * @param {number} startPos
       * @param {RematchOptions} [rematch]
       * @returns {void}
       * @private
       *
       * @typedef RematchOptions
       * @property {string} cause
       * @property {number} reach
       */
      function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
        for (var token in grammar) {
          if (!grammar.hasOwnProperty(token) || !grammar[token]) {
            continue;
          }

          var patterns = grammar[token];
          patterns = Array.isArray(patterns) ? patterns : [patterns];

          for (var j = 0; j < patterns.length; ++j) {
            if (rematch && rematch.cause == token + ',' + j) {
              return;
            }

            var patternObj = patterns[j];
            var inside = patternObj.inside;
            var lookbehind = !!patternObj.lookbehind;
            var greedy = !!patternObj.greedy;
            var alias = patternObj.alias;

            if (greedy && !patternObj.pattern.global) {
              // Without the global flag, lastIndex won't work
              var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
              patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
            }

            /** @type {RegExp} */
            var pattern = patternObj.pattern || patternObj;

            for ( // iterate the token list and keep track of the current token/string position
              var currentNode = startNode.next, pos = startPos;
              currentNode !== tokenList.tail;
              pos += currentNode.value.length, currentNode = currentNode.next
            ) {

              if (rematch && pos >= rematch.reach) {
                break;
              }

              var str = currentNode.value;

              if (tokenList.length > text.length) {
                // Something went terribly wrong, ABORT, ABORT!
                return;
              }

              if (str instanceof Token) {
                continue;
              }

              var removeCount = 1; // this is the to parameter of removeBetween
              var match;

              if (greedy) {
                match = matchPattern(pattern, pos, text, lookbehind);
                if (!match || match.index >= text.length) {
                  break;
                }

                var from = match.index;
                var to = match.index + match[0].length;
                var p = pos;

                // find the node that contains the match
                p += currentNode.value.length;
                while (from >= p) {
                  currentNode = currentNode.next;
                  p += currentNode.value.length;
                }
                // adjust pos (and p)
                p -= currentNode.value.length;
                pos = p;

                // the current node is a Token, then the match starts inside another Token, which is invalid
                if (currentNode.value instanceof Token) {
                  continue;
                }

                // find the last node which is affected by this match
                for (
                  var k = currentNode;
                  k !== tokenList.tail && (p < to || typeof k.value === 'string');
                  k = k.next
                ) {
                  removeCount++;
                  p += k.value.length;
                }
                removeCount--;

                // replace with the new match
                str = text.slice(pos, p);
                match.index -= pos;
              } else {
                match = matchPattern(pattern, 0, str, lookbehind);
                if (!match) {
                  continue;
                }
              }

              // eslint-disable-next-line no-redeclare
              var from = match.index;
              var matchStr = match[0];
              var before = str.slice(0, from);
              var after = str.slice(from + matchStr.length);

              var reach = pos + str.length;
              if (rematch && reach > rematch.reach) {
                rematch.reach = reach;
              }

              var removeFrom = currentNode.prev;

              if (before) {
                removeFrom = addAfter(tokenList, removeFrom, before);
                pos += before.length;
              }

              removeRange(tokenList, removeFrom, removeCount);

              var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
              currentNode = addAfter(tokenList, removeFrom, wrapped);

              if (after) {
                addAfter(tokenList, currentNode, after);
              }

              if (removeCount > 1) {
                // at least one Token object was removed, so we have to do some rematching
                // this can only happen if the current pattern is greedy

                /** @type {RematchOptions} */
                var nestedRematch = {
                  cause: token + ',' + j,
                  reach: reach
                };
                matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

                // the reach might have been extended because of the rematching
                if (rematch && nestedRematch.reach > rematch.reach) {
                  rematch.reach = nestedRematch.reach;
                }
              }
            }
          }
        }
      }

      /**
       * @typedef LinkedListNode
       * @property {T} value
       * @property {LinkedListNode<T> | null} prev The previous node.
       * @property {LinkedListNode<T> | null} next The next node.
       * @template T
       * @private
       */

      /**
       * @template T
       * @private
       */
      function LinkedList() {
        /** @type {LinkedListNode<T>} */
        var head = { value: null, prev: null, next: null };
        /** @type {LinkedListNode<T>} */
        var tail = { value: null, prev: head, next: null };
        head.next = tail;

        /** @type {LinkedListNode<T>} */
        this.head = head;
        /** @type {LinkedListNode<T>} */
        this.tail = tail;
        this.length = 0;
      }

      /**
       * Adds a new node with the given value to the list.
       *
       * @param {LinkedList<T>} list
       * @param {LinkedListNode<T>} node
       * @param {T} value
       * @returns {LinkedListNode<T>} The added node.
       * @template T
       */
      function addAfter(list, node, value) {
        // assumes that node != list.tail && values.length >= 0
        var next = node.next;

        var newNode = { value: value, prev: node, next: next };
        node.next = newNode;
        next.prev = newNode;
        list.length++;

        return newNode;
      }
      /**
       * Removes `count` nodes after the given node. The given node will not be removed.
       *
       * @param {LinkedList<T>} list
       * @param {LinkedListNode<T>} node
       * @param {number} count
       * @template T
       */
      function removeRange(list, node, count) {
        var next = node.next;
        for (var i = 0; i < count && next !== list.tail; i++) {
          next = next.next;
        }
        node.next = next;
        next.prev = node;
        list.length -= i;
      }
      /**
       * @param {LinkedList<T>} list
       * @returns {T[]}
       * @template T
       */
      function toArray(list) {
        var array = [];
        var node = list.head.next;
        while (node !== list.tail) {
          array.push(node.value);
          node = node.next;
        }
        return array;
      }


      if (!_self.document) {
        if (!_self.addEventListener) {
          // in Node.js
          return _;
        }

        if (!_.disableWorkerMessageHandler) {
          // In worker
          _self.addEventListener('message', function (evt) {
            var message = JSON.parse(evt.data);
            var lang = message.language;
            var code = message.code;
            var immediateClose = message.immediateClose;

            _self.postMessage(_.highlight(code, _.languages[lang], lang));
            if (immediateClose) {
              _self.close();
            }
          }, false);
        }

        return _;
      }

      // Get current script and highlight
      var script = _.util.currentScript();

      if (script) {
        _.filename = script.src;

        if (script.hasAttribute('data-manual')) {
          _.manual = true;
        }
      }

      function highlightAutomaticallyCallback() {
        if (!_.manual) {
          _.highlightAll();
        }
      }

      if (!_.manual) {
        // If the document state is "loading", then we'll use DOMContentLoaded.
        // If the document state is "interactive" and the prism.js script is deferred, then we'll also use the
        // DOMContentLoaded event because there might be some plugins or languages which have also been deferred and they
        // might take longer one animation frame to execute which can create a race condition where only some plugins have
        // been loaded when Prism.highlightAll() is executed, depending on how fast resources are loaded.
        // See https://github.com/PrismJS/prism/issues/2102
        var readyState = document.readyState;
        if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
          document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
        } else {
          if (window.requestAnimationFrame) {
            window.requestAnimationFrame(highlightAutomaticallyCallback);
          } else {
            window.setTimeout(highlightAutomaticallyCallback, 16);
          }
        }
      }

      return _;

    }(_self));

    if (module.exports) {
      module.exports = Prism;
    }

    // hack for components to work correctly in node.js
    if (typeof commonjsGlobal !== 'undefined') {
      commonjsGlobal.Prism = Prism;
    }

    // some additional documentation/types

    /**
     * The expansion of a simple `RegExp` literal to support additional properties.
     *
     * @typedef GrammarToken
     * @property {RegExp} pattern The regular expression of the token.
     * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
     * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
     * @property {boolean} [greedy=false] Whether the token is greedy.
     * @property {string|string[]} [alias] An optional alias or list of aliases.
     * @property {Grammar} [inside] The nested grammar of this token.
     *
     * The `inside` grammar will be used to tokenize the text value of each token of this kind.
     *
     * This can be used to make nested and even recursive language definitions.
     *
     * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
     * each another.
     * @global
     * @public
     */

    /**
     * @typedef Grammar
     * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
     * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
     * @global
     * @public
     */

    /**
     * A function which will invoked after an element was successfully highlighted.
     *
     * @callback HighlightCallback
     * @param {Element} element The element successfully highlighted.
     * @returns {void}
     * @global
     * @public
     */

    /**
     * @callback HookCallback
     * @param {Object<string, any>} env The environment variables of the hook.
     * @returns {void}
     * @global
     * @public
     */


    /* **********************************************
         Begin prism-markup.js
    ********************************************** */

    Prism.languages.markup = {
      'comment': {
        pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
        greedy: true
      },
      'prolog': {
        pattern: /<\?[\s\S]+?\?>/,
        greedy: true
      },
      'doctype': {
        // https://www.w3.org/TR/xml/#NT-doctypedecl
        pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
        greedy: true,
        inside: {
          'internal-subset': {
            pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
            lookbehind: true,
            greedy: true,
            inside: null // see below
          },
          'string': {
            pattern: /"[^"]*"|'[^']*'/,
            greedy: true
          },
          'punctuation': /^<!|>$|[[\]]/,
          'doctype-tag': /^DOCTYPE/i,
          'name': /[^\s<>'"]+/
        }
      },
      'cdata': {
        pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
        greedy: true
      },
      'tag': {
        pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
        greedy: true,
        inside: {
          'tag': {
            pattern: /^<\/?[^\s>\/]+/,
            inside: {
              'punctuation': /^<\/?/,
              'namespace': /^[^\s>\/:]+:/
            }
          },
          'special-attr': [],
          'attr-value': {
            pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
            inside: {
              'punctuation': [
                {
                  pattern: /^=/,
                  alias: 'attr-equals'
                },
                {
                  pattern: /^(\s*)["']|["']$/,
                  lookbehind: true
                }
              ]
            }
          },
          'punctuation': /\/?>/,
          'attr-name': {
            pattern: /[^\s>\/]+/,
            inside: {
              'namespace': /^[^\s>\/:]+:/
            }
          }

        }
      },
      'entity': [
        {
          pattern: /&[\da-z]{1,8};/i,
          alias: 'named-entity'
        },
        /&#x?[\da-f]{1,8};/i
      ]
    };

    Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
      Prism.languages.markup['entity'];
    Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;

    // Plugin to make entity title show the real entity, idea by Roman Komarov
    Prism.hooks.add('wrap', function (env) {

      if (env.type === 'entity') {
        env.attributes['title'] = env.content.replace(/&amp;/, '&');
      }
    });

    Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
      /**
       * Adds an inlined language to markup.
       *
       * An example of an inlined language is CSS with `<style>` tags.
       *
       * @param {string} tagName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addInlined('style', 'css');
       */
      value: function addInlined(tagName, lang) {
        var includedCdataInside = {};
        includedCdataInside['language-' + lang] = {
          pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
          lookbehind: true,
          inside: Prism.languages[lang]
        };
        includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;

        var inside = {
          'included-cdata': {
            pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
            inside: includedCdataInside
          }
        };
        inside['language-' + lang] = {
          pattern: /[\s\S]+/,
          inside: Prism.languages[lang]
        };

        var def = {};
        def[tagName] = {
          pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
          lookbehind: true,
          greedy: true,
          inside: inside
        };

        Prism.languages.insertBefore('markup', 'cdata', def);
      }
    });
    Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
      /**
       * Adds an pattern to highlight languages embedded in HTML attributes.
       *
       * An example of an inlined language is CSS with `style` attributes.
       *
       * @param {string} attrName The name of the tag that contains the inlined language. This name will be treated as
       * case insensitive.
       * @param {string} lang The language key.
       * @example
       * addAttribute('style', 'css');
       */
      value: function (attrName, lang) {
        Prism.languages.markup.tag.inside['special-attr'].push({
          pattern: RegExp(
            /(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
            'i'
          ),
          lookbehind: true,
          inside: {
            'attr-name': /^[^\s=]+/,
            'attr-value': {
              pattern: /=[\s\S]+/,
              inside: {
                'value': {
                  pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
                  lookbehind: true,
                  alias: [lang, 'language-' + lang],
                  inside: Prism.languages[lang]
                },
                'punctuation': [
                  {
                    pattern: /^=/,
                    alias: 'attr-equals'
                  },
                  /"|'/
                ]
              }
            }
          }
        });
      }
    });

    Prism.languages.html = Prism.languages.markup;
    Prism.languages.mathml = Prism.languages.markup;
    Prism.languages.svg = Prism.languages.markup;

    Prism.languages.xml = Prism.languages.extend('markup', {});
    Prism.languages.ssml = Prism.languages.xml;
    Prism.languages.atom = Prism.languages.xml;
    Prism.languages.rss = Prism.languages.xml;


    /* **********************************************
         Begin prism-css.js
    ********************************************** */

    (function (Prism) {

      var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;

      Prism.languages.css = {
        'comment': /\/\*[\s\S]*?\*\//,
        'atrule': {
          pattern: RegExp('@[\\w-](?:' + /[^;{\s"']|\s+(?!\s)/.source + '|' + string.source + ')*?' + /(?:;|(?=\s*\{))/.source),
          inside: {
            'rule': /^@[\w-]+/,
            'selector-function-argument': {
              pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
              lookbehind: true,
              alias: 'selector'
            },
            'keyword': {
              pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
              lookbehind: true
            }
            // See rest below
          }
        },
        'url': {
          // https://drafts.csswg.org/css-values-3/#urls
          pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
          greedy: true,
          inside: {
            'function': /^url/i,
            'punctuation': /^\(|\)$/,
            'string': {
              pattern: RegExp('^' + string.source + '$'),
              alias: 'url'
            }
          }
        },
        'selector': {
          pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
          lookbehind: true
        },
        'string': {
          pattern: string,
          greedy: true
        },
        'property': {
          pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
          lookbehind: true
        },
        'important': /!important\b/i,
        'function': {
          pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
          lookbehind: true
        },
        'punctuation': /[(){};:,]/
      };

      Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

      var markup = Prism.languages.markup;
      if (markup) {
        markup.tag.addInlined('style', 'css');
        markup.tag.addAttribute('style', 'css');
      }

    }(Prism));


    /* **********************************************
         Begin prism-clike.js
    ********************************************** */

    Prism.languages.clike = {
      'comment': [
        {
          pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
          lookbehind: true,
          greedy: true
        },
        {
          pattern: /(^|[^\\:])\/\/.*/,
          lookbehind: true,
          greedy: true
        }
      ],
      'string': {
        pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
        greedy: true
      },
      'class-name': {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
        lookbehind: true,
        inside: {
          'punctuation': /[.\\]/
        }
      },
      'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
      'boolean': /\b(?:false|true)\b/,
      'function': /\b\w+(?=\()/,
      'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
      'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
      'punctuation': /[{}[\];(),.:]/
    };


    /* **********************************************
         Begin prism-javascript.js
    ********************************************** */

    Prism.languages.javascript = Prism.languages.extend('clike', {
      'class-name': [
        Prism.languages.clike['class-name'],
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
          lookbehind: true
        }
      ],
      'keyword': [
        {
          pattern: /((?:^|\})\s*)catch\b/,
          lookbehind: true
        },
        {
          pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
          lookbehind: true
        }],
      // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
      'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
      'number': {
        pattern: RegExp(
          /(^|[^\w$])/.source +
          '(?:' +
          (
            // constant
            /NaN|Infinity/.source +
            '|' +
            // binary integer
            /0[bB][01]+(?:_[01]+)*n?/.source +
            '|' +
            // octal integer
            /0[oO][0-7]+(?:_[0-7]+)*n?/.source +
            '|' +
            // hexadecimal integer
            /0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
            '|' +
            // decimal bigint
            /\d+(?:_\d+)*n/.source +
            '|' +
            // decimal number (integer or float) but no bigint
            /(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
          ) +
          ')' +
          /(?![\w$])/.source
        ),
        lookbehind: true
      },
      'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    });

    Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;

    Prism.languages.insertBefore('javascript', 'keyword', {
      'regex': {
        pattern: RegExp(
          // lookbehind
          // eslint-disable-next-line regexp/no-dupe-characters-character-class
          /((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
          // Regex pattern:
          // There are 2 regex patterns here. The RegExp set notation proposal added support for nested character
          // classes if the `v` flag is present. Unfortunately, nested CCs are both context-free and incompatible
          // with the only syntax, so we have to define 2 different regex patterns.
          /\//.source +
          '(?:' +
          /(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
          '|' +
          // `v` flag syntax. This supports 3 levels of nested character classes.
          /(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
          ')' +
          // lookahead
          /(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
        ),
        lookbehind: true,
        greedy: true,
        inside: {
          'regex-source': {
            pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
            lookbehind: true,
            alias: 'language-regex',
            inside: Prism.languages.regex
          },
          'regex-delimiter': /^\/|\/$/,
          'regex-flags': /^[a-z]+$/,
        }
      },
      // This must be declared before keyword because we use "function" inside the look-forward
      'function-variable': {
        pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
        alias: 'function'
      },
      'parameter': [
        {
          pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
          lookbehind: true,
          inside: Prism.languages.javascript
        },
        {
          pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
          lookbehind: true,
          inside: Prism.languages.javascript
        },
        {
          pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
          lookbehind: true,
          inside: Prism.languages.javascript
        },
        {
          pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
          lookbehind: true,
          inside: Prism.languages.javascript
        }
      ],
      'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    });

    Prism.languages.insertBefore('javascript', 'string', {
      'hashbang': {
        pattern: /^#!.*/,
        greedy: true,
        alias: 'comment'
      },
      'template-string': {
        pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
        greedy: true,
        inside: {
          'template-punctuation': {
            pattern: /^`|`$/,
            alias: 'string'
          },
          'interpolation': {
            pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
            lookbehind: true,
            inside: {
              'interpolation-punctuation': {
                pattern: /^\$\{|\}$/,
                alias: 'punctuation'
              },
              rest: Prism.languages.javascript
            }
          },
          'string': /[\s\S]+/
        }
      },
      'string-property': {
        pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
        lookbehind: true,
        greedy: true,
        alias: 'property'
      }
    });

    Prism.languages.insertBefore('javascript', 'operator', {
      'literal-property': {
        pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
        lookbehind: true,
        alias: 'property'
      },
    });

    if (Prism.languages.markup) {
      Prism.languages.markup.tag.addInlined('script', 'javascript');

      // add attribute support for all DOM events.
      // https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
      Prism.languages.markup.tag.addAttribute(
        /on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
        'javascript'
      );
    }

    Prism.languages.js = Prism.languages.javascript;


    /* **********************************************
         Begin prism-file-highlight.js
    ********************************************** */

    (function () {

      if (typeof Prism === 'undefined' || typeof document === 'undefined') {
        return;
      }

      // https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
      if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
      }

      var LOADING_MESSAGE = 'Loading…';
      var FAILURE_MESSAGE = function (status, message) {
        return '✖ Error ' + status + ' while fetching file: ' + message;
      };
      var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';

      var EXTENSIONS = {
        'js': 'javascript',
        'py': 'python',
        'rb': 'ruby',
        'ps1': 'powershell',
        'psm1': 'powershell',
        'sh': 'bash',
        'bat': 'batch',
        'h': 'c',
        'tex': 'latex'
      };

      var STATUS_ATTR = 'data-src-status';
      var STATUS_LOADING = 'loading';
      var STATUS_LOADED = 'loaded';
      var STATUS_FAILED = 'failed';

      var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])'
        + ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';

      /**
       * Loads the given file.
       *
       * @param {string} src The URL or path of the source file to load.
       * @param {(result: string) => void} success
       * @param {(reason: string) => void} error
       */
      function loadFile(src, success, error) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status < 400 && xhr.responseText) {
              success(xhr.responseText);
            } else {
              if (xhr.status >= 400) {
                error(FAILURE_MESSAGE(xhr.status, xhr.statusText));
              } else {
                error(FAILURE_EMPTY_MESSAGE);
              }
            }
          }
        };
        xhr.send(null);
      }

      /**
       * Parses the given range.
       *
       * This returns a range with inclusive ends.
       *
       * @param {string | null | undefined} range
       * @returns {[number, number | undefined] | undefined}
       */
      function parseRange(range) {
        var m = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(range || '');
        if (m) {
          var start = Number(m[1]);
          var comma = m[2];
          var end = m[3];

          if (!comma) {
            return [start, start];
          }
          if (!end) {
            return [start, undefined];
          }
          return [start, Number(end)];
        }
        return undefined;
      }

      Prism.hooks.add('before-highlightall', function (env) {
        env.selector += ', ' + SELECTOR;
      });

      Prism.hooks.add('before-sanity-check', function (env) {
        var pre = /** @type {HTMLPreElement} */ (env.element);
        if (pre.matches(SELECTOR)) {
          env.code = ''; // fast-path the whole thing and go to complete

          pre.setAttribute(STATUS_ATTR, STATUS_LOADING); // mark as loading

          // add code element with loading message
          var code = pre.appendChild(document.createElement('CODE'));
          code.textContent = LOADING_MESSAGE;

          var src = pre.getAttribute('data-src');

          var language = env.language;
          if (language === 'none') {
            // the language might be 'none' because there is no language set;
            // in this case, we want to use the extension as the language
            var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
            language = EXTENSIONS[extension] || extension;
          }

          // set language classes
          Prism.util.setLanguage(code, language);
          Prism.util.setLanguage(pre, language);

          // preload the language
          var autoloader = Prism.plugins.autoloader;
          if (autoloader) {
            autoloader.loadLanguages(language);
          }

          // load file
          loadFile(
            src,
            function (text) {
              // mark as loaded
              pre.setAttribute(STATUS_ATTR, STATUS_LOADED);

              // handle data-range
              var range = parseRange(pre.getAttribute('data-range'));
              if (range) {
                var lines = text.split(/\r\n?|\n/g);

                // the range is one-based and inclusive on both ends
                var start = range[0];
                var end = range[1] == null ? lines.length : range[1];

                if (start < 0) { start += lines.length; }
                start = Math.max(0, Math.min(start - 1, lines.length));
                if (end < 0) { end += lines.length; }
                end = Math.max(0, Math.min(end, lines.length));

                text = lines.slice(start, end).join('\n');

                // add data-start for line numbers
                if (!pre.hasAttribute('data-start')) {
                  pre.setAttribute('data-start', String(start + 1));
                }
              }

              // highlight code
              code.textContent = text;
              Prism.highlightElement(code);
            },
            function (error) {
              // mark as failed
              pre.setAttribute(STATUS_ATTR, STATUS_FAILED);

              code.textContent = error;
            }
          );
        }
      });

      Prism.plugins.fileHighlight = {
        /**
         * Executes the File Highlight plugin for all matching `pre` elements under the given container.
         *
         * Note: Elements which are already loaded or currently loading will not be touched by this method.
         *
         * @param {ParentNode} [container=document]
         */
        highlight: function highlight(container) {
          var elements = (container || document).querySelectorAll(SELECTOR);

          for (var i = 0, element; (element = elements[i++]);) {
            Prism.highlightElement(element);
          }
        }
      };

      var logged = false;
      /** @deprecated Use `Prism.plugins.fileHighlight.highlight` instead. */
      Prism.fileHighlight = function () {
        if (!logged) {
          console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
          logged = true;
        }
        Prism.plugins.fileHighlight.highlight.apply(this, arguments);
      };

    }());
  });

  (function (Prism) {

    /**
     * Returns the placeholder for the given language id and index.
     *
     * @param {string} language
     * @param {string|number} index
     * @returns {string}
     */
    function getPlaceholder(language, index) {
      return '___' + language.toUpperCase() + index + '___';
    }

    Object.defineProperties(Prism.languages['markup-templating'] = {}, {
      buildPlaceholders: {
        /**
         * Tokenize all inline templating expressions matching `placeholderPattern`.
         *
         * If `replaceFilter` is provided, only matches of `placeholderPattern` for which `replaceFilter` returns
         * `true` will be replaced.
         *
         * @param {object} env The environment of the `before-tokenize` hook.
         * @param {string} language The language id.
         * @param {RegExp} placeholderPattern The matches of this pattern will be replaced by placeholders.
         * @param {(match: string) => boolean} [replaceFilter]
         */
        value: function (env, language, placeholderPattern, replaceFilter) {
          if (env.language !== language) {
            return;
          }

          var tokenStack = env.tokenStack = [];

          env.code = env.code.replace(placeholderPattern, function (match) {
            if (typeof replaceFilter === 'function' && !replaceFilter(match)) {
              return match;
            }
            var i = tokenStack.length;
            var placeholder;

            // Check for existing strings
            while (env.code.indexOf(placeholder = getPlaceholder(language, i)) !== -1) {
              ++i;
            }

            // Create a sparse array
            tokenStack[i] = match;

            return placeholder;
          });

          // Switch the grammar to markup
          env.grammar = Prism.languages.markup;
        }
      },
      tokenizePlaceholders: {
        /**
         * Replace placeholders with proper tokens after tokenizing.
         *
         * @param {object} env The environment of the `after-tokenize` hook.
         * @param {string} language The language id.
         */
        value: function (env, language) {
          if (env.language !== language || !env.tokenStack) {
            return;
          }

          // Switch the grammar back
          env.grammar = Prism.languages[language];

          var j = 0;
          var keys = Object.keys(env.tokenStack);

          function walkTokens(tokens) {
            for (var i = 0; i < tokens.length; i++) {
              // all placeholders are replaced already
              if (j >= keys.length) {
                break;
              }

              var token = tokens[i];
              if (typeof token === 'string' || (token.content && typeof token.content === 'string')) {
                var k = keys[j];
                var t = env.tokenStack[k];
                var s = typeof token === 'string' ? token : token.content;
                var placeholder = getPlaceholder(language, k);

                var index = s.indexOf(placeholder);
                if (index > -1) {
                  ++j;

                  var before = s.substring(0, index);
                  var middle = new Prism.Token(language, Prism.tokenize(t, env.grammar), 'language-' + language, t);
                  var after = s.substring(index + placeholder.length);

                  var replacement = [];
                  if (before) {
                    replacement.push.apply(replacement, walkTokens([before]));
                  }
                  replacement.push(middle);
                  if (after) {
                    replacement.push.apply(replacement, walkTokens([after]));
                  }

                  if (typeof token === 'string') {
                    tokens.splice.apply(tokens, [i, 1].concat(replacement));
                  } else {
                    token.content = replacement;
                  }
                }
              } else if (token.content /* && typeof token.content !== 'string' */) {
                walkTokens(token.content);
              }
            }

            return tokens;
          }

          walkTokens(env.tokens);
        }
      }
    });

  }(Prism));

  var highlightCodeCompiler = function (ref) {
    var renderer = ref.renderer;

    return (renderer.code = function (code, lang) {
      if (lang === void 0) lang = 'markup';

      var langOrMarkup = prism.languages[lang] || prism.languages.markup;
      var text = prism.highlight(
        code.replace(/@DOCSIFY_QM@/g, '`'),
        langOrMarkup,
        lang
      );

      return ("<pre v-pre data-lang=\"" + lang + "\"><code class=\"lang-" + lang + "\">" + text + "</code></pre>");
    });
  };

  var paragraphCompiler = function (ref) {
    var renderer = ref.renderer;

    return (renderer.paragraph = function (text) {
      var result;
      if (/^!&gt;/.test(text)) {
        result = helper('tip', text);
      } else if (/^\?&gt;/.test(text)) {
        result = helper('warn', text);
      } else {
        result = "<p>" + text + "</p>";
      }

      return result;
    });
  };

  var taskListCompiler = function (ref) {
    var renderer = ref.renderer;

    return (renderer.list = function (body, ordered, start) {
      var isTaskList = /<li class="task-list-item">/.test(
        body.split('class="task-list"')[0]
      );
      var isStartReq = start && start > 1;
      var tag = ordered ? 'ol' : 'ul';
      var tagAttrs = [
        isTaskList ? 'class="task-list"' : '',
        isStartReq ? ("start=\"" + start + "\"") : '']
        .join(' ')
        .trim();

      return ("<" + tag + " " + tagAttrs + ">" + body + "</" + tag + ">");
    });
  };

  var taskListItemCompiler = function (ref) {
    var renderer = ref.renderer;

    return (renderer.listitem = function (text) {
      var isTaskItem = /^(<input.*type="checkbox"[^>]*>)/.test(text);
      var html = isTaskItem
        ? ("<li class=\"task-list-item\"><label>" + text + "</label></li>")
        : ("<li>" + text + "</li>");

      return html;
    });
  };

  var linkCompiler = function (ref) {
    var renderer = ref.renderer;
    var router = ref.router;
    var linkTarget = ref.linkTarget;
    var linkRel = ref.linkRel;
    var compilerClass = ref.compilerClass;

    return (renderer.link = function (href, title, text) {
      if (title === void 0) title = '';

      var attrs = [];
      var ref = getAndRemoveConfig(title);
      var str = ref.str;
      var config = ref.config;
      linkTarget = config.target || linkTarget;
      linkRel =
        linkTarget === '_blank'
          ? compilerClass.config.externalLinkRel || 'noopener'
          : '';
      title = str;

      if (
        !isAbsolutePath(href) &&
        !compilerClass._matchNotCompileLink(href) &&
        !config.ignore
      ) {
        if (href === compilerClass.config.homepage) {
          href = 'README';
        }

        href = router.toURL(href, null, router.getCurrentPath());
      } else {
        if (!isAbsolutePath(href) && href.slice(0, 2) === './') {
          href =
            document.URL.replace(/\/(?!.*\/).*/, '/').replace('#/./', '') + href;
        }
        attrs.push(href.indexOf('mailto:') === 0 ? '' : ("target=\"" + linkTarget + "\""));
        attrs.push(
          href.indexOf('mailto:') === 0
            ? ''
            : linkRel !== ''
              ? (" rel=\"" + linkRel + "\"")
              : ''
        );
      }

      if (config.disabled) {
        attrs.push('disabled');
        href = 'javascript:void(0)';
      }

      if (config.class) {
        attrs.push(("class=\"" + (config.class) + "\""));
      }

      if (config.id) {
        attrs.push(("id=\"" + (config.id) + "\""));
      }

      if (title) {
        attrs.push(("title=\"" + title + "\""));
      }

      return ("<a href=\"" + href + "\" " + (attrs.join(' ')) + ">" + text + "</a>");
    });
  };

  var cachedLinks = {};

  var compileMedia = {
    markdown: function markdown(url) {
      return {
        url: url,
      };
    },
    mermaid: function mermaid(url) {
      return {
        url: url,
      };
    },
    iframe: function iframe(url, title) {
      return {
        html: ("<iframe src=\"" + url + "\" " + (title || 'width=100% height=400') + "></iframe>"),
      };
    },
    video: function video(url, title) {
      return {
        html: ("<video src=\"" + url + "\" " + (title || 'controls') + ">Not Support</video>"),
      };
    },
    audio: function audio(url, title) {
      return {
        html: ("<audio src=\"" + url + "\" " + (title || 'controls') + ">Not Support</audio>"),
      };
    },
    code: function code(url, title) {
      var lang = url.match(/\.(\w+)$/);

      lang = title || (lang && lang[1]);
      if (lang === 'md') {
        lang = 'markdown';
      }

      return {
        url: url,
        lang: lang,
      };
    },
  };

  var Compiler = function Compiler(config, router) {
    var this$1 = this;

    this.config = config;
    this.router = router;
    this.cacheTree = {};
    this.toc = [];
    this.cacheTOC = {};
    this.linkTarget = config.externalLinkTarget || '_blank';
    this.linkRel =
      this.linkTarget === '_blank' ? config.externalLinkRel || 'noopener' : '';
    this.contentBase = router.getBasePath();

    var renderer = this._initRenderer();
    this.heading = renderer.heading;
    var compile;
    var mdConf = config.markdown || {};

    if (isFn(mdConf)) {
      compile = mdConf(marked_1, renderer);
    } else {
      marked_1.setOptions(
        merge(mdConf, {
          renderer: merge(renderer, mdConf.renderer),
        })
      );
      compile = marked_1;
    }

    this._marked = compile;
    this.compile = function (text) {
      var isCached = true;
      // eslint-disable-next-line no-unused-vars
      var result = cached(function (_) {
        isCached = false;
        var html = '';

        if (!text) {
          return text;
        }

        if (isPrimitive(text)) {
          html = compile(text);
        } else {
          html = compile.parser(text);
        }

        html = config.noEmoji ? html : emojify(html, config.nativeEmoji);
        slugify.clear();

        return html;
      })(text);

      var curFileName = this$1.router.parse().file;

      if (isCached) {
        this$1.toc = this$1.cacheTOC[curFileName];
      } else {
        this$1.cacheTOC[curFileName] = [].concat(this$1.toc);
      }

      return result;
    };
  };

  /**
   * Pulls content from file and renders inline on the page as a embedded item.
   *
   * This allows you to embed different file types on the returned
   * page.
   * The basic format is:
   * ```
   * [filename](_media/example.md ':include')
   * ```
   *
   * @param {string} href The href to the file to embed in the page.
   * @param {string} titleTitle of the link used to make the embed.
   *
   * @return {type} Return value description.
   */
  Compiler.prototype.compileEmbed = function compileEmbed(href, title) {
    var ref = getAndRemoveConfig(title);
    var str = ref.str;
    var config = ref.config;
    var embed;
    title = str;

    if (config.include) {
      if (!isAbsolutePath(href)) {
        href = getPath(
          this.contentBase,
          getParentPath(this.router.getCurrentPath()),
          href
        );
      }

      var media;
      if (config.type && (media = compileMedia[config.type])) {
        embed = media.call(this, href, title);
        embed.type = config.type;
      } else {
        var type = 'code';
        if (/\.(md|markdown)/.test(href)) {
          type = 'markdown';
        } else if (/\.mmd/.test(href)) {
          type = 'mermaid';
        } else if (/\.html?/.test(href)) {
          type = 'iframe';
        } else if (/\.(mp4|ogg)/.test(href)) {
          type = 'video';
        } else if (/\.mp3/.test(href)) {
          type = 'audio';
        }

        embed = compileMedia[type].call(this, href, title);
        embed.type = type;
      }

      embed.fragment = config.fragment;

      return embed;
    }
  };

  Compiler.prototype._matchNotCompileLink = function _matchNotCompileLink(link) {
    var links = this.config.noCompileLinks || [];

    for (var i = 0; i < links.length; i++) {
      var n = links[i];
      var re = cachedLinks[n] || (cachedLinks[n] = new RegExp(("^" + n + "$")));

      if (re.test(link)) {
        return link;
      }
    }
  };

  Compiler.prototype._initRenderer = function _initRenderer() {
    var renderer = new marked_1.Renderer();
    var ref = this;
    var linkTarget = ref.linkTarget;
    var linkRel = ref.linkRel;
    var router = ref.router;
    var contentBase = ref.contentBase;
    var _self = this;
    var origin = {};

    /**
     * Render anchor tag
     * @link https://github.com/markedjs/marked#overriding-renderer-methods
     * @param {String} text Text content
     * @param {Number} level Type of heading (h<level> tag)
     * @returns {String} Heading element
     */
    origin.heading = renderer.heading = function (text, level) {
      var ref = getAndRemoveConfig(text);
      var str = ref.str;
      var config = ref.config;
      var nextToc = { level: level, title: removeAtag(str) };

      if (/<!-- {docsify-ignore} -->/g.test(str)) {
        str = str.replace('<!-- {docsify-ignore} -->', '');
        nextToc.title = removeAtag(str);
        nextToc.ignoreSubHeading = true;
      }

      if (/{docsify-ignore}/g.test(str)) {
        str = str.replace('{docsify-ignore}', '');
        nextToc.title = removeAtag(str);
        nextToc.ignoreSubHeading = true;
      }

      if (/<!-- {docsify-ignore-all} -->/g.test(str)) {
        str = str.replace('<!-- {docsify-ignore-all} -->', '');
        nextToc.title = removeAtag(str);
        nextToc.ignoreAllSubs = true;
      }

      if (/{docsify-ignore-all}/g.test(str)) {
        str = str.replace('{docsify-ignore-all}', '');
        nextToc.title = removeAtag(str);
        nextToc.ignoreAllSubs = true;
      }

      var slug = slugify(config.id || str);
      var url = router.toURL(router.getCurrentPath(), { id: slug });
      nextToc.slug = url;
      _self.toc.push(nextToc);

      return ("<h" + level + " id=\"" + slug + "\"><a href=\"" + url + "\" data-id=\"" + slug + "\" class=\"anchor\"><span>" + str + "</span></a></h" + level + ">");
    };

    origin.code = highlightCodeCompiler({ renderer: renderer });
    origin.link = linkCompiler({
      renderer: renderer,
      router: router,
      linkTarget: linkTarget,
      linkRel: linkRel,
      compilerClass: _self,
    });
    origin.paragraph = paragraphCompiler({ renderer: renderer });
    origin.image = imageCompiler({ renderer: renderer, contentBase: contentBase, router: router });
    origin.list = taskListCompiler({ renderer: renderer });
    origin.listitem = taskListItemCompiler({ renderer: renderer });

    renderer.origin = origin;

    return renderer;
  };

  /**
   * Compile sidebar
   * @param {String} text Text content
   * @param {Number} level Type of heading (h<level> tag)
   * @returns {String} Sidebar element
   */
  Compiler.prototype.sidebar = function sidebar(text, level) {
    var ref = this;
    var toc = ref.toc;
    var currentPath = this.router.getCurrentPath();
    var html = '';

    if (text) {
      html = this.compile(text);
    } else {
      for (var i = 0; i < toc.length; i++) {
        if (toc[i].ignoreSubHeading) {
          var deletedHeaderLevel = toc[i].level;
          toc.splice(i, 1);
          // Remove headers who are under current header
          for (
            var j = i;
            j < toc.length && deletedHeaderLevel < toc[j].level;
            j++
          ) {
            toc.splice(j, 1) && j-- && i++;
          }

          i--;
        }
      }

      var tree$1 = this.cacheTree[currentPath] || genTree(toc, level);
      html = tree(tree$1, '<ul>{inner}</ul>');
      this.cacheTree[currentPath] = tree$1;
    }

    return html;
  };

  /**
   * Compile sub sidebar
   * @param {Number} level Type of heading (h<level> tag)
   * @returns {String} Sub-sidebar element
   */
  Compiler.prototype.subSidebar = function subSidebar(level) {
    if (!level) {
      this.toc = [];
      return;
    }

    var currentPath = this.router.getCurrentPath();
    var ref = this;
    var cacheTree = ref.cacheTree;
    var toc = ref.toc;

    toc[0] && toc[0].ignoreAllSubs && toc.splice(0);
    toc[0] && toc[0].level === 1 && toc.shift();

    for (var i = 0; i < toc.length; i++) {
      toc[i].ignoreSubHeading && toc.splice(i, 1) && i--;
    }

    var tree$1 = cacheTree[currentPath] || genTree(toc, level);

    cacheTree[currentPath] = tree$1;
    this.toc = [];
    return tree(tree$1);
  };

  Compiler.prototype.header = function header(text, level) {
    return this.heading(text, level);
  };

  Compiler.prototype.article = function article(text) {
    return this.compile(text);
  };

  /**
   * Compile cover page
   * @param {Text} text Text content
   * @returns {String} Cover page
   */
  Compiler.prototype.cover = function cover(text) {
    var cacheToc = this.toc.slice();
    var html = this.compile(text);

    this.toc = cacheToc.slice();

    return html;
  };

  var minIndent = function (string) {
    var match = string.match(/^[ \t]*(?=\S)/gm);

    if (!match) {
      return 0;
    }

    return match.reduce(function (r, a) { return Math.min(r, a.length); }, Infinity);
  };

  var stripIndent = function (string) {
    var indent = minIndent(string);

    if (indent === 0) {
      return string;
    }

    var regex = new RegExp(("^[ \\t]{" + indent + "}"), 'gm');

    return string.replace(regex, '');
  };

  var cached$2 = {};

  function walkFetchEmbed(ref, cb) {
    var embedTokens = ref.embedTokens;
    var compile = ref.compile;
    var fetch = ref.fetch;

    var token;
    var step = 0;
    var count = 1;

    if (!embedTokens.length) {
      return cb({});
    }

    while ((token = embedTokens[step++])) {
      // eslint-disable-next-line no-shadow
      var next = (function (token) {
        return function (text) {
          var embedToken;
          if (text) {
            if (token.embed.type === 'markdown') {
              var path = token.embed.url.split('/');
              path.pop();
              path = path.join('/');
              // Resolves relative links to absolute
              text = text.replace(/\[([^[\]]+)\]\(([^)]+)\)/g, function (x) {
                var linkBeginIndex = x.indexOf('(');
                if (x.slice(linkBeginIndex, linkBeginIndex + 2) === '(.') {
                  return (
                    x.substring(0, linkBeginIndex) +
                    "(" + (window.location.protocol) + "//" + (window.location.host) + path + "/" +
                    x.substring(linkBeginIndex + 1, x.length - 1) +
                    ')'
                  );
                }
                return x;
              });

              // This may contain YAML front matter and will need to be stripped.
              var frontMatterInstalled =
                ($docsify.frontMatter || {}).installed || false;
              if (frontMatterInstalled === true) {
                text = $docsify.frontMatter.parseMarkdown(text);
              }

              embedToken = compile.lexer(text);
            } else if (token.embed.type === 'code') {
              if (token.embed.fragment) {
                var fragment = token.embed.fragment;
                var pattern = new RegExp(
                  ("(?:###|\\/\\/\\/)\\s*\\[" + fragment + "\\]([\\s\\S]*)(?:###|\\/\\/\\/)\\s*\\[" + fragment + "\\]")
                );
                text = stripIndent((text.match(pattern) || [])[1] || '').trim();
              }

              embedToken = compile.lexer(
                '```' +
                token.embed.lang +
                '\n' +
                text.replace(/`/g, '@DOCSIFY_QM@') +
                '\n```\n'
              );
            } else if (token.embed.type === 'mermaid') {
              embedToken = [
                { type: 'html', text: ("<div class=\"mermaid\">\n" + text + "\n</div>") }];
              embedToken.links = {};
            } else {
              embedToken = [{ type: 'html', text: text }];
              embedToken.links = {};
            }
          }

          cb({ token: token, embedToken: embedToken });
          if (++count >= step) {
            cb({});
          }
        };
      })(token);

      if (token.embed.url) {
        {
          get(token.embed.url).then(next);
        }
      } else {
        next(token.embed.html);
      }
    }
  }

  function prerenderEmbed(ref, done) {
    var compiler = ref.compiler;
    var raw = ref.raw; if (raw === void 0) raw = '';
    var fetch = ref.fetch;

    var hit = cached$2[raw];
    if (hit) {
      var copy = hit.slice();
      copy.links = hit.links;
      return done(copy);
    }

    var compile = compiler._marked;
    var tokens = compile.lexer(raw);
    var embedTokens = [];
    var linkRE = compile.Lexer.rules.inline.link;
    var links = tokens.links;

    tokens.forEach(function (token, index) {
      if (token.type === 'paragraph') {
        token.text = token.text.replace(
          new RegExp(linkRE.source, 'g'),
          function (src, filename, href, title) {
            var embed = compiler.compileEmbed(href, title);

            if (embed) {
              embedTokens.push({
                index: index,
                embed: embed,
              });
            }

            return src;
          }
        );
      }
    });

    // keep track of which tokens have been embedded so far
    // so that we know where to insert the embedded tokens as they
    // are returned
    var moves = [];
    walkFetchEmbed({ compile: compile, embedTokens: embedTokens, fetch: fetch }, function (ref) {
      var embedToken = ref.embedToken;
      var token = ref.token;

      if (token) {
        // iterate through the array of previously inserted tokens
        // to determine where the current embedded tokens should be inserted
        var index = token.index;
        moves.forEach(function (pos) {
          if (index > pos.start) {
            index += pos.length;
          }
        });

        merge(links, embedToken.links);

        tokens = tokens
          .slice(0, index)
          .concat(embedToken, tokens.slice(index + 1));
        moves.push({ start: index, length: embedToken.length - 1 });
      } else {
        cached$2[raw] = tokens.concat();
        tokens.links = cached$2[raw].links = links;
        done(tokens);
      }
    });
  }

  /* eslint-disable no-unused-vars */

  var vueGlobalData;

  function executeScript() {
    var script = findAll('.markdown-section>script')
      .filter(function (s) { return !/template/.test(s.type); })[0];
    if (!script) {
      return false;
    }

    var code = script.innerText.trim();
    if (!code) {
      return false;
    }

    new Function(code)();
  }

  function formatUpdated(html, updated, fn) {
    updated =
      typeof fn === 'function'
        ? fn(updated)
        : typeof fn === 'string'
          ? tinydate(fn)(new Date(updated))
          : updated;

    return html.replace(/{docsify-updated}/g, updated);
  }

  function renderMain(html) {
    var docsifyConfig = this.config;
    var markdownElm = find('.markdown-section');
    var vueVersion =
      'Vue' in window &&
      window.Vue.version &&
      Number(window.Vue.version.charAt(0));

    var isMountedVue = function (elm) {
      var isVue2 = Boolean(elm.__vue__ && elm.__vue__._isVue);
      var isVue3 = Boolean(elm._vnode && elm._vnode.__v_skip);

      return isVue2 || isVue3;
    };

    if (!html) {
      html = '<h1>404 - Not found</h1>';
    }

    if ('Vue' in window) {
      var mountedElms = findAll('.markdown-section > *')
        .filter(function (elm) { return isMountedVue(elm); });

      // Destroy/unmount existing Vue instances
      for (var i = 0, list = mountedElms; i < list.length; i += 1) {
        var mountedElm = list[i];

        if (vueVersion === 2) {
          mountedElm.__vue__.$destroy();
        } else if (vueVersion === 3) {
          mountedElm.__vue_app__.unmount();
        }
      }
    }

    this._renderTo(markdownElm, html);

    // Render sidebar with the TOC
    !docsifyConfig.loadSidebar && this._renderSidebar();

    // Execute markdown <script>
    if (
      docsifyConfig.executeScript ||
      ('Vue' in window && docsifyConfig.executeScript !== false)
    ) {
      executeScript();
    }

    // Handle Vue content not mounted by markdown <script>
    if ('Vue' in window) {
      var vueMountData = [];
      var vueComponentNames = Object.keys(docsifyConfig.vueComponents || {});

      // Register global vueComponents
      if (vueVersion === 2 && vueComponentNames.length) {
        vueComponentNames.forEach(function (name) {
          var isNotRegistered = !window.Vue.options.components[name];

          if (isNotRegistered) {
            window.Vue.component(name, docsifyConfig.vueComponents[name]);
          }
        });
      }

      // Store global data() return value as shared data object
      if (
        !vueGlobalData &&
        docsifyConfig.vueGlobalOptions &&
        typeof docsifyConfig.vueGlobalOptions.data === 'function'
      ) {
        vueGlobalData = docsifyConfig.vueGlobalOptions.data();
      }

      // vueMounts
      vueMountData.push.apply(
        vueMountData, Object.keys(docsifyConfig.vueMounts || {})
          .map(function (cssSelector) {
            return [
              find(markdownElm, cssSelector),
              docsifyConfig.vueMounts[cssSelector]];
          })
          .filter(function (ref) {
            var elm = ref[0];
            var vueConfig = ref[1];

            return elm;
          })
      );

      // Template syntax, vueComponents, vueGlobalOptions
      if (docsifyConfig.vueGlobalOptions || vueComponentNames.length) {
        var reHasBraces = /{{2}[^{}]*}{2}/;
        // Matches Vue full and shorthand syntax as attributes in HTML tags.
        //
        // Full syntax examples:
        // v-foo, v-foo[bar], v-foo-bar, v-foo:bar-baz.prop
        //
        // Shorthand syntax examples:
        // @foo, @foo.bar, @foo.bar.baz, @[foo], :foo, :[foo]
        //
        // Markup examples:
        // <div v-html>{{ html }}</div>
        // <div v-text="msg"></div>
        // <div v-bind:text-content.prop="text">
        // <button v-on:click="doThis"></button>
        // <button v-on:click.once="doThis"></button>
        // <button v-on:[event]="doThis"></button>
        // <button @click.stop.prevent="doThis">
        // <a :href="url">
        // <a :[key]="url">
        var reHasDirective = /<[^>/]+\s([@:]|v-)[\w-:.[\]]+[=>\s]/;

        vueMountData.push.apply(
          vueMountData, findAll('.markdown-section > *')
            // Remove duplicates
            .filter(function (elm) {
              return !vueMountData.some(function (ref) {
                var e = ref[0];
                var c = ref[1];

                return e === elm;
              });
            })
            // Detect Vue content
            .filter(function (elm) {
              var isVueMount =
                // is a component
                elm.tagName.toLowerCase() in
                (docsifyConfig.vueComponents || {}) ||
                // has a component(s)
                elm.querySelector(vueComponentNames.join(',') || null) ||
                // has curly braces
                reHasBraces.test(elm.outerHTML) ||
                // has content directive
                reHasDirective.test(elm.outerHTML);

              return isVueMount;
            })
            .map(function (elm) {
              // Clone global configuration
              var vueConfig = merge({}, docsifyConfig.vueGlobalOptions || {});

              // Replace vueGlobalOptions data() return value with shared data object.
              // This provides a global store for all Vue instances that receive
              // vueGlobalOptions as their configuration.
              if (vueGlobalData) {
                vueConfig.data = function () {
                  return vueGlobalData;
                };
              }

              return [elm, vueConfig];
            })
        );
      }

      // Mount
      for (var i$1 = 0, list$1 = vueMountData; i$1 < list$1.length; i$1 += 1) {
        var ref = list$1[i$1];
        var mountElm = ref[0];
        var vueConfig = ref[1];

        var isVueAttr = 'data-isvue';
        var isSkipElm =
          // Is an invalid tag
          mountElm.matches('pre, script') ||
          // Is a mounted instance
          isMountedVue(mountElm) ||
          // Has mounted instance(s)
          mountElm.querySelector(("[" + isVueAttr + "]"));

        if (!isSkipElm) {
          mountElm.setAttribute(isVueAttr, '');

          if (vueVersion === 2) {
            vueConfig.el = undefined;
            new window.Vue(vueConfig).$mount(mountElm);
          } else if (vueVersion === 3) {
            var app = window.Vue.createApp(vueConfig);

            // Register global vueComponents
            vueComponentNames.forEach(function (name) {
              var config = docsifyConfig.vueComponents[name];

              app.component(name, config);
            });

            app.mount(mountElm);
          }
        }
      }
    }
  }

  function renderNameLink(vm) {
    var el = getNode('.app-name-link');
    var nameLink = vm.config.nameLink;
    var path = vm.route.path;

    if (!el) {
      return;
    }

    if (isPrimitive(vm.config.nameLink)) {
      el.setAttribute('href', nameLink);
    } else if (typeof nameLink === 'object') {
      var match = Object.keys(nameLink).filter(
        function (key) { return path.indexOf(key) > -1; }
      )[0];

      el.setAttribute('href', nameLink[match]);
    }
  }

  /** @typedef {import('../Docsify').Constructor} Constructor */

  /**
   * @template {!Constructor} T
   * @param {T} Base - The class to extend
   */
  function Render(Base) {
    return /*@__PURE__*/(function (Base) {
      function Render() {
        Base.apply(this, arguments);
      }

      if (Base) Render.__proto__ = Base;
      Render.prototype = Object.create(Base && Base.prototype);
      Render.prototype.constructor = Render;

      Render.prototype._renderTo = function _renderTo(el, content, replace) {
        var node = getNode(el);
        if (node) {
          node[replace ? 'outerHTML' : 'innerHTML'] = content;
        }
      };

      Render.prototype._renderSidebar = function _renderSidebar(text) {
        var ref = this.config;
        var maxLevel = ref.maxLevel;
        var subMaxLevel = ref.subMaxLevel;
        var loadSidebar = ref.loadSidebar;
        var hideSidebar = ref.hideSidebar;

        if (hideSidebar) {
          // FIXME : better styling solution
          [
            document.querySelector('aside.sidebar'),
            document.querySelector('button.sidebar-toggle')]
            .filter(function (e) { return !!e; })
            .forEach(function (node) { return node.parentNode.removeChild(node); });
          document.querySelector('section.content').style.right = 'unset';
          document.querySelector('section.content').style.left = 'unset';
          document.querySelector('section.content').style.position = 'relative';
          document.querySelector('section.content').style.width = '100%';
          return null;
        }

        this._renderTo('.sidebar-nav', this.compiler.sidebar(text, maxLevel));
        var activeEl = getAndActive(this.router, '.sidebar-nav', true, true);
        if (loadSidebar && activeEl) {
          activeEl.parentNode.innerHTML +=
            this.compiler.subSidebar(subMaxLevel) || '';
        } else {
          // Reset toc
          this.compiler.subSidebar();
        }

        // Bind event
        this._bindEventOnRendered(activeEl);
      };

      Render.prototype._bindEventOnRendered = function _bindEventOnRendered(activeEl) {
        var ref = this.config;
        var autoHeader = ref.autoHeader;

        scrollActiveSidebar(this.router);

        if (autoHeader && activeEl) {
          var main = getNode('#main');
          var firstNode = main.children[0];
          if (firstNode && firstNode.tagName !== 'H1') {
            var h1 = this.compiler.header(activeEl.innerText, 1);
            var wrapper = create('div', h1);
            before(main, wrapper.children[0]);
          }
        }
      };

      Render.prototype._renderNav = function _renderNav(text) {
        text && this._renderTo('nav', this.compiler.compile(text));
        if (this.config.loadNavbar) {
          getAndActive(this.router, 'nav');
        }
      };

      Render.prototype._renderMain = function _renderMain(text, opt, next) {
        var this$1 = this;
        if (opt === void 0) opt = {};

        if (!text) {
          return renderMain.call(this, text);
        }

        this.callHook('beforeEach', text, function (result) {
          var html;
          var callback = function () {
            if (opt.updatedAt) {
              html = formatUpdated(
                html,
                opt.updatedAt,
                this$1.config.formatUpdated
              );
            }

            this$1.callHook('afterEach', html, function (hookData) {
              renderMain.call(this$1, hookData);
              next();
            });
          };

          if (this$1.isHTML) {
            html = this$1.result = text;
            callback();
          } else {
            prerenderEmbed(
              {
                compiler: this$1.compiler,
                raw: result,
              },
              function (tokens) {
                html = this$1.compiler.compile(tokens);
                callback();
              }
            );
          }
        });
      };

      Render.prototype._renderCover = function _renderCover(text, coverOnly) {
        var el = getNode('.cover');

        toggleClass(
          getNode('main'),
          coverOnly ? 'add' : 'remove',
          'hidden'
        );
        if (!text) {
          toggleClass(el, 'remove', 'show');
          return;
        }

        toggleClass(el, 'add', 'show');

        var html = this.coverIsHTML ? text : this.compiler.cover(text);

        var m = html
          .trim()
          .match('<p><img.*?data-origin="(.*?)"[^a]+alt="(.*?)">([^<]*?)</p>$');

        if (m) {
          if (m[2] === 'color') {
            el.style.background = m[1] + (m[3] || '');
          } else {
            var path = m[1];

            toggleClass(el, 'add', 'has-mask');
            if (!isAbsolutePath(m[1])) {
              path = getPath(this.router.getBasePath(), m[1]);
            }

            el.style.backgroundImage = "url(" + path + ")";
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center center';
          }

          html = html.replace(m[0], '');
        }

        this._renderTo('.cover-main', html);
        sticky();
      };

      Render.prototype._updateRender = function _updateRender() {
        // Render name link
        renderNameLink(this);
      };

      Render.prototype.initRender = function initRender() {
        var config = this.config;

        // Init markdown compiler
        this.compiler = new Compiler(config, this.router);
        {
          /* eslint-disable-next-line camelcase */
          window.__current_docsify_compiler__ = this.compiler;
        }

        var id = config.el || '#app';
        var navEl = find('nav') || create('nav');

        var el = find(id);
        var html = '';
        var navAppendToTarget = body;

        if (el) {
          if (config.repo) {
            html += corner(config.repo, config.cornerExternalLinkTarget);
          }

          if (config.coverpage) {
            html += cover();
          }

          if (config.logo) {
            var isBase64 = /^data:image/.test(config.logo);
            var isExternal = /(?:http[s]?:)?\/\//.test(config.logo);
            var isRelative = /^\./.test(config.logo);

            if (!isBase64 && !isExternal && !isRelative) {
              config.logo = getPath(this.router.getBasePath(), config.logo);
            }
          }

          html += main(config);
          // Render main app
          this._renderTo(el, html, true);
        } else {
          this.rendered = true;
        }

        if (config.mergeNavbar && isMobile) {
          navAppendToTarget = find('.sidebar');
        } else {
          navEl.classList.add('app-nav');

          if (!config.repo) {
            navEl.classList.add('no-badge');
          }
        }

        // Add nav
        if (config.loadNavbar) {
          before(navAppendToTarget, navEl);
        }

        if (config.themeColor) {
          $.head.appendChild(
            create('div', theme(config.themeColor)).firstElementChild
          );
          // Polyfll
          cssVars(config.themeColor);
        }

        this._updateRender();
        toggleClass(body, 'ready');
      };

      return Render;
    }(Base));
  }

  /* eslint-disable no-unused-vars */

  function loadNested(path, qs, file, next, vm, first) {
    path = first ? path : path.replace(/\/$/, '');
    path = getParentPath(path);

    if (!path) {
      return;
    }

    get(
      vm.router.getFile(path + file) + qs,
      false,
      vm.config.requestHeaders
    ).then(next, function (_) { return loadNested(path, qs, file, next, vm); });
  }

  /** @typedef {import('../Docsify').Constructor} Constructor */

  /**
   * @template {!Constructor} T
   * @param {T} Base - The class to extend
   */
  function Fetch(Base) {
    var last;

    var abort = function () { return last && last.abort && last.abort(); };
    var request = function (url, hasbar, requestHeaders) {
      abort();
      last = get(url, true, requestHeaders);
      return last;
    };

    var get404Path = function (path, config) {
      var notFoundPage = config.notFoundPage;
      var ext = config.ext;
      var defaultPath = '_404' + (ext || '.md');
      var key;
      var path404;

      switch (typeof notFoundPage) {
        case 'boolean':
          path404 = defaultPath;
          break;
        case 'string':
          path404 = notFoundPage;
          break;

        case 'object':
          key = Object.keys(notFoundPage)
            .sort(function (a, b) { return b.length - a.length; })
            .filter(function (k) { return path.match(new RegExp('^' + k)); })[0];

          path404 = (key && notFoundPage[key]) || defaultPath;
          break;
      }

      return path404;
    };

    return /*@__PURE__*/(function (Base) {
      function Fetch() {
        Base.apply(this, arguments);
      }

      if (Base) Fetch.__proto__ = Base;
      Fetch.prototype = Object.create(Base && Base.prototype);
      Fetch.prototype.constructor = Fetch;

      Fetch.prototype._loadSideAndNav = function _loadSideAndNav(path, qs, loadSidebar, cb) {
        var this$1 = this;

        return function () {
          if (!loadSidebar) {
            return cb();
          }

          var fn = function (result) {
            this$1._renderSidebar(result);
            cb();
          };

          // Load sidebar
          loadNested(path, qs, loadSidebar, fn, this$1, true);
        };
      };

      Fetch.prototype._fetch = function _fetch(cb) {
        var this$1 = this;
        if (cb === void 0) cb = noop;

        var ref = this.route;
        var query = ref.query;
        var ref$1 = this.route;
        var path = ref$1.path;

        // Prevent loading remote content via URL hash
        // Ex: https://foo.com/#//bar.com/file.md
        if (isExternal(path)) {
          history.replaceState(null, '', '#');
          this.router.normalize();
        } else {
          var qs = stringifyQuery(query, ['id']);
          var ref$2 = this.config;
          var loadNavbar = ref$2.loadNavbar;
          var requestHeaders = ref$2.requestHeaders;
          var loadSidebar = ref$2.loadSidebar;
          // Abort last request

          var file = this.router.getFile(path);

          this.isRemoteUrl = isExternal(file);
          // Current page is html
          this.isHTML = /\.html$/g.test(file);

          // create a handler that should be called if content was fetched successfully
          var contentFetched = function (text, opt) {
            this$1._renderMain(
              text,
              opt,
              this$1._loadSideAndNav(path, qs, loadSidebar, cb)
            );
          };

          // and a handler that is called if content failed to fetch
          var contentFailedToFetch = function (_) {
            this$1._fetchFallbackPage(path, qs, cb) || this$1._fetch404(file, qs, cb);
          };

          // attempt to fetch content from a virtual route, and fallback to fetching the actual file
          if (!this.isRemoteUrl) {
            this.matchVirtualRoute(path).then(function (contents) {
              if (typeof contents === 'string') {
                contentFetched(contents);
              } else {
                request(file + qs, true, requestHeaders).then(
                  contentFetched,
                  contentFailedToFetch
                );
              }
            });
          } else {
            // if the requested url is not local, just fetch the file
            request(file + qs, true, requestHeaders).then(
              contentFetched,
              contentFailedToFetch
            );
          }

          // Load nav
          loadNavbar &&
            loadNested(
              path,
              qs,
              loadNavbar,
              function (text) { return this$1._renderNav(text); },
              this,
              true
            );
        }
      };

      Fetch.prototype._fetchCover = function _fetchCover() {
        var this$1 = this;

        var ref = this.config;
        var coverpage = ref.coverpage;
        var requestHeaders = ref.requestHeaders;
        var query = this.route.query;
        var root = getParentPath(this.route.path);

        if (coverpage) {
          var path = null;
          var routePath = this.route.path;
          if (typeof coverpage === 'string') {
            if (routePath === '/') {
              path = coverpage;
            }
          } else if (Array.isArray(coverpage)) {
            path = coverpage.indexOf(routePath) > -1 && '_coverpage';
          } else {
            var cover = coverpage[routePath];
            path = cover === true ? '_coverpage' : cover;
          }

          var coverOnly = Boolean(path) && this.config.onlyCover;
          if (path) {
            path = this.router.getFile(root + path);
            this.coverIsHTML = /\.html$/g.test(path);
            get(path + stringifyQuery(query, ['id']), false, requestHeaders).then(
              function (text) { return this$1._renderCover(text, coverOnly); }
            );
          } else {
            this._renderCover(null, coverOnly);
          }

          return coverOnly;
        }
      };

      Fetch.prototype.$fetch = function $fetch(cb, $resetEvents) {
        var this$1 = this;
        if (cb === void 0) cb = noop;
        if ($resetEvents === void 0) $resetEvents = this.$resetEvents.bind(this);

        var done = function () {
          this$1.callHook('doneEach');
          cb();
        };

        var onlyCover = this._fetchCover();

        if (onlyCover) {
          done();
        } else {
          this._fetch(function () {
            $resetEvents();
            done();
          });
        }
      };

      Fetch.prototype._fetchFallbackPage = function _fetchFallbackPage(path, qs, cb) {
        var this$1 = this;
        if (cb === void 0) cb = noop;

        var ref = this.config;
        var requestHeaders = ref.requestHeaders;
        var fallbackLanguages = ref.fallbackLanguages;
        var loadSidebar = ref.loadSidebar;

        if (!fallbackLanguages) {
          return false;
        }

        var local = path.split('/')[1];

        if (fallbackLanguages.indexOf(local) === -1) {
          return false;
        }

        var newPath = this.router.getFile(
          path.replace(new RegExp(("^/" + local)), '')
        );
        var req = request(newPath + qs, true, requestHeaders);

        req.then(
          function (text, opt) {
            return this$1._renderMain(
              text,
              opt,
              this$1._loadSideAndNav(path, qs, loadSidebar, cb)
            );
          },
          function () { return this$1._fetch404(path, qs, cb); }
        );

        return true;
      };

      /**
       * Load the 404 page
       * @param {String} path URL to be loaded
       * @param {*} qs TODO: define
       * @param {Function} cb Callback
       * @returns {Boolean} True if the requested page is not found
       * @private
       */
      Fetch.prototype._fetch404 = function _fetch404(path, qs, cb) {
        var this$1 = this;
        if (cb === void 0) cb = noop;

        var ref = this.config;
        var loadSidebar = ref.loadSidebar;
        var requestHeaders = ref.requestHeaders;
        var notFoundPage = ref.notFoundPage;

        var fnLoadSideAndNav = this._loadSideAndNav(path, qs, loadSidebar, cb);
        if (notFoundPage) {
          var path404 = get404Path(path, this.config);

          request(this.router.getFile(path404), true, requestHeaders).then(
            function (text, opt) { return this$1._renderMain(text, opt, fnLoadSideAndNav); },
            function () { return this$1._renderMain(null, {}, fnLoadSideAndNav); }
          );
          return true;
        }

        this._renderMain(null, {}, fnLoadSideAndNav);
        return false;
      };

      Fetch.prototype.initFetch = function initFetch() {
        var this$1 = this;

        var ref = this.config;
        var loadSidebar = ref.loadSidebar;

        // Server-Side Rendering
        if (this.rendered) {
          var activeEl = getAndActive(this.router, '.sidebar-nav', true, true);
          if (loadSidebar && activeEl) {
            activeEl.parentNode.innerHTML += window.__SUB_SIDEBAR__;
          }

          this._bindEventOnRendered(activeEl);
          this.$resetEvents();
          this.callHook('doneEach');
          this.callHook('ready');
        } else {
          this.$fetch(function (_) { return this$1.callHook('ready'); });
        }
      };

      return Fetch;
    }(Base));
  }

  /** @typedef {import('../Docsify').Constructor} Constructor */

  /**
   * @template {!Constructor} T
   * @param {T} Base - The class to extend
   */
  function Events(Base) {
    return /*@__PURE__*/(function (Base) {
      function Events() {
        Base.apply(this, arguments);
      }

      if (Base) Events.__proto__ = Base;
      Events.prototype = Object.create(Base && Base.prototype);
      Events.prototype.constructor = Events;

      Events.prototype.$resetEvents = function $resetEvents(source) {
        var this$1 = this;

        var ref = this.config;
        var auto2top = ref.auto2top;

        (function () {
          // Rely on the browser's scroll auto-restoration when going back or forward
          if (source === 'history') {
            return;
          }
          // Scroll to ID if specified
          if (this$1.route.query.id) {
            scrollIntoView(this$1.route.path, this$1.route.query.id);
          }
          // Scroll to top if a link was clicked and auto2top is enabled
          if (source === 'navigate') {
            auto2top && scroll2Top(auto2top);
          }
        })();

        if (this.config.loadNavbar) {
          getAndActive(this.router, 'nav');
        }
      };

      Events.prototype.initEvent = function initEvent() {
        // Bind toggle button
        btn('button.sidebar-toggle', this.router);
        collapse('.sidebar', this.router);
        // Bind sticky effect
        if (this.config.coverpage) {
          !isMobile && on('scroll', sticky);
        } else {
          body.classList.add('sticky');
        }
      };

      return Events;
    }(Base));
  }

  /**
   * Adds beginning of input (^) and end of input ($) assertions if needed into a regex string
   * @param {string} matcher the string to match
   * @returns {string}
   */
  function makeExactMatcher(matcher) {
    var matcherWithBeginningOfInput = startsWith(matcher, '^')
      ? matcher
      : ("^" + matcher);

    var matcherWithBeginningAndEndOfInput = endsWith(
      matcherWithBeginningOfInput,
      '$'
    )
      ? matcherWithBeginningOfInput
      : (matcherWithBeginningOfInput + "$");

    return matcherWithBeginningAndEndOfInput;
  }

  /** @typedef {((value: any) => void) => void} OnNext */
  /** @typedef {(value: any) => void} NextFunction */

  /**
   * Creates a pair of a function and an event emitter.
   * When the function is called, the event emitter calls the given callback with the value that was passed to the function.
   * @returns {[NextFunction, OnNext]}
   */
  function createNextFunction() {
    var storedCb = function () { return null; };

    function next(value) {
      storedCb(value);
    }

    function onNext(cb) {
      storedCb = cb;
    }

    return [next, onNext];
  }

  /** @typedef {import('../Docsify').Constructor} Constructor */

  /** @typedef {Record<string, string | VirtualRouteHandler>} VirtualRoutesMap */
  /** @typedef {(route: string, match: RegExpMatchArray | null) => string | void | Promise<string | void> } VirtualRouteHandler */

  /**
   * @template {!Constructor} T
   * @param {T} Base - The class to extend
   */
  function VirtualRoutes(Base) {
    return /*@__PURE__*/(function (Base) {
      function VirtualRoutes() {
        Base.apply(this, arguments);
      }

      if (Base) VirtualRoutes.__proto__ = Base;
      VirtualRoutes.prototype = Object.create(Base && Base.prototype);
      VirtualRoutes.prototype.constructor = VirtualRoutes;

      VirtualRoutes.prototype.routes = function routes() {
        return this.config.routes || {};
      };

      /**
       * Attempts to match the given path with a virtual route.
       * @param {string} path the path of the route to match
       * @returns {Promise<string | null>} resolves to string if route was matched, otherwise null
       */
      VirtualRoutes.prototype.matchVirtualRoute = function matchVirtualRoute(path) {
        var virtualRoutes = this.routes();
        var virtualRoutePaths = Object.keys(virtualRoutes);

        var done = function () { return null; };

        /**
         * This is a tail recursion that iterates over all the available routes.
         * It can result in one of two ways:
         * 1. Call itself (essentially reviewing the next route)
         * 2. Call the "done" callback with the result (either the contents, or "null" if no match was found)
         */
        function asyncMatchNextRoute() {
          var virtualRoutePath = virtualRoutePaths.shift();
          if (!virtualRoutePath) {
            return done(null);
          }

          var matcher = makeExactMatcher(virtualRoutePath);
          var matched = path.match(matcher);

          if (!matched) {
            return asyncMatchNextRoute();
          }

          var virtualRouteContentOrFn = virtualRoutes[virtualRoutePath];

          if (typeof virtualRouteContentOrFn === 'string') {
            var contents = virtualRouteContentOrFn;
            return done(contents);
          }

          if (typeof virtualRouteContentOrFn === 'function') {
            var fn = virtualRouteContentOrFn;

            var ref = createNextFunction();
            var next = ref[0];
            var onNext = ref[1];
            onNext(function (contents) {
              if (typeof contents === 'string') {
                return done(contents);
              } else if (contents === false) {
                return done(null);
              } else {
                return asyncMatchNextRoute();
              }
            });

            if (fn.length <= 2) {
              var returnedValue = fn(path, matched);
              return next(returnedValue);
            } else {
              return fn(path, matched, next);
            }
          }

          return asyncMatchNextRoute();
        }

        return {
          then: function (cb) {
            done = cb;
            asyncMatchNextRoute();
          },
        };
      };

      return VirtualRoutes;
    }(Base));
  }



  var util = /*#__PURE__*/Object.freeze({
    __proto__: null,
    cached: cached,
    hyphenate: hyphenate,
    hasOwn: hasOwn,
    merge: merge,
    isPrimitive: isPrimitive,
    noop: noop,
    isFn: isFn,
    isExternal: isExternal,
    inBrowser: inBrowser,
    isMobile: isMobile,
    supportsPushState: supportsPushState,
    parseQuery: parseQuery,
    stringifyQuery: stringifyQuery,
    isAbsolutePath: isAbsolutePath,
    removeParams: removeParams,
    getParentPath: getParentPath,
    cleanPath: cleanPath,
    resolvePath: resolvePath,
    getPath: getPath,
    replaceSlug: replaceSlug
  });

  // TODO This is deprecated, kept for backwards compatibility. Remove in next
  // major release. We'll tell people to get everything from the DOCSIFY global
  // when using the global build, but we'll highly recommend for them to import
  // from the ESM build (f.e. lib/docsify.esm.js and lib/docsify.min.esm.js).
  function initGlobalAPI() {
    window.Docsify = {
      util: util,
      dom: dom,
      get: get,
      slugify: slugify,
      version: '4.13.1',
    };
    window.DocsifyCompiler = Compiler;
    window.marked = marked_1;
    window.Prism = prism;
  }

  /** @typedef {import('../Docsify').Constructor} Constructor */

  /**
   * @template {!Constructor} T
   * @param {T} Base - The class to extend
   */
  function Lifecycle(Base) {
    return /*@__PURE__*/(function (Base) {
      function Lifecycle() {
        Base.apply(this, arguments);
      }

      if (Base) Lifecycle.__proto__ = Base;
      Lifecycle.prototype = Object.create(Base && Base.prototype);
      Lifecycle.prototype.constructor = Lifecycle;

      Lifecycle.prototype.initLifecycle = function initLifecycle() {
        var this$1 = this;

        var hooks = [
          'init',
          'mounted',
          'beforeEach',
          'afterEach',
          'doneEach',
          'ready'];

        this._hooks = {};
        this._lifecycle = {};

        hooks.forEach(function (hook) {
          var arr = (this$1._hooks[hook] = []);
          this$1._lifecycle[hook] = function (fn) { return arr.push(fn); };
        });
      };

      Lifecycle.prototype.callHook = function callHook(hookName, data, next) {
        if (next === void 0) next = noop;

        var queue = this._hooks[hookName];
        var catchPluginErrors = this.config.catchPluginErrors;

        var step = function (index) {
          var hookFn = queue[index];

          if (index >= queue.length) {
            next(data);
          } else if (typeof hookFn === 'function') {
            var errTitle = 'Docsify plugin error';

            if (hookFn.length === 2) {
              try {
                hookFn(data, function (result) {
                  data = result;
                  step(index + 1);
                });
              } catch (err) {
                if (catchPluginErrors) {
                  console.error(errTitle, err);
                } else {
                  throw err;
                }

                step(index + 1);
              }
            } else {
              try {
                var result = hookFn(data);

                data = result === undefined ? data : result;
                step(index + 1);
              } catch (err) {
                if (catchPluginErrors) {
                  console.error(errTitle, err);
                } else {
                  throw err;
                }

                step(index + 1);
              }
            }
          } else {
            step(index + 1);
          }
        };

        step(0);
      };

      return Lifecycle;
    }(Base));
  }

  /** @typedef {new (...args: any[]) => any} Constructor */

  // eslint-disable-next-line new-cap
  var Docsify = /*@__PURE__*/(function (superclass) {
    function Docsify() {
      superclass.call(this);

      this.config = config(this);

      this.initLifecycle(); // Init hooks
      this.initPlugin(); // Install plugins
      this.callHook('init');
      this.initRouter(); // Add router
      this.initRender(); // Render base DOM
      this.initEvent(); // Bind events
      this.initFetch(); // Fetch data
      this.callHook('mounted');
    }

    if (superclass) Docsify.__proto__ = superclass;
    Docsify.prototype = Object.create(superclass && superclass.prototype);
    Docsify.prototype.constructor = Docsify;

    Docsify.prototype.initPlugin = function initPlugin() {
      var this$1 = this;

      [].concat(this.config.plugins).forEach(function (fn) {
        try {
          isFn(fn) && fn(this$1._lifecycle, this$1);
        } catch (err) {
          if (this$1.config.catchPluginErrors) {
            var errTitle = 'Docsify plugin error';
            console.error(errTitle, err);
          } else {
            throw err;
          }
        }
      });
    };

    return Docsify;
  }(Fetch(
    // eslint-disable-next-line new-cap
    Events(Render(VirtualRoutes(Router(Lifecycle(Object)))))
  )));

  /**
   * Global API
   */
  initGlobalAPI();

  /**
   * Run Docsify
   */
  // eslint-disable-next-line no-unused-vars
  documentReady(function (_) { return new Docsify(); });

}());
