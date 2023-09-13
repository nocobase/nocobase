/*!
 * pangu.js
 * --------
 * @version: 4.0.7
 * @homepage: https://github.com/vinta/pangu.js
 * @license: MIT
 * @author: Vinta Chen <vinta.chen@gmail.com> (https://github.com/vinta)
 */
!(function (e, t) {
  'object' == typeof exports && 'object' == typeof module
    ? (module.exports = t())
    : 'function' == typeof define && define.amd
    ? define('pangu', [], t)
    : 'object' == typeof exports
    ? (exports.pangu = t())
    : (e.pangu = t());
})(window, function () {
  return (function (e) {
    var t = {};
    function n(a) {
      if (t[a]) return t[a].exports;
      var i = (t[a] = { i: a, l: !1, exports: {} });
      return e[a].call(i.exports, i, i.exports, n), (i.l = !0), i.exports;
    }
    return (
      (n.m = e),
      (n.c = t),
      (n.d = function (e, t, a) {
        n.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: a });
      }),
      (n.r = function (e) {
        'undefined' != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
          Object.defineProperty(e, '__esModule', { value: !0 });
      }),
      (n.t = function (e, t) {
        if ((1 & t && (e = n(e)), 8 & t)) return e;
        if (4 & t && 'object' == typeof e && e && e.__esModule) return e;
        var a = Object.create(null);
        if ((n.r(a), Object.defineProperty(a, 'default', { enumerable: !0, value: e }), 2 & t && 'string' != typeof e))
          for (var i in e)
            n.d(
              a,
              i,
              function (t) {
                return e[t];
              }.bind(null, i),
            );
        return a;
      }),
      (n.n = function (e) {
        var t =
          e && e.__esModule
            ? function () {
                return e.default;
              }
            : function () {
                return e;
              };
        return n.d(t, 'a', t), t;
      }),
      (n.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (n.p = ''),
      n((n.s = 0))
    );
  })([
    function (e, t, n) {
      var a, i, o;
      (i = []),
        void 0 ===
          (o =
            'function' ==
            typeof (a = function () {
              'use strict';
              function t(e) {
                return (t =
                  'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                    ? function (e) {
                        return typeof e;
                      }
                    : function (e) {
                        return e && 'function' == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                      })(e);
              }
              function a(e, t) {
                for (var n = 0; n < t.length; n++) {
                  var a = t[n];
                  (a.enumerable = a.enumerable || !1),
                    (a.configurable = !0),
                    'value' in a && (a.writable = !0),
                    Object.defineProperty(e, a.key, a);
                }
              }
              function i(e, n) {
                return !n || ('object' !== t(n) && 'function' != typeof n)
                  ? (function (e) {
                      if (void 0 === e)
                        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                      return e;
                    })(e)
                  : n;
              }
              function o(e) {
                return (o = Object.setPrototypeOf
                  ? Object.getPrototypeOf
                  : function (e) {
                      return e.__proto__ || Object.getPrototypeOf(e);
                    })(e);
              }
              function r(e, t) {
                return (r =
                  Object.setPrototypeOf ||
                  function (e, t) {
                    return (e.__proto__ = t), e;
                  })(e, t);
              }
              var c = (function (e) {
                  function t() {
                    var e;
                    return (
                      (function (e, t) {
                        if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                      })(this, t),
                      ((e = i(this, o(t).call(this))).blockTags = /^(div|p|h1|h2|h3|h4|h5|h6)$/i),
                      (e.ignoredTags = /^(script|code|pre|textarea)$/i),
                      (e.presentationalTags = /^(b|code|del|em|i|s|strong)$/i),
                      (e.spaceLikeTags = /^(br|hr|i|img|pangu)$/i),
                      (e.spaceSensitiveTags = /^(a|del|pre|s|strike|u)$/i),
                      (e.isAutoSpacingPageExecuted = !1),
                      e
                    );
                  }
                  return (
                    (function (e, t) {
                      if ('function' != typeof t && null !== t)
                        throw new TypeError('Super expression must either be null or a function');
                      (e.prototype = Object.create(t && t.prototype, {
                        constructor: { value: e, writable: !0, configurable: !0 },
                      })),
                        t && r(e, t);
                    })(t, e),
                    (n = t),
                    (c = [
                      {
                        key: 'isContentEditable',
                        value: function (e) {
                          return e.isContentEditable || (e.getAttribute && 'true' === e.getAttribute('g_editable'));
                        },
                      },
                      {
                        key: 'isSpecificTag',
                        value: function (e, t) {
                          return e && e.nodeName && e.nodeName.search(t) >= 0;
                        },
                      },
                      {
                        key: 'isInsideSpecificTag',
                        value: function (e, t) {
                          var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
                            a = e;
                          if (n && this.isSpecificTag(a, t)) return !0;
                          for (; a.parentNode; ) if (((a = a.parentNode), this.isSpecificTag(a, t))) return !0;
                          return !1;
                        },
                      },
                      {
                        key: 'canIgnoreNode',
                        value: function (e) {
                          var t = e;
                          if (t && (this.isSpecificTag(t, this.ignoredTags) || this.isContentEditable(t))) return !0;
                          for (; t.parentNode; )
                            if (
                              (t = t.parentNode) &&
                              (this.isSpecificTag(t, this.ignoredTags) || this.isContentEditable(t))
                            )
                              return !0;
                          return !1;
                        },
                      },
                      {
                        key: 'isFirstTextChild',
                        value: function (e, t) {
                          for (var n = e.childNodes, a = 0; a < n.length; a++) {
                            var i = n[a];
                            if (i.nodeType !== Node.COMMENT_NODE && i.textContent) return i === t;
                          }
                          return !1;
                        },
                      },
                      {
                        key: 'isLastTextChild',
                        value: function (e, t) {
                          for (var n = e.childNodes, a = n.length - 1; a > -1; a--) {
                            var i = n[a];
                            if (i.nodeType !== Node.COMMENT_NODE && i.textContent) return i === t;
                          }
                          return !1;
                        },
                      },
                      {
                        key: 'spacingNodeByXPath',
                        value: function (e, t) {
                          if (t instanceof Node && !(t instanceof DocumentFragment))
                            for (
                              var n,
                                a,
                                i = document.evaluate(e, t, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
                                o = i.snapshotLength - 1;
                              o > -1;
                              --o
                            ) {
                              if (
                                ((n = i.snapshotItem(o)),
                                this.isSpecificTag(n.parentNode, this.presentationalTags) &&
                                  !this.isInsideSpecificTag(n.parentNode, this.ignoredTags))
                              ) {
                                var r = n.parentNode;
                                if (r.previousSibling) {
                                  var c = r.previousSibling;
                                  if (c.nodeType === Node.TEXT_NODE) {
                                    var s = c.data.substr(-1) + n.data.toString().charAt(0),
                                      u = this.spacing(s);
                                    s !== u && (c.data = ''.concat(c.data, ' '));
                                  }
                                }
                                if (r.nextSibling) {
                                  var p = r.nextSibling;
                                  if (p.nodeType === Node.TEXT_NODE) {
                                    var l = n.data.substr(-1) + p.data.toString().charAt(0),
                                      f = this.spacing(l);
                                    l !== f && (p.data = ' '.concat(p.data));
                                  }
                                }
                              }
                              if (this.canIgnoreNode(n)) a = n;
                              else {
                                var g = this.spacing(n.data);
                                if ((n.data !== g && (n.data = g), a)) {
                                  if (n.nextSibling && n.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
                                    a = n;
                                    continue;
                                  }
                                  var d = n.data.toString().substr(-1) + a.data.toString().substr(0, 1),
                                    h = this.spacing(d);
                                  if (h !== d) {
                                    for (
                                      var y = a;
                                      y.parentNode &&
                                      -1 === y.nodeName.search(this.spaceSensitiveTags) &&
                                      this.isFirstTextChild(y.parentNode, y);

                                    )
                                      y = y.parentNode;
                                    for (
                                      var v = n;
                                      v.parentNode &&
                                      -1 === v.nodeName.search(this.spaceSensitiveTags) &&
                                      this.isLastTextChild(v.parentNode, v);

                                    )
                                      v = v.parentNode;
                                    if (v.nextSibling && v.nextSibling.nodeName.search(this.spaceLikeTags) >= 0) {
                                      a = n;
                                      continue;
                                    }
                                    if (-1 === v.nodeName.search(this.blockTags))
                                      if (-1 === y.nodeName.search(this.spaceSensitiveTags))
                                        -1 === y.nodeName.search(this.ignoredTags) &&
                                          -1 === y.nodeName.search(this.blockTags) &&
                                          (a.previousSibling
                                            ? -1 === a.previousSibling.nodeName.search(this.spaceLikeTags) &&
                                              (a.data = ' '.concat(a.data))
                                            : this.canIgnoreNode(a) || (a.data = ' '.concat(a.data)));
                                      else if (-1 === v.nodeName.search(this.spaceSensitiveTags))
                                        n.data = ''.concat(n.data, ' ');
                                      else {
                                        var b = document.createElement('pangu');
                                        (b.innerHTML = ' '),
                                          y.previousSibling
                                            ? -1 === y.previousSibling.nodeName.search(this.spaceLikeTags) &&
                                              y.parentNode.insertBefore(b, y)
                                            : y.parentNode.insertBefore(b, y),
                                          b.previousElementSibling || (b.parentNode && b.parentNode.removeChild(b));
                                      }
                                  }
                                }
                                a = n;
                              }
                            }
                        },
                      },
                      {
                        key: 'spacingNode',
                        value: function (e) {
                          var t = './/*/text()[normalize-space(.)]';
                          e.children && 0 === e.children.length && (t = './/text()[normalize-space(.)]'),
                            this.spacingNodeByXPath(t, e);
                        },
                      },
                      {
                        key: 'spacingElementById',
                        value: function (e) {
                          var t = 'id("'.concat(e, '")//text()');
                          this.spacingNodeByXPath(t, document);
                        },
                      },
                      {
                        key: 'spacingElementByClassName',
                        value: function (e) {
                          var t = '//*[contains(concat(" ", normalize-space(@class), " "), "'.concat(e, '")]//text()');
                          this.spacingNodeByXPath(t, document);
                        },
                      },
                      {
                        key: 'spacingElementByTagName',
                        value: function (e) {
                          var t = '//'.concat(e, '//text()');
                          this.spacingNodeByXPath(t, document);
                        },
                      },
                      {
                        key: 'spacingPageTitle',
                        value: function () {
                          this.spacingNodeByXPath('/html/head/title/text()', document);
                        },
                      },
                      {
                        key: 'spacingPageBody',
                        value: function () {
                          var e = '/html/body//*/text()[normalize-space(.)]';
                          ['script', 'style', 'textarea'].forEach(function (t) {
                            e = ''
                              .concat(
                                e,
                                '[translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="',
                              )
                              .concat(t, '"]');
                          }),
                            this.spacingNodeByXPath(e, document);
                        },
                      },
                      {
                        key: 'spacingPage',
                        value: function () {
                          this.spacingPageTitle(), this.spacingPageBody();
                        },
                      },
                      {
                        key: 'autoSpacingPage',
                        value: function () {
                          var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 1e3,
                            t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 500,
                            n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : 2e3;
                          if (document.body instanceof Node && !this.isAutoSpacingPageExecuted) {
                            this.isAutoSpacingPageExecuted = !0;
                            var a = this,
                              i = (function (e) {
                                var t = this,
                                  n = arguments,
                                  a = !1;
                                return function () {
                                  if (!a) {
                                    var i = t;
                                    (a = !0), e.apply(i, n);
                                  }
                                };
                              })(function () {
                                a.spacingPage();
                              }),
                              o = document.getElementsByTagName('video');
                            if (0 === o.length)
                              setTimeout(function () {
                                i();
                              }, e);
                            else
                              for (var r = 0; r < o.length; r++) {
                                var c = o[r];
                                if (4 === c.readyState) {
                                  setTimeout(function () {
                                    i();
                                  }, 3e3);
                                  break;
                                }
                                c.addEventListener('loadeddata', function () {
                                  setTimeout(function () {
                                    i();
                                  }, 4e3);
                                });
                              }
                            var s = [],
                              u = (function (e, t, n) {
                                var a = this,
                                  i = arguments,
                                  o = null,
                                  r = null;
                                return function () {
                                  var c = a,
                                    s = i,
                                    u = +new Date();
                                  clearTimeout(o),
                                    r || (r = u),
                                    u - r >= n
                                      ? (e.apply(c, s), (r = u))
                                      : (o = setTimeout(function () {
                                          e.apply(c, s);
                                        }, t));
                                };
                              })(
                                function () {
                                  for (; s.length; ) {
                                    var e = s.shift();
                                    e && a.spacingNode(e);
                                  }
                                },
                                t,
                                { maxWait: n },
                              ),
                              p = new MutationObserver(function (e, t) {
                                e.forEach(function (e) {
                                  switch (e.type) {
                                    case 'childList':
                                      e.addedNodes.forEach(function (e) {
                                        e.nodeType === Node.ELEMENT_NODE
                                          ? s.push(e)
                                          : e.nodeType === Node.TEXT_NODE && s.push(e.parentNode);
                                      });
                                      break;
                                    case 'characterData':
                                      var t = e.target;
                                      t.nodeType === Node.TEXT_NODE && s.push(t.parentNode);
                                  }
                                }),
                                  u();
                              });
                            p.observe(document.body, { characterData: !0, childList: !0, subtree: !0 });
                          }
                        },
                      },
                    ]) && a(n.prototype, c),
                    s && a(n, s),
                    t
                  );
                  var n, c, s;
                })(n(1).Pangu),
                s = new c();
              (e.exports = s), (e.exports.default = s), (e.exports.Pangu = c);
            })
              ? a.apply(t, i)
              : a) || (e.exports = o);
    },
    function (e, t, n) {
      var a, i, o;
      (i = []),
        void 0 ===
          (o =
            'function' ==
            typeof (a = function () {
              'use strict';
              function t(e) {
                return (t =
                  'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                    ? function (e) {
                        return typeof e;
                      }
                    : function (e) {
                        return e && 'function' == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype
                          ? 'symbol'
                          : typeof e;
                      })(e);
              }
              function n(e, t) {
                for (var n = 0; n < t.length; n++) {
                  var a = t[n];
                  (a.enumerable = a.enumerable || !1),
                    (a.configurable = !0),
                    'value' in a && (a.writable = !0),
                    Object.defineProperty(e, a.key, a);
                }
              }
              var a = '⺀-⻿⼀-⿟぀-ゟ゠-ヺー-ヿ㄀-ㄯ㈀-㋿㐀-䶿一-鿿豈-﫿',
                i = new RegExp('['.concat(a, ']')),
                o = new RegExp('(['.concat(a, '])[ ]*([\\:]+|\\.)[ ]*([').concat(a, '])'), 'g'),
                r = new RegExp('(['.concat(a, '])[ ]*([~\\!;,\\?]+)[ ]*'), 'g'),
                c = new RegExp('([\\.]{2,}|…)(['.concat(a, '])'), 'g'),
                s = new RegExp('(['.concat(a, '])\\:([A-Z0-9\\(\\)])'), 'g'),
                u = new RegExp('(['.concat(a, '])([`"״])'), 'g'),
                p = new RegExp('([`"״])(['.concat(a, '])'), 'g'),
                l = /([`"\u05f4]+)[ ]*(.+?)[ ]*([`"\u05f4]+)/g,
                f = new RegExp('(['.concat(a, "])('[^s])"), 'g'),
                g = new RegExp("(')([".concat(a, '])'), 'g'),
                d = new RegExp('([A-Za-z0-9'.concat(a, "])( )('s)"), 'g'),
                h = new RegExp('(['.concat(a, '])(#)([').concat(a, ']+)(#)([').concat(a, '])'), 'g'),
                y = new RegExp('(['.concat(a, '])(#([^ ]))'), 'g'),
                v = new RegExp('(([^ ])#)(['.concat(a, '])'), 'g'),
                b = new RegExp('(['.concat(a, '])([\\+\\-\\*\\/=&\\|<>])([A-Za-z0-9])'), 'g'),
                m = new RegExp('([A-Za-z0-9])([\\+\\-\\*\\/=&\\|<>])(['.concat(a, '])'), 'g'),
                $ = /([\/]) ([a-z\-_\.\/]+)/g,
                E = /([\/\.])([A-Za-z\-_\.\/]+) ([\/])/g,
                S = new RegExp('(['.concat(a, '])([\\(\\[\\{<>“])'), 'g'),
                T = new RegExp('([\\)\\]\\}<>”])(['.concat(a, '])'), 'g'),
                N = /([\(\[\{<\u201c]+)[ ]*(.+?)[ ]*([\)\]\}>\u201d]+)/,
                w = new RegExp('([A-Za-z0-9'.concat(a, '])[ ]*([“])([A-Za-z0-9').concat(a, '\\-_ ]+)([”])'), 'g'),
                k = new RegExp('([“])([A-Za-z0-9'.concat(a, '\\-_ ]+)([”])[ ]*([A-Za-z0-9').concat(a, '])'), 'g'),
                P = /([A-Za-z0-9])([\(\[\{])/g,
                O = /([\)\]\}])([A-Za-z0-9])/g,
                _ = new RegExp('(['.concat(a, '])([A-Za-zͰ-Ͽ0-9@\\$%\\^&\\*\\-\\+\\\\=\\|/¡-ÿ⅐-↏✀—➿])'), 'g'),
                x = new RegExp(
                  '([A-Za-zͰ-Ͽ0-9~\\$%\\^&\\*\\-\\+\\\\=\\|/!;:,\\.\\?¡-ÿ⅐-↏✀—➿])(['.concat(a, '])'),
                  'g',
                ),
                R = /(%)([A-Za-z])/g,
                A = /([ ]*)([\u00b7\u2022\u2027])([ ]*)/g,
                j = (function () {
                  function e() {
                    !(function (e, t) {
                      if (!(e instanceof t)) throw new TypeError('Cannot call a class as a function');
                    })(this, e),
                      (this.version = '4.0.7');
                  }
                  return (
                    (a = e),
                    (j = [
                      {
                        key: 'convertToFullwidth',
                        value: function (e) {
                          return e
                            .replace(/~/g, '～')
                            .replace(/!/g, '！')
                            .replace(/;/g, '；')
                            .replace(/:/g, '：')
                            .replace(/,/g, '，')
                            .replace(/\./g, '。')
                            .replace(/\?/g, '？');
                        },
                      },
                      {
                        key: 'spacing',
                        value: function (e) {
                          if ('string' != typeof e)
                            return console.warn('spacing(text) only accepts string but got '.concat(t(e))), e;
                          if (e.length <= 1 || !i.test(e)) return e;
                          var n = this,
                            a = e;
                          return (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = (a = a.replace(
                            o,
                            function (e, t, a, i) {
                              var o = n.convertToFullwidth(a);
                              return ''.concat(t).concat(o).concat(i);
                            },
                          )).replace(r, function (e, t, a) {
                            var i = n.convertToFullwidth(a);
                            return ''.concat(t).concat(i);
                          })).replace(c, '$1 $2')).replace(s, '$1：$2')).replace(u, '$1 $2')).replace(
                            p,
                            '$1 $2',
                          )).replace(l, '$1$2$3')).replace(f, '$1 $2')).replace(g, '$1 $2')).replace(
                            d,
                            "$1's",
                          )).replace(h, '$1 $2$3$4 $5')).replace(y, '$1 $2')).replace(v, '$1 $3')).replace(
                            b,
                            '$1 $2 $3',
                          )).replace(m, '$1 $2 $3')).replace($, '$1$2')).replace(E, '$1$2$3')).replace(
                            S,
                            '$1 $2',
                          )).replace(T, '$1 $2')).replace(N, '$1$2$3')).replace(w, '$1 $2$3$4')).replace(
                            k,
                            '$1$2$3 $4',
                          )).replace(P, '$1 $2')).replace(O, '$1 $2')).replace(_, '$1 $2')).replace(
                            x,
                            '$1 $2',
                          )).replace(R, '$1 $2')).replace(A, '・'));
                        },
                      },
                      {
                        key: 'spacingText',
                        value: function (e) {
                          var t,
                            n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : function () {};
                          try {
                            t = this.spacing(e);
                          } catch (e) {
                            return void n(e);
                          }
                          n(null, t);
                        },
                      },
                      {
                        key: 'spacingTextSync',
                        value: function (e) {
                          return this.spacing(e);
                        },
                      },
                    ]) && n(a.prototype, j),
                    z && n(a, z),
                    e
                  );
                  var a, j, z;
                })(),
                z = new j();
              (e.exports = z), (e.exports.default = z), (e.exports.Pangu = j);
            })
              ? a.apply(t, i)
              : a) || (e.exports = o);
    },
  ]);
});
