/*!
 * docsify-tabs
 * v1.6.0
 * https://jhildenbiddle.github.io/docsify-tabs/
 * (c) 2018-2022 John Hildenbiddle
 * MIT license
 */
!(function () {
  'use strict';
  !(function (t, a) {
    void 0 === a && (a = {});
    var o = a.insertAt;
    if (t && 'undefined' != typeof document) {
      var e = document.head || document.getElementsByTagName('head')[0],
        c = document.createElement('style');
      (c.type = 'text/css'),
        'top' === o && e.firstChild ? e.insertBefore(c, e.firstChild) : e.appendChild(c),
        c.styleSheet ? (c.styleSheet.cssText = t) : c.appendChild(document.createTextNode(t));
    }
  })(
    ':root{--docsifytabs-border-color:#ededed;--docsifytabs-border-px:1px;--docsifytabs-border-radius-px: ;--docsifytabs-margin:1.5em 0;--docsifytabs-tab-background:#f8f8f8;--docsifytabs-tab-background--active:var(--docsifytabs-content-background);--docsifytabs-tab-color:#999;--docsifytabs-tab-color--active:inherit;--docsifytabs-tab-highlight-px:3px;--docsifytabs-tab-highlight-color:var(--theme-color,currentColor);--docsifytabs-tab-padding:0.6em 1em;--docsifytabs-content-background:inherit;--docsifytabs-content-padding:1.5rem}.docsify-tabs:before,.docsify-tabs__tab{z-index:1}.docsify-tabs__tab--active,.docsify-tabs__tab:focus{z-index:2}.docsify-tabs{display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap;position:relative}.docsify-tabs:before{-ms-flex-order:0;content:"";-ms-flex:1 1;flex:1 1;order:0}.docsify-tabs__tab{-ms-flex-order:-1;appearance:none;font-size:inherit;margin:0;order:-1;position:relative}.docsify-tabs__content[class]{height:0;overflow:hidden;position:absolute;visibility:hidden;width:100%}.docsify-tabs__content[class]>:first-child{margin-top:0}.docsify-tabs__content[class]>:last-child{margin-bottom:0}.docsify-tabs__tab--active+.docsify-tabs__content[class]{height:auto;overflow:auto;position:relative;visibility:visible}[class*=docsify-tabs--]{margin:1.5em 0;margin:var(--docsifytabs-margin)}[class*=docsify-tabs--]>.docsify-tabs__tab{background:#f8f8f8;background:var(--docsifytabs-tab-background);color:#999;color:var(--docsifytabs-tab-color);padding:.6em 1em;padding:var(--docsifytabs-tab-padding)}[class*=docsify-tabs--]>.docsify-tabs__tab--active{background:inherit;background:var(--docsifytabs-tab-background--active);color:inherit;color:var(--docsifytabs-tab-color--active)}[class*=docsify-tabs--]>.docsify-tabs__content{background:inherit;background:var(--docsifytabs-content-background)}[class*=docsify-tabs--]>.docsify-tabs__tab--active+.docsify-tabs__content{padding:1.5rem;padding:var(--docsifytabs-content-padding)}.docsify-tabs--classic:before,.docsify-tabs--classic>.docsify-tabs__content,.docsify-tabs--classic>.docsify-tabs__tab{border-color:#ededed;border-color:var(--docsifytabs-border-color);border-style:solid;border-width:1px;border-width:var(--docsifytabs-border-px)}.docsify-tabs--classic:before{border-left-width:0;border-right-width:0;border-top-width:0;margin-right:1px;margin-right:var(--docsifytabs-border-px)}.docsify-tabs--classic>.docsify-tabs__tab:first-of-type{border-top-left-radius:var(--docsifytabs-border-radius-px)}.docsify-tabs--classic>.docsify-tabs__tab:last-of-type{border-top-right-radius:var(--docsifytabs-border-radius-px)}.docsify-tabs--classic>.docsify-tabs__tab~.docsify-tabs__tab{margin-left:-1px;margin-left:calc(0px - var(--docsifytabs-border-px))}.docsify-tabs--classic>.docsify-tabs__tab--active{border-bottom-width:0;box-shadow:inset 0 3px 0 0 currentColor;box-shadow:inset 0 var(--docsifytabs-tab-highlight-px) 0 0 var(--docsifytabs-tab-highlight-color)}.docsify-tabs--classic>.docsify-tabs__content{border-radius:0;border-radius:0 var(--docsifytabs-border-radius-px) var(--docsifytabs-border-radius-px) var(--docsifytabs-border-radius-px);border-top:0;margin-top:-1px;margin-top:calc(0px - var(--docsifytabs-border-px))}.docsify-tabs--material>.docsify-tabs__tab{background:transparent;border:0;margin-bottom:2px;margin-bottom:calc(var(--docsifytabs-tab-highlight-px) - var(--docsifytabs-border-px))}.docsify-tabs--material>.docsify-tabs__tab--active{background:transparent;box-shadow:0 3px 0 0 currentColor;box-shadow:0 var(--docsifytabs-tab-highlight-px) 0 0 var(--docsifytabs-tab-highlight-color)}.docsify-tabs--material>.docsify-tabs__content{border-color:#ededed;border-color:var(--docsifytabs-border-color);border-style:solid;border-width:1px 0;border-width:var(--docsifytabs-border-px) 0}',
    { insertAt: 'top' },
  );
  var t = 'tabs:replace',
    a = {
      tabsContainer: 'content',
      tabBlock: 'docsify-tabs',
      tabButton: 'docsify-tabs__tab',
      tabButtonActive: 'docsify-tabs__tab--active',
      tabContent: 'docsify-tabs__content',
    },
    o = {
      codeMarkup: /(```[\s\S]*?```)/gm,
      commentReplaceMarkup: new RegExp('\x3c!-- '.concat(t, ' (.*?) --\x3e')),
      tabBlockMarkup: /( *)(<!-+\s+tabs:\s*?start\s+-+>)(?:(?!(<!-+\s+tabs:\s*?(?:start|end)\s+-+>))[\s\S])*(<!-+\s+tabs:\s*?end\s+-+>)/,
      tabCommentMarkup: /[\r\n]*(\s*)<!-+\s+tab:\s*(.*)\s+-+>[\r\n]+([\s\S]*?)[\r\n]*\s*(?=<!-+\s+tabs?:(?!replace))/m,
      tabHeadingMarkup: /[\r\n]*(\s*)#{1,6}\s*[*_]{2}\s*(.*[^\s])\s*[*_]{2}[\r\n]+([\s\S]*?)(?=#{1,6}\s*[*_]{2}|<!-+\s+tabs:\s*?end\s+-+>)/m,
    },
    e = { persist: !0, sync: !0, theme: 'classic', tabComments: !0, tabHeadings: !0 },
    c = {
      get persist() {
        return 'docsify-tabs.persist.'.concat(window.location.pathname);
      },
      sync: 'docsify-tabs.sync',
    };
  function s(t, a) {
    if (Element.prototype.closest) return t.closest(a);
    for (; t; ) {
      if (r(t, a)) return t;
      t = t.parentNode || null;
    }
    return t;
  }
  function r(t, a) {
    return (
      Element.prototype.matches ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector
    ).call(t, a);
  }
  function n(t) {
    var o = arguments.length > 1 && void 0 !== arguments[1] && arguments[1],
      i = s(t, '.'.concat(a.tabButton));
    if (i) {
      var d = i.getAttribute('data-tab'),
        b = document.querySelector('.'.concat(a.tabsContainer)),
        l = i.parentNode,
        f = Array.apply(null, l.children).filter(function (t) {
          return r(t, 'button');
        }),
        u = l.offsetTop;
      if (
        (f.forEach(function (t) {
          return t.classList.remove(a.tabButtonActive);
        }),
        i.classList.add(a.tabButtonActive),
        !o)
      ) {
        if (e.persist) {
          var y = b ? Array.apply(null, b.querySelectorAll('.'.concat(a.tabBlock))) : [],
            p = y.indexOf(l),
            m = JSON.parse(sessionStorage.getItem(c.persist)) || {};
          (m[p] = d), sessionStorage.setItem(c.persist, JSON.stringify(m));
        }
        if (e.sync) {
          var h = b
              ? Array.apply(null, b.querySelectorAll('.'.concat(a.tabButton, '[data-tab="').concat(d, '"]')))
              : [],
            g = JSON.parse(sessionStorage.getItem(c.sync)) || [];
          h.forEach(function (t) {
            n(t, !0);
          }),
            window.scrollBy(0, 0 - (u - l.offsetTop)),
            g.indexOf(d) > 0 && g.splice(g.indexOf(d), 1),
            0 !== g.indexOf(d) && (g.unshift(d), sessionStorage.setItem(c.sync, JSON.stringify(g)));
        }
      }
    }
  }
  function i() {
    var t = decodeURIComponent((window.location.hash.match(/(?:id=)([^&]+)/) || [])[1]),
      o = t && '.'.concat(a.tabBlock, ' #').concat(t);
    if (t && document.querySelector(o)) {
      var e,
        c = document.querySelector('#'.concat(t));
      if (c.closest) e = c.closest('.'.concat(a.tabContent));
      else
        for (e = c.parentNode; e !== document.body && !e.classList.contains(''.concat(a.tabContent)); )
          e = e.parentNode;
      n(e.previousElementSibling);
    }
  }
  window &&
    ((window.$docsify = window.$docsify || {}),
    (window.$docsify.tabs = window.$docsify.tabs || {}),
    Object.keys(window.$docsify.tabs).forEach(function (t) {
      Object.prototype.hasOwnProperty.call(e, t) && (e[t] = window.$docsify.tabs[t]);
    }),
    (window.$docsify.tabs.version = '1.6.0'),
    (e.tabComments || e.tabHeadings) &&
      (window.$docsify.plugins = [].concat(window.$docsify.plugins || [], function (s, d) {
        var b = !1;
        s.beforeEach(function (c) {
          return (
            (b = o.tabBlockMarkup.test(c)) &&
              (c = (function (c, s) {
                for (
                  var r = c.match(o.codeMarkup) || [],
                    n = r.map(function (a, o) {
                      var e = '\x3c!-- '.concat(t, ' CODEBLOCK').concat(o, ' --\x3e');
                      return (
                        (c = c.replace(a, function () {
                          return e;
                        })),
                        e
                      );
                    }),
                    i = e.theme ? ''.concat(a.tabBlock, '--').concat(e.theme) : '',
                    d = document.createElement('div'),
                    b = c.match(o.tabBlockMarkup),
                    l = 1,
                    f = function () {
                      var r = b[0],
                        n = b[1],
                        f = b[2],
                        u = b[4],
                        y = e.tabComments && o.tabCommentMarkup.test(r),
                        p = e.tabHeadings && o.tabHeadingMarkup.test(r),
                        m = void 0,
                        h = '',
                        g = '';
                      if (y || p) {
                        (h = '\x3c!-- '.concat(t, ' <div class="').concat([a.tabBlock, i].join(' '), '"> --\x3e')),
                          (g = '\n'.concat(n, '\x3c!-- ').concat(t, ' </div> --\x3e'));
                        for (
                          var v = function () {
                            d.innerHTML = m[2].trim()
                              ? s.compiler.compile(m[2]).replace(/<\/?p>/g, '')
                              : 'Tab '.concat(l);
                            var o = d.innerHTML,
                              e = (m[3] || '').trim(),
                              c = (
                                d.textContent ||
                                d.firstChild.getAttribute('alt') ||
                                d.firstChild.getAttribute('src')
                              )
                                .trim()
                                .toLowerCase();
                            (r = r.replace(m[0], function () {
                              return [
                                '\n'
                                  .concat(n, '\x3c!-- ')
                                  .concat(t, ' <button class="')
                                  .concat(a.tabButton, '" data-tab="')
                                  .concat(c, '">')
                                  .concat(o, '</button> --\x3e'),
                                '\n'
                                  .concat(n, '\x3c!-- ')
                                  .concat(t, ' <div class="')
                                  .concat(a.tabContent, '" data-tab-content="')
                                  .concat(c, '"> --\x3e'),
                                '\n\n'.concat(n).concat(e),
                                '\n\n'.concat(n, '\x3c!-- ').concat(t, ' </div> --\x3e'),
                              ].join('');
                            })),
                              l++;
                          };
                          null !==
                          (m =
                            (e.tabComments ? o.tabCommentMarkup.exec(r) : null) ||
                            (e.tabHeadings ? o.tabHeadingMarkup.exec(r) : null));

                        )
                          v();
                      }
                      (r = (r = r.replace(f, function () {
                        return h;
                      })).replace(u, function () {
                        return g;
                      })),
                        (c = c.replace(b[0], function () {
                          return r;
                        })),
                        (b = c.match(o.tabBlockMarkup));
                    };
                  b;

                )
                  f();
                return (
                  n.forEach(function (t, a) {
                    c = c.replace(t, function () {
                      return r[a];
                    });
                  }),
                  c
                );
              })(c, d)),
            c
          );
        }),
          s.afterEach(function (t, a) {
            b &&
              (t = (function (t) {
                for (
                  var a,
                    e = function () {
                      var o = a[0],
                        e = a[1] || '';
                      t = t.replace(o, function () {
                        return e;
                      });
                    };
                  null !== (a = o.commentReplaceMarkup.exec(t));

                )
                  e();
                return t;
              })(t)),
              a(t);
          }),
          s.doneEach(function () {
            var t, o, s, n;
            b &&
              ((o = (t = document.querySelector('.'.concat(a.tabsContainer)))
                ? Array.apply(null, t.querySelectorAll('.'.concat(a.tabBlock)))
                : []),
              (s = JSON.parse(sessionStorage.getItem(c.persist)) || {}),
              (n = JSON.parse(sessionStorage.getItem(c.sync)) || []),
              i(),
              o.forEach(function (t, o) {
                var c = Array.apply(null, t.children).filter(function (t) {
                  return r(t, '.'.concat(a.tabButtonActive));
                })[0];
                c ||
                  (e.sync &&
                    n.length &&
                    (c = n
                      .map(function (o) {
                        return Array.apply(null, t.children).filter(function (t) {
                          return r(t, '.'.concat(a.tabButton, '[data-tab="').concat(o, '"]'));
                        })[0];
                      })
                      .filter(function (t) {
                        return t;
                      })[0]),
                  !c &&
                    e.persist &&
                    (c = t.querySelector(
                      Array.apply(null, t.children).filter(function (t) {
                        return r(t, '.'.concat(a.tabButton, '[data-tab="').concat(s[o], '"]'));
                      })[0],
                    )),
                  (c = c || t.querySelector('.'.concat(a.tabButton))) && c.classList.add(a.tabButtonActive));
              }));
          }),
          s.mounted(function () {
            var t = document.querySelector('.'.concat(a.tabsContainer));
            t &&
              t.addEventListener('click', function (t) {
                n(t.target);
              }),
              window.addEventListener('hashchange', i, !1);
          });
      })));
})();
//# sourceMappingURL=docsify-tabs.min.js.map
