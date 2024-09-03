/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

(() => {
  'use strict';
  var t,
    e,
    a = {
      783: (t, e, a) => {
        var i = a(618),
          r = Object.create(null),
          n = 'undefined' == typeof document,
          c = Array.prototype.forEach;
        function s() {}
        function o(t, e) {
          if (!e) {
            if (!t.href) return;
            e = t.href.split('?')[0];
          }
          if (l(e) && !1 !== t.isLoaded && e && e.indexOf('.css') > -1) {
            t.visited = !0;
            var a = t.cloneNode();
            (a.isLoaded = !1),
              a.addEventListener('load', function () {
                a.isLoaded || ((a.isLoaded = !0), t.parentNode.removeChild(t));
              }),
              a.addEventListener('error', function () {
                a.isLoaded || ((a.isLoaded = !0), t.parentNode.removeChild(t));
              }),
              (a.href = ''.concat(e, '?').concat(Date.now())),
              t.nextSibling ? t.parentNode.insertBefore(a, t.nextSibling) : t.parentNode.appendChild(a);
          }
        }
        function d(t) {
          if (!t) return !1;
          var e = document.querySelectorAll('link'),
            a = !1;
          return (
            c.call(e, function (e) {
              if (e.href) {
                var r = (function (t, e) {
                  var a;
                  return (
                    (t = i(t)),
                    e.some(function (i) {
                      t.indexOf(e) > -1 && (a = i);
                    }),
                    a
                  );
                })(e.href, t);
                l(r) && !0 !== e.visited && r && (o(e, r), (a = !0));
              }
            }),
            a
          );
        }
        function h() {
          var t = document.querySelectorAll('link');
          c.call(t, function (t) {
            !0 !== t.visited && o(t);
          });
        }
        function l(t) {
          return !!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(t);
        }
        t.exports = function (t, e) {
          if (n) return s;
          var a,
            c,
            o,
            l = (function (t) {
              var e = r[t];
              if (!e) {
                if (document.currentScript) e = document.currentScript.src;
                else {
                  var a = document.getElementsByTagName('script'),
                    n = a[a.length - 1];
                  n && (e = n.src);
                }
                r[t] = e;
              }
              return function (t) {
                if (!e) return null;
                var a = e.split(/([^\\/]+)\.js$/),
                  r = a && a[1];
                return r && t
                  ? t.split(',').map(function (t) {
                      var a = new RegExp(''.concat(r, '\\.js$'), 'g');
                      return i(e.replace(a, ''.concat(t.replace(/{fileName}/g, r), '.css')));
                    })
                  : [e.replace('.js', '.css')];
              };
            })(t);
          return (
            (a = function () {
              var t = d(l(e.filename));
              e.locals ? h() : t || h();
            }),
            (c = 50),
            (o = 0),
            function () {
              var t = this,
                e = arguments;
              clearTimeout(o),
                (o = setTimeout(function () {
                  return a.apply(t, e);
                }, c));
            }
          );
        };
      },
      618: (t) => {
        t.exports = function (t) {
          if (((t = t.trim()), /^data:/i.test(t))) return t;
          var e = -1 !== t.indexOf('//') ? t.split('//')[0] + '//' : '',
            a = t.replace(new RegExp(e, 'i'), '').split('/'),
            i = a[0].toLowerCase().replace(/\.$/, '');
          return (
            (a[0] = ''),
            e +
              i +
              a
                .reduce(function (t, e) {
                  switch (e) {
                    case '..':
                      t.pop();
                      break;
                    case '.':
                      break;
                    default:
                      t.push(e);
                  }
                  return t;
                }, [])
                .join('/')
          );
        };
      },
      488: (t, e, a) => {
        var i = a(783)(t.id, { locals: !1 });
        t.hot.dispose(i), t.hot.accept(void 0, i);
      },
      523: (t, e, a) => {
        var i = a(783)(t.id, { locals: !1 });
        t.hot.dispose(i), t.hot.accept(void 0, i);
      },
      991: (t, e, a) => {
        var i = a(783)(t.id, { locals: !1 });
        t.hot.dispose(i), t.hot.accept(void 0, i);
      },
      492: (t, e, a) => {
        var i = a(783)(t.id, { locals: !1 });
        t.hot.dispose(i), t.hot.accept(void 0, i);
      },
      305: (t, e, a) => {
        var i = a(783)(t.id, { locals: !1 });
        t.hot.dispose(i), t.hot.accept(void 0, i);
      },
      444: (t, e, a) => {
        var i = a(783)(t.id, { locals: !1 });
        t.hot.dispose(i), t.hot.accept(void 0, i);
      },
      600: (t, e, a) => {
        a(488), a(523), a(444);
        function i(t) {
          t.preventDefault && t.preventDefault();
        }
        function r(t) {
          A(t).each((t) => {
            t.addEventListener('touchmove', i, { passive: !1 }), t.addEventListener('mousemove', i, { passive: !1 });
          });
        }
        function n(t) {
          if (null !== t.pageX && void 0 !== t.pageX) return { x: Math.round(t.pageX), y: Math.round(t.pageY) };
          let e;
          return (
            t.changedTouches
              ? (e = t.changedTouches)
              : t.targetTouches
              ? (e = t.targetTouches)
              : t.originalEvent && t.originalEvent.targetTouches && (e = t.originalEvent.targetTouches),
            null !== e[0].pageX && void 0 !== e[0].pageX
              ? { x: Math.round(e[0].pageX), y: Math.round(e[0].pageY) }
              : { x: Math.round(e[0].clientX), y: Math.round(e[0].clientY) }
          );
        }
        function c(t) {
          const e = n(t);
          let a = e.x,
            i = e.y;
          (currentCaptcha.currentCaptchaData.startX = a), (currentCaptcha.currentCaptchaData.startY = i);
          const r = currentCaptcha.currentCaptchaData.startX,
            c = currentCaptcha.currentCaptchaData.startY,
            o = currentCaptcha.currentCaptchaData.startTime;
          currentCaptcha.currentCaptchaData.trackArr.push({
            x: r - a,
            y: c - i,
            type: 'down',
            t: new Date().getTime() - o.getTime(),
          }),
            window.addEventListener('mousemove', s),
            window.addEventListener('mouseup', d),
            window.addEventListener('touchmove', s, !1),
            window.addEventListener('touchend', d, !1),
            window.currentCaptcha.doDown && window.currentCaptcha.doDown(t, window.currentCaptcha);
        }
        function s(t) {
          t.touches && t.touches.length > 0 && (t = t.touches[0]);
          const e = n(t);
          let a = e.x,
            i = e.y;
          const r = window.currentCaptcha.currentCaptchaData.startX,
            c = window.currentCaptcha.currentCaptchaData.startY,
            s = window.currentCaptcha.currentCaptchaData.startTime,
            o = window.currentCaptcha.currentCaptchaData.end,
            d = window.currentCaptcha.currentCaptchaData.bgImageWidth,
            h = window.currentCaptcha.currentCaptchaData.trackArr;
          let l = a - r,
            p = i - c;
          const u = { x: a - r, y: i - c, type: 'move', t: new Date().getTime() - s.getTime() };
          h.push(u),
            l < 0 ? (l = 0) : l > o && (l = o),
            (window.currentCaptcha.currentCaptchaData.moveX = l),
            (window.currentCaptcha.currentCaptchaData.movePercent = l / d),
            (window.currentCaptcha.currentCaptchaData.moveY = p),
            window.currentCaptcha.doMove && window.currentCaptcha.doMove(t, currentCaptcha);
        }
        function o() {
          window.removeEventListener('mousemove', s),
            window.removeEventListener('mouseup', d),
            window.removeEventListener('touchmove', s),
            window.removeEventListener('touchend', d);
        }
        function d(t) {
          o();
          const e = n(t);
          currentCaptcha.currentCaptchaData.stopTime = new Date();
          let a = e.x,
            i = e.y;
          const r = currentCaptcha.currentCaptchaData.startX,
            c = currentCaptcha.currentCaptchaData.startY,
            s = currentCaptcha.currentCaptchaData.startTime,
            d = currentCaptcha.currentCaptchaData.trackArr,
            h = { x: a - r, y: i - c, type: 'up', t: new Date().getTime() - s.getTime() };
          d.push(h),
            window.currentCaptcha.doUp && window.currentCaptcha.doUp(t, window.currentCaptcha),
            window.currentCaptcha.endCallback(currentCaptcha.currentCaptchaData, currentCaptcha);
        }
        function h(t, e, a, i, r) {
          const n = {
            startTime: new Date(),
            trackArr: [],
            movePercent: 0,
            clickCount: 0,
            bgImageWidth: Math.round(t),
            bgImageHeight: Math.round(e),
            templateImageWidth: Math.round(a),
            templateImageHeight: Math.round(i),
            end: r,
          };
          return n;
        }
        function l(t, e) {
          A(t).find('#tianai-captcha-tips').removeClass('tianai-captcha-tips-on'), e && setTimeout(e, 0.35);
        }
        function p(t, e, a, i) {
          const r = A(t).find('#tianai-captcha-tips');
          r.text(e),
            1 === a
              ? (r.removeClass('tianai-captcha-tips-error'), r.addClass('tianai-captcha-tips-success'))
              : (r.removeClass('tianai-captcha-tips-success'), r.addClass('tianai-captcha-tips-error')),
            r.addClass('tianai-captcha-tips-on'),
            setTimeout(i, 1e3);
        }
        class u {
          showTips(t, e, a) {
            p(this.el, t, e, a);
          }
          closeTips(t, e) {
            l(this.el, t);
          }
        }
        function A(t, e) {
          return new g(t, e);
        }
        class g {
          constructor(t, e) {
            if (e && 'object' == typeof e && void 0 !== e.nodeType) return (this.dom = e), void (this.domStr = t);
            if (t instanceof g) (this.dom = t.dom), (this.domStr = t.domStr);
            else if ('string' == typeof t) (this.dom = document.querySelector(t)), (this.domStr = t);
            else {
              if ('object' != typeof document || void 0 === document.nodeType) throw new Error('不支持的类型');
              (this.dom = t), (this.domStr = t.nodeName);
            }
          }
          each(t) {
            this.getTarget().querySelectorAll('*').forEach(t);
          }
          removeClass(t) {
            let e = this.getTarget();
            if (e.classList) e.classList.remove(t);
            else {
              const a = e.className,
                i = new RegExp('(?:^|\\s)' + t + '(?!\\S)', 'g');
              e.className = a.replace(i, '');
            }
            return this;
          }
          addClass(t) {
            const e = this.getTarget();
            if (e.classList) e.classList.add(t);
            else {
              let a = e.className;
              -1 === a.indexOf(t) && (e.className = a + ' ' + t);
            }
            return this;
          }
          find(t) {
            const e = this.getTarget().querySelector(t);
            return e ? new g(t, e) : null;
          }
          children(t) {
            const e = this.getTarget().childNodes;
            for (let a = 0; a < e.length; a++) if (1 === e[a].nodeType && e[a].matches(t)) return new g(t, e[a]);
            return null;
          }
          remove() {
            return this.getTarget().remove(), null;
          }
          css(t, e) {
            if ('string' == typeof t && 'string' == typeof e) this.getTarget().style[t] = e;
            else if ('object' == typeof t) for (var a in t) t.hasOwnProperty(a) && (this.getTarget().style[a] = t[a]);
            else if ('string' == typeof t && void 0 === e) return window.getComputedStyle(element)[t];
          }
          attr(t, e) {
            return void 0 === e ? this.getTarget().getAttribute(t) : (this.getTarget().setAttribute(t, e), this);
          }
          text(t) {
            return (this.getTarget().innerText = t), this;
          }
          html(t) {
            return (this.getTarget().innerHtml = t), this;
          }
          is(t) {
            return t && 'object' == typeof t && void 0 !== t.nodeType
              ? this.dom === t
              : t instanceof g
              ? this.dom === t.dom
              : void 0;
          }
          append(t) {
            if ('string' == typeof t) this.getTarget().insertAdjacentHTML('beforeend', t);
            else {
              if (!(t instanceof HTMLElement)) throw new Error('Invalid content type');
              this.getTarget().appendChild(t);
            }
            return this;
          }
          click(t) {
            return this.on('click', t), this;
          }
          mousedown(t) {
            return this.on('mousedown', t), this;
          }
          touchstart(t) {
            return this.on('touchstart', t), this;
          }
          on(t, e) {
            return this.getTarget().addEventListener(t, e), this;
          }
          width() {
            return this.getTarget().offsetWidth;
          }
          height() {
            return this.getTarget().offsetHeight;
          }
          getTarget() {
            if (this.dom) return this.dom;
            throw new Error('dom不存在: [' + this.domStr + ']');
          }
        }
        const f = class extends u {
          constructor(t, e) {
            super(),
              (this.boxEl = A(t)),
              (this.styleConfig = e),
              (this.type = 'SLIDER'),
              (this.currentCaptchaData = {});
          }
          init(t, e, a) {
            return (
              this.destroy(),
              this.boxEl.append(
                (this.styleConfig,
                '\n<div id="tianai-captcha" class="tianai-captcha-slider">\n    <div class="slider-tip">\n        <span id="tianai-captcha-slider-move-track-font">拖动滑块完成拼图</span>\n    </div>\n    <div class="content">\n        <div class="bg-img-div">\n            <img id="tianai-captcha-slider-bg-img" src="" alt/>\n            <canvas id="tianai-captcha-slider-bg-canvas"></canvas>\n            <div id="tianai-captcha-slider-bg-div"></div>\n        </div>\n        <div class="slider-img-div" id="tianai-captcha-slider-img-div">\n            <img id="tianai-captcha-slider-move-img" src="" alt/>\n        </div>\n        <div class="tianai-captcha-tips" id="tianai-captcha-tips"></div>\n    </div>\n    <div class="slider-move">\n        <div class="slider-move-track">\n            <div id="tianai-captcha-slider-move-track-mask"></div>\n            <div class="slider-move-shadow"></div>\n        </div>\n        <div class="slider-move-btn" id="tianai-captcha-slider-move-btn">\n        </div>\n    </div>\n\n</div>\n'),
              ),
              (this.el = this.boxEl.find('#tianai-captcha')),
              this.loadStyle(),
              this.el.find('#tianai-captcha-slider-move-btn').mousedown(c),
              this.el.find('#tianai-captcha-slider-move-btn').touchstart(c),
              (window.currentCaptcha = this),
              this.loadCaptchaForData(this, t),
              (this.endCallback = e),
              a && a(this),
              this
            );
          }
          showTips(t, e, a) {
            p(this.el, t, e, a);
          }
          closeTips(t) {
            l(this.el, t);
          }
          destroy() {
            const t = this.boxEl.children('#tianai-captcha');
            t && t.remove(), o();
          }
          doMove() {
            const t = this.currentCaptchaData.moveX;
            this.el.find('#tianai-captcha-slider-move-btn').css('transform', 'translate(' + t + 'px, 0px)'),
              this.el.find('#tianai-captcha-slider-img-div').css('transform', 'translate(' + t + 'px, 0px)'),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('width', t + 'px');
          }
          loadStyle() {
            let t = '',
              e = '#00f4ab',
              a = '#a9ffe5';
            const i = this.styleConfig;
            i && ((t = i.btnUrl), (a = i.moveTrackMaskBgColor), (e = i.moveTrackMaskBorderColor)),
              this.el.find('.slider-move .slider-move-btn').css('background-image', 'url(' + t + ')'),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('border-color', e),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('background-color', a);
          }
          loadCaptchaForData(t, e) {
            const a = t.el.find('#tianai-captcha-slider-bg-img'),
              i = t.el.find('#tianai-captcha-slider-move-img');
            a.attr('src', e.captcha.backgroundImage),
              i.attr('src', e.captcha.templateImage),
              a.on('load', () => {
                (t.currentCaptchaData = h(a.width(), a.height(), i.width(), i.height(), 242)),
                  (t.currentCaptchaData.currentCaptchaId = e.id);
              });
          }
        };
        a(305);
        const m = class extends u {
          constructor(t, e) {
            super(),
              (this.boxEl = A(t)),
              (this.styleConfig = e),
              (this.type = 'ROTATE'),
              (this.currentCaptchaData = {});
          }
          init(t, e, a) {
            return (
              this.destroy(),
              this.boxEl.append(
                (this.styleConfig,
                '\n<div id="tianai-captcha" class="tianai-captcha-slider tianai-captcha-rotate">\n    <div class="slider-tip">\n        <span id="tianai-captcha-slider-move-track-font">拖动滑块完成拼图</span>\n    </div>\n    <div class="content">\n        <div class="bg-img-div">\n            <img id="tianai-captcha-slider-bg-img" src="" alt/>\n            <canvas id="tianai-captcha-slider-bg-canvas"></canvas>\n        </div>\n        <div class="rotate-img-div" id="tianai-captcha-slider-img-div">\n            <img id="tianai-captcha-slider-move-img" src="" alt/>\n        </div>\n         <div class="tianai-captcha-tips" id="tianai-captcha-tips"></div>\n    </div>\n    <div class="slider-move">\n        <div class="slider-move-track">\n            <div id="tianai-captcha-slider-move-track-mask"></div>\n            <div class="slider-move-shadow"></div>\n        </div>\n        <div class="slider-move-btn" id="tianai-captcha-slider-move-btn">\n        </div>\n    </div>\n</div>\n'),
              ),
              (this.el = this.boxEl.find('#tianai-captcha')),
              this.loadStyle(),
              this.el.find('#tianai-captcha-slider-move-btn').mousedown(c),
              this.el.find('#tianai-captcha-slider-move-btn').touchstart(c),
              (window.currentCaptcha = this),
              this.loadCaptchaForData(this, t),
              (this.endCallback = e),
              a && a(this),
              this
            );
          }
          destroy() {
            const t = this.boxEl.children('#tianai-captcha');
            t && t.remove(), o();
          }
          doMove() {
            const t = this.currentCaptchaData.moveX;
            this.el.find('#tianai-captcha-slider-move-btn').css('transform', 'translate(' + t + 'px, 0px)'),
              this.el
                .find('#tianai-captcha-slider-move-img')
                .css('transform', 'rotate(' + t / (this.currentCaptchaData.end / 360) + 'deg)'),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('width', t + 'px');
          }
          loadStyle() {
            let t = '',
              e = '#00f4ab',
              a = '#a9ffe5';
            const i = this.styleConfig;
            i && ((t = i.btnUrl), (a = i.moveTrackMaskBgColor), (e = i.moveTrackMaskBorderColor)),
              this.el.find('.slider-move .slider-move-btn').css('background-image', 'url(' + t + ')'),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('border-color', e),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('background-color', a);
          }
          loadCaptchaForData(t, e) {
            const a = t.el.find('#tianai-captcha-slider-bg-img'),
              i = t.el.find('#tianai-captcha-slider-move-img');
            a.attr('src', e.captcha.backgroundImage),
              i.attr('src', e.captcha.templateImage),
              a.on('load', () => {
                (t.currentCaptchaData = h(a.width(), a.height(), i.width(), i.height(), 242)),
                  (t.currentCaptchaData.currentCaptchaId = e.id);
              });
          }
        };
        a(991);
        const v = class extends u {
          constructor(t, e) {
            super(),
              (this.boxEl = A(t)),
              (this.styleConfig = e),
              (this.type = 'CONCAT'),
              (this.currentCaptchaData = {});
          }
          init(t, e, a) {
            return (
              this.destroy(),
              this.boxEl.append(
                (this.styleConfig,
                '\n    <div id="tianai-captcha" class="tianai-captcha-slider tianai-captcha-concat">\n    <div class="slider-tip">\n        <span id="tianai-captcha-slider-move-track-font" >拖动滑块完成拼图</span>\n    </div>\n    <div class="content">\n        <div class="tianai-captcha-slider-concat-img-div" id="tianai-captcha-slider-concat-img-div">\n            <img id="tianai-captcha-slider-concat-slider-img" src="" alt/>\n        </div>\n        <div class="tianai-captcha-slider-concat-bg-img"></div>\n         <div class="tianai-captcha-tips" id="tianai-captcha-tips"></div>\n    </div>\n    <div class="slider-move">\n        <div class="slider-move-track">\n            <div id="tianai-captcha-slider-move-track-mask"></div>\n            <div class="slider-move-shadow"></div>\n        </div>\n        <div class="slider-move-btn" id="tianai-captcha-slider-move-btn">\n        </div>\n    </div>\n</div>\n    '),
              ),
              (this.el = this.boxEl.find('#tianai-captcha')),
              this.loadStyle(),
              this.el.find('#tianai-captcha-slider-move-btn').mousedown(c),
              this.el.find('#tianai-captcha-slider-move-btn').touchstart(c),
              r(this.el),
              (window.currentCaptcha = this),
              this.loadCaptchaForData(this, t),
              (this.endCallback = e),
              a && a(this),
              this
            );
          }
          destroy() {
            o();
            const t = this.boxEl.children('#tianai-captcha');
            t && t.remove();
          }
          doMove() {
            const t = this.currentCaptchaData.moveX;
            this.el.find('#tianai-captcha-slider-move-btn').css('transform', 'translate(' + t + 'px, 0px)'),
              this.el.find('#tianai-captcha-slider-concat-img-div').css('background-position-x', t + 'px'),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('width', t + 'px');
          }
          loadStyle() {
            let t = '',
              e = '#00f4ab',
              a = '#a9ffe5';
            const i = this.styleConfig;
            i && ((t = i.btnUrl), (a = i.moveTrackMaskBgColor), (e = i.moveTrackMaskBorderColor)),
              this.el.find('.slider-move .slider-move-btn').css('background-image', 'url(' + t + ')'),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('border-color', e),
              this.el.find('#tianai-captcha-slider-move-track-mask').css('background-color', a);
          }
          loadCaptchaForData(t, e) {
            const a = t.el.find('.tianai-captcha-slider-concat-bg-img'),
              i = t.el.find('#tianai-captcha-slider-concat-img-div');
            a.css('background-image', 'url(' + e.captcha.backgroundImage + ')'),
              i.css('background-image', 'url(' + e.captcha.backgroundImage + ')'),
              i.css('background-position', '0px 0px');
            var r = e.captcha.backgroundImageHeight,
              n = ((r - e.captcha.data.randomY) / r) * 180;
            i.css('height', n + 'px'),
              (t.currentCaptchaData = h(a.width(), a.height(), i.width(), i.height(), 242)),
              (t.currentCaptchaData.currentCaptchaId = e.id);
          }
        };
        a(492);
        const C = class extends u {
          constructor(t, e) {
            super(),
              (this.boxEl = A(t)),
              (this.styleConfig = e),
              (this.type = 'IMAGE_CLICK'),
              (this.currentCaptchaData = {});
          }
          init(t, e, a) {
            return (
              this.destroy(),
              this.boxEl.append(
                (this.styleConfig,
                '\n<div id="tianai-captcha" class="tianai-captcha-slider tianai-captcha-word-click">\n    <div class="click-tip">\n        <span id="tianai-captcha-click-track-font" >请依次点击:</span>\n        <img src="" id="tianai-captcha-tip-img" class="tip-img">\n    </div>\n    <div class="content">\n        <div class="bg-img-div">\n            <img id="tianai-captcha-slider-bg-img" src="" alt/>\n            <canvas id="tianai-captcha-slider-bg-canvas"></canvas>\n            <div id="bg-img-click-mask"></div>\n        </div>\n         <div class="tianai-captcha-tips" id="tianai-captcha-tips"></div>\n    </div>\n</div>\n'),
              ),
              (this.el = this.boxEl.find('#tianai-captcha')),
              (window.currentCaptcha = this),
              this.loadCaptchaForData(this, t),
              (this.endCallback = e),
              this.el.find('#bg-img-click-mask').click((t) => {
                this.currentCaptchaData.clickCount++;
                const e = this.currentCaptchaData.trackArr,
                  a = this.currentCaptchaData.startTime;
                1 === this.currentCaptchaData.clickCount &&
                  (window.addEventListener('mousemove', s),
                  (this.currentCaptchaData.startX = t.offsetX),
                  (this.currentCaptchaData.startY = t.offsetY)),
                  e.push({
                    x: Math.round(t.offsetX),
                    y: Math.round(t.offsetY),
                    type: 'click',
                    t: new Date().getTime() - a.getTime(),
                  });
                const i = t.offsetX - 10,
                  r = t.offsetY - 10;
                this.el
                  .find('#bg-img-click-mask')
                  .append(
                    "<span class='click-span' style='left:" +
                      i +
                      'px;top: ' +
                      r +
                      "px'>" +
                      this.currentCaptchaData.clickCount +
                      '</span>',
                  ),
                  4 === this.currentCaptchaData.clickCount &&
                    ((this.currentCaptchaData.stopTime = new Date()),
                    window.removeEventListener('mousemove', s),
                    this.endCallback(this.currentCaptchaData, this));
              }),
              a && a(this),
              this
            );
          }
          destroy() {
            const t = this.boxEl.children('#tianai-captcha');
            t && t.remove(), o();
          }
          loadCaptchaForData(t, e) {
            const a = t.el.find('#tianai-captcha-slider-bg-img'),
              i = t.el.find('#tianai-captcha-tip-img');
            a.on('load', () => {
              (t.currentCaptchaData = h(a.width(), a.height(), i.width(), i.height())),
                (t.currentCaptchaData.currentCaptchaId = e.id);
            }),
              a.attr('src', e.captcha.backgroundImage),
              i.attr('src', e.captcha.templateImage);
          }
        };
        const w = class extends C {
          constructor(t, e) {
            super(t, e), (this.type = 'WORD_IMAGE_CLICK');
          }
        };
        class b {
          constructor(t) {
            if (!t.bindEl) throw new Error('[TAC] 必须配置 [bindEl]用于将验证码绑定到该元素上');
            if (!t.requestCaptchaDataUrl) throw new Error('[TAC] 必须配置 [requestCaptchaDataUrl]请求验证码接口');
            if (!t.validCaptchaUrl) throw new Error('[TAC] 必须配置 [validCaptchaUrl]验证验证码接口');
            (this.bindEl = t.bindEl),
              (this.domBindEl = A(t.bindEl)),
              (this.requestCaptchaDataUrl = t.requestCaptchaDataUrl),
              (this.validCaptchaUrl = t.validCaptchaUrl),
              t.validSuccess && (this.validSuccess = t.validSuccess),
              t.validFail && (this.validFail = t.validFail),
              t.requestHeaders ? (this.requestHeaders = t.requestHeaders) : (this.requestHeaders = {}),
              t.btnCloseFun && (this.btnCloseFun = t.btnCloseFun),
              t.btnRefreshFun && (this.btnRefreshFun = t.btnRefreshFun),
              (this.requestChain = []),
              (this.timeToTimestamp = t.timeToTimestamp),
              this.insertRequestChain(0, {
                preRequest(t, e, a, i) {
                  if (this.timeToTimestamp && e.data)
                    for (let t in e.data) e.data[t] instanceof Date && (e.data[t] = e.data[t].getTime());
                  return !0;
                },
              });
          }
          addRequestChain(t) {
            this.requestChain.push(t);
          }
          insertRequestChain(t, e) {
            this.requestChain.splice(t, 0, e);
          }
          removeRequestChain(t) {
            this.requestChain.splice(t, 1);
          }
          requestCaptchaData() {
            const t = {};
            (t.headers = this.requestHeaders || {}),
              (t.data = {}),
              (t.headers['Content-Type'] = 'application/json;charset=UTF-8'),
              (t.method = 'POST'),
              (t.url = this.requestCaptchaDataUrl),
              this._preRequest('requestCaptchaData', t);
            return this.doSendRequest(t).then((e) => (this._postRequest('requestCaptchaData', t, e), e));
          }
          doSendRequest(t) {
            if (t.headers)
              for (const e in t.headers)
                if (t.headers[e].indexOf('application/json') > -1) {
                  'string' != typeof t.data && (t.data = JSON.stringify(t.data));
                  break;
                }
            return ((e = t),
            new Promise(function (t, a) {
              var i = new XMLHttpRequest();
              if ((i.open(e.method || 'GET', e.url), e.headers))
                for (const t in e.headers) e.headers.hasOwnProperty(t) && i.setRequestHeader(t, e.headers[t]);
              (i.onreadystatechange = function () {
                if (i.readyState === XMLHttpRequest.DONE)
                  if (i.status >= 200 && i.status <= 500) {
                    const e = i.getResponseHeader('Content-Type');
                    e && -1 !== e.indexOf('application/json') ? t(JSON.parse(i.responseText)) : t(i.responseText);
                  } else a(new Error('Request failed with status: ' + i.status));
              }),
                (i.onerror = function () {
                  a(new Error('Network Error'));
                }),
                i.send(e.data);
            })).then((t) => {
              try {
                return JSON.parse(t);
              } catch (e) {
                return t;
              }
            });
            var e;
          }
          _preRequest(t, e, a, i) {
            for (let r = 0; r < this.requestChain.length; r++) {
              const n = this.requestChain[r];
              if (n.preRequest && !n.preRequest(t, e, this, a, i)) break;
            }
          }
          _postRequest(t, e, a, i, r) {
            for (let n = 0; n < this.requestChain.length; n++) {
              const c = this.requestChain[n];
              if (c.postRequest && !c.postRequest(t, e, a, this, i, r)) break;
            }
          }
          validCaptcha(t, e, a, i) {
            const r = { id: t, data: e };
            let n = {};
            (n.headers = this.requestHeaders || {}),
              (n.data = r),
              (n.headers['Content-Type'] = 'application/json;charset=UTF-8'),
              (n.method = 'POST'),
              (n.url = this.validCaptchaUrl),
              this._preRequest('validCaptcha', n, a, i);
            return this.doSendRequest(n)
              .then((t) => (this._postRequest('validCaptcha', n, t, a, i), t))
              .then((t) => {
                if (200 == t.code) {
                  const r = (e.endSlidingTime - e.startSlidingTime) / 1e3;
                  a.showTips(`验证成功,耗时${r}秒`, 1, () => this.validSuccess(t, a, i));
                } else {
                  let e = '验证失败，请重新尝试!';
                  t.code && 4001 != t.code && (e = '验证码被黑洞吸走了！'),
                    a.showTips(e, 0, () => this.validFail(t, a, i));
                }
              })
              .catch((t) => {
                let e = a.styleConfig.i18n.tips_error;
                t.code &&
                  200 != t.code &&
                  (4001 != res.code && (e = a.styleConfig.i18n.tips_4001),
                  a.showTips(e, 0, () => this.validFail(res, a, i)));
              });
          }
          validSuccess(t, e, a) {
            (window.currentCaptchaRes = t), a.destroyWindow();
          }
          validFail(t, e, a) {
            a.reloadCaptcha();
          }
        }
        (window.TAC = class {
          constructor(t, e) {
            (this.config = (function (t) {
              return t instanceof b ? t : new b(t);
            })(t)),
              this.config.btnRefreshFun && (this.btnRefreshFun = this.config.btnRefreshFun),
              this.config.btnCloseFun && (this.btnCloseFun = this.config.btnCloseFun),
              (this.style = (function (t) {
                return (
                  t || (t = {}),
                  t.btnUrl ||
                    (t.btnUrl =
                      'data:image/png;base64,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'),
                  t.moveTrackMaskBgColor ||
                    t.moveTrackMaskBorderColor ||
                    ((t.moveTrackMaskBgColor = '#89d2ff'), (t.moveTrackMaskBorderColor = '#0298f8')),
                  t
                );
              })(e));
          }
          init() {
            return (
              this.destroyWindow(),
              this.config.domBindEl.append(
                '\n    <div id="tianai-captcha-parent">\n        <div id="tianai-captcha-bg-img"></div>\n        <div id="tianai-captcha-box">\n            <img id="tianai-captcha-loading" class="loading" style="display: block" src="data:image/gif;base64,R0lGODlhZABkALMPAOP49Jzk2Lns46Pm2/X8+33aytX07pTh1Kvo3sTv6Nz28ef59vH7+g+9oPr+/f///yH/C05FVFNDQVBFMi4wAwEAAAAh/wtYTVAgRGF0YVhNUDw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQ1IDc5LjE2MzQ5OSwgMjAxOC8wOC8xMy0xNjo0MDoyMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjZERUE3QkNBNUY0MTFFOUJCQTZFOUY4NkU2MDExMjMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjZERUE3QkRBNUY0MTFFOUJCQTZFOUY4NkU2MDExMjMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyNkRFQTdCQUE1RjQxMUU5QkJBNkU5Rjg2RTYwMTEyMyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyNkRFQTdCQkE1RjQxMUU5QkJBNkU5Rjg2RTYwMTEyMyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t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" alt="loading">\n        </div>\n        \x3c!-- 底部 --\x3e\n        <div class="slider-bottom">\n            <img class="logo" id="tianai-captcha-logo" src="data:image/png;base64,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" id="tianai-captcha-logo"></img>\n            <div class="close-btn" id="tianai-captcha-slider-close-btn"></div>\n            <div class="refresh-btn" id="tianai-captcha-slider-refresh-btn"></div>\n        </div>\n    </div>\n    ',
              ),
              (this.domTemplate = this.config.domBindEl.find('#tianai-captcha-parent')),
              r(this.domTemplate),
              this.loadStyle(),
              this.config.domBindEl.find('#tianai-captcha-slider-refresh-btn').click((t) => {
                this.btnRefreshFun(t, this);
              }),
              this.config.domBindEl.find('#tianai-captcha-slider-close-btn').click((t) => {
                this.btnCloseFun(t, this);
              }),
              this.reloadCaptcha(),
              this
            );
          }
          btnRefreshFun(t, e) {
            e.reloadCaptcha();
          }
          btnCloseFun(t, e) {
            e.destroyWindow();
          }
          reloadCaptcha() {
            this.showLoading(),
              this.destroyCaptcha(() => {
                this.createCaptcha();
              });
          }
          showLoading() {
            this.config.domBindEl.find('#tianai-captcha-loading').css('display', 'block');
          }
          closeLoading() {
            this.config.domBindEl.find('#tianai-captcha-loading').css('display', 'none');
          }
          loadStyle() {
            const t = this.style.bgUrl,
              e = this.style.logoUrl;
            t && this.config.domBindEl.find('#tianai-captcha-bg-img').css('background-image', 'url(' + t + ')'),
              e && '' !== e
                ? this.config.domBindEl.find('#tianai-captcha-logo').attr('src', e)
                : null === e && this.config.domBindEl.find('#tianai-captcha-logo').css('display', 'none');
          }
          destroyWindow() {
            (window.currentCaptcha = void 0), this.domTemplate && this.domTemplate.remove();
          }
          openCaptcha() {
            setTimeout(() => {
              window.currentCaptcha.el.css('transform', 'translateX(0)');
            }, 10);
          }
          createCaptcha() {
            this.config.requestCaptchaData().then((t) => {
              this.closeLoading();
              const e = (function (t, e) {
                switch (t) {
                  case 'SLIDER':
                    return new f('#tianai-captcha-box', e);
                  case 'ROTATE':
                    return new m('#tianai-captcha-box', e);
                  case 'CONCAT':
                    return new v('#tianai-captcha-box', e);
                  case 'WORD_IMAGE_CLICK':
                    return new w('#tianai-captcha-box', e);
                  default:
                    return null;
                }
              })(t.captcha.type, this.style);
              if (null == e) throw new Error('[TAC] 未知的验证码类型[' + t.captcha.type + ']');
              e.init(t, (t, e) => {
                const a = e.currentCaptchaData,
                  i = {
                    bgImageWidth: a.bgImageWidth,
                    bgImageHeight: a.bgImageHeight,
                    sliderImageWidth: a.sliderImageWidth,
                    sliderImageHeight: a.sliderImageHeight,
                    startSlidingTime: a.startTime,
                    endSlidingTime: a.stopTime,
                    trackList: a.trackArr,
                  };
                ('ROTATE_DEGREE' !== e.type && 'ROTATE' !== e.type) || (i.bgImageWidth = e.currentCaptchaData.end);
                const r = e.currentCaptchaData.currentCaptchaId;
                (e.currentCaptchaData = void 0), this.config.validCaptcha(r, i, e, this);
              }),
                this.openCaptcha();
            });
          }
          destroyCaptcha(t) {
            window.currentCaptcha
              ? (window.currentCaptcha.el.css('transform', 'translateX(300px)'),
                setTimeout(() => {
                  window.currentCaptcha.destroy(), t && t();
                }, 500))
              : t();
          }
        }),
          (window.CaptchaConfig = b);
      },
    },
    i = {};
  function r(t) {
    var e = i[t];
    if (void 0 !== e) {
      if (void 0 !== e.error) throw e.error;
      return e.exports;
    }
    var n = (i[t] = { id: t, exports: {} });
    try {
      var c = { id: t, module: n, factory: a[t], require: r };
      r.i.forEach(function (t) {
        t(c);
      }),
        (n = c.module),
        c.factory.call(n.exports, n, n.exports, c.require);
    } catch (t) {
      throw ((n.error = t), t);
    }
    return n.exports;
  }
  (r.m = a),
    (r.c = i),
    (r.i = []),
    (r.hu = (t) => t + '.' + r.h() + '.hot-update.js'),
    (r.miniCssF = (t) => {}),
    (r.hmrF = () => 'main.' + r.h() + '.hot-update.json'),
    (r.h = () => '64e77207d3e87617a00e'),
    (r.g = (function () {
      if ('object' == typeof globalThis) return globalThis;
      try {
        return this || new Function('return this')();
      } catch (t) {
        if ('object' == typeof window) return window;
      }
    })()),
    (r.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e)),
    (t = {}),
    (e = 'webpack-demo:'),
    (r.l = (a, i, n, c) => {
      if (t[a]) t[a].push(i);
      else {
        var s, o;
        if (void 0 !== n)
          for (var d = document.getElementsByTagName('script'), h = 0; h < d.length; h++) {
            var l = d[h];
            if (l.getAttribute('src') == a || l.getAttribute('data-webpack') == e + n) {
              s = l;
              break;
            }
          }
        s ||
          ((o = !0),
          ((s = document.createElement('script')).charset = 'utf-8'),
          (s.timeout = 120),
          r.nc && s.setAttribute('nonce', r.nc),
          s.setAttribute('data-webpack', e + n),
          (s.src = a)),
          (t[a] = [i]);
        var p = (e, i) => {
            (s.onerror = s.onload = null), clearTimeout(u);
            var r = t[a];
            if ((delete t[a], s.parentNode && s.parentNode.removeChild(s), r && r.forEach((t) => t(i)), e)) return e(i);
          },
          u = setTimeout(p.bind(null, void 0, { type: 'timeout', target: s }), 12e4);
        (s.onerror = p.bind(null, s.onerror)), (s.onload = p.bind(null, s.onload)), o && document.head.appendChild(s);
      }
    }),
    (() => {
      var t,
        e,
        a,
        i = {},
        n = r.c,
        c = [],
        s = [],
        o = 'idle',
        d = 0,
        h = [];
      function l(t) {
        o = t;
        for (var e = [], a = 0; a < s.length; a++) e[a] = s[a].call(null, t);
        return Promise.all(e);
      }
      function p() {
        0 == --d &&
          l('ready').then(function () {
            if (0 === d) {
              var t = h;
              h = [];
              for (var e = 0; e < t.length; e++) t[e]();
            }
          });
      }
      function u(t) {
        if ('idle' !== o) throw new Error('check() is only allowed in idle status');
        return l('check')
          .then(r.hmrM)
          .then(function (a) {
            return a
              ? l('prepare').then(function () {
                  var i = [];
                  return (
                    (e = []),
                    Promise.all(
                      Object.keys(r.hmrC).reduce(function (t, n) {
                        return r.hmrC[n](a.c, a.r, a.m, t, e, i), t;
                      }, []),
                    ).then(function () {
                      return (
                        (e = function () {
                          return t
                            ? g(t)
                            : l('ready').then(function () {
                                return i;
                              });
                        }),
                        0 === d
                          ? e()
                          : new Promise(function (t) {
                              h.push(function () {
                                t(e());
                              });
                            })
                      );
                      var e;
                    })
                  );
                })
              : l(f() ? 'ready' : 'idle').then(function () {
                  return null;
                });
          });
      }
      function A(t) {
        return 'ready' !== o
          ? Promise.resolve().then(function () {
              throw new Error('apply() is only allowed in ready status (state: ' + o + ')');
            })
          : g(t);
      }
      function g(t) {
        (t = t || {}), f();
        var i = e.map(function (e) {
          return e(t);
        });
        e = void 0;
        var r = i
          .map(function (t) {
            return t.error;
          })
          .filter(Boolean);
        if (r.length > 0)
          return l('abort').then(function () {
            throw r[0];
          });
        var n = l('dispose');
        i.forEach(function (t) {
          t.dispose && t.dispose();
        });
        var c,
          s = l('apply'),
          o = function (t) {
            c || (c = t);
          },
          d = [];
        return (
          i.forEach(function (t) {
            if (t.apply) {
              var e = t.apply(o);
              if (e) for (var a = 0; a < e.length; a++) d.push(e[a]);
            }
          }),
          Promise.all([n, s]).then(function () {
            return c
              ? l('fail').then(function () {
                  throw c;
                })
              : a
              ? g(t).then(function (t) {
                  return (
                    d.forEach(function (e) {
                      t.indexOf(e) < 0 && t.push(e);
                    }),
                    t
                  );
                })
              : l('idle').then(function () {
                  return d;
                });
          })
        );
      }
      function f() {
        if (a)
          return (
            e || (e = []),
            Object.keys(r.hmrI).forEach(function (t) {
              a.forEach(function (a) {
                r.hmrI[t](a, e);
              });
            }),
            (a = void 0),
            !0
          );
      }
      (r.hmrD = i),
        r.i.push(function (h) {
          var g,
            f,
            m,
            v,
            C = h.module,
            w = (function (e, a) {
              var i = n[a];
              if (!i) return e;
              var r = function (r) {
                  if (i.hot.active) {
                    if (n[r]) {
                      var s = n[r].parents;
                      -1 === s.indexOf(a) && s.push(a);
                    } else (c = [a]), (t = r);
                    -1 === i.children.indexOf(r) && i.children.push(r);
                  } else c = [];
                  return e(r);
                },
                s = function (t) {
                  return {
                    configurable: !0,
                    enumerable: !0,
                    get: function () {
                      return e[t];
                    },
                    set: function (a) {
                      e[t] = a;
                    },
                  };
                };
              for (var h in e)
                Object.prototype.hasOwnProperty.call(e, h) && 'e' !== h && Object.defineProperty(r, h, s(h));
              return (
                (r.e = function (t) {
                  return (function (t) {
                    switch (o) {
                      case 'ready':
                        l('prepare');
                      case 'prepare':
                        return d++, t.then(p, p), t;
                      default:
                        return t;
                    }
                  })(e.e(t));
                }),
                r
              );
            })(h.require, h.id);
          (C.hot =
            ((g = h.id),
            (f = C),
            (v = {
              _acceptedDependencies: {},
              _acceptedErrorHandlers: {},
              _declinedDependencies: {},
              _selfAccepted: !1,
              _selfDeclined: !1,
              _selfInvalidated: !1,
              _disposeHandlers: [],
              _main: (m = t !== g),
              _requireSelf: function () {
                (c = f.parents.slice()), (t = m ? void 0 : g), r(g);
              },
              active: !0,
              accept: function (t, e, a) {
                if (void 0 === t) v._selfAccepted = !0;
                else if ('function' == typeof t) v._selfAccepted = t;
                else if ('object' == typeof t && null !== t)
                  for (var i = 0; i < t.length; i++)
                    (v._acceptedDependencies[t[i]] = e || function () {}), (v._acceptedErrorHandlers[t[i]] = a);
                else (v._acceptedDependencies[t] = e || function () {}), (v._acceptedErrorHandlers[t] = a);
              },
              decline: function (t) {
                if (void 0 === t) v._selfDeclined = !0;
                else if ('object' == typeof t && null !== t)
                  for (var e = 0; e < t.length; e++) v._declinedDependencies[t[e]] = !0;
                else v._declinedDependencies[t] = !0;
              },
              dispose: function (t) {
                v._disposeHandlers.push(t);
              },
              addDisposeHandler: function (t) {
                v._disposeHandlers.push(t);
              },
              removeDisposeHandler: function (t) {
                var e = v._disposeHandlers.indexOf(t);
                e >= 0 && v._disposeHandlers.splice(e, 1);
              },
              invalidate: function () {
                switch (((this._selfInvalidated = !0), o)) {
                  case 'idle':
                    (e = []),
                      Object.keys(r.hmrI).forEach(function (t) {
                        r.hmrI[t](g, e);
                      }),
                      l('ready');
                    break;
                  case 'ready':
                    Object.keys(r.hmrI).forEach(function (t) {
                      r.hmrI[t](g, e);
                    });
                    break;
                  case 'prepare':
                  case 'check':
                  case 'dispose':
                  case 'apply':
                    (a = a || []).push(g);
                }
              },
              check: u,
              apply: A,
              status: function (t) {
                if (!t) return o;
                s.push(t);
              },
              addStatusHandler: function (t) {
                s.push(t);
              },
              removeStatusHandler: function (t) {
                var e = s.indexOf(t);
                e >= 0 && s.splice(e, 1);
              },
              data: i[g],
            }),
            (t = void 0),
            v)),
            (C.parents = c),
            (C.children = []),
            (c = []),
            (h.require = w);
        }),
        (r.hmrC = {}),
        (r.hmrI = {});
    })(),
    (() => {
      var t;
      r.g.importScripts && (t = r.g.location + '');
      var e = r.g.document;
      if (!t && e && (e.currentScript && (t = e.currentScript.src), !t)) {
        var a = e.getElementsByTagName('script');
        if (a.length) for (var i = a.length - 1; i > -1 && !t; ) t = a[i--].src;
      }
      if (!t) throw new Error('Automatic publicPath is not supported in this browser');
      (t = t
        .replace(/#.*$/, '')
        .replace(/\?.*$/, '')
        .replace(/\/[^\/]+$/, '/')),
        (r.p = t);
    })(),
    (() => {
      if ('undefined' != typeof document) {
        var t = (t, e, a, i, r) => {
            var n = document.createElement('link');
            (n.rel = 'stylesheet'), (n.type = 'text/css');
            return (
              (n.onerror = n.onload = (a) => {
                if (((n.onerror = n.onload = null), 'load' === a.type)) i();
                else {
                  var c = a && ('load' === a.type ? 'missing' : a.type),
                    s = (a && a.target && a.target.href) || e,
                    o = new Error('Loading CSS chunk ' + t + ' failed.\n(' + s + ')');
                  (o.code = 'CSS_CHUNK_LOAD_FAILED'),
                    (o.type = c),
                    (o.request = s),
                    n.parentNode && n.parentNode.removeChild(n),
                    r(o);
                }
              }),
              (n.href = e),
              a ? a.parentNode.insertBefore(n, a.nextSibling) : document.head.appendChild(n),
              n
            );
          },
          e = (t, e) => {
            for (var a = document.getElementsByTagName('link'), i = 0; i < a.length; i++) {
              var r = (c = a[i]).getAttribute('data-href') || c.getAttribute('href');
              if ('stylesheet' === c.rel && (r === t || r === e)) return c;
            }
            var n = document.getElementsByTagName('style');
            for (i = 0; i < n.length; i++) {
              var c;
              if ((r = (c = n[i]).getAttribute('data-href')) === t || r === e) return c;
            }
          },
          a = [],
          i = [],
          n = (t) => ({
            dispose: () => {
              for (var t = 0; t < a.length; t++) {
                var e = a[t];
                e.parentNode && e.parentNode.removeChild(e);
              }
              a.length = 0;
            },
            apply: () => {
              for (var t = 0; t < i.length; t++) i[t].rel = 'stylesheet';
              i.length = 0;
            },
          });
        r.hmrC.miniCss = (c, s, o, d, h, l) => {
          h.push(n),
            c.forEach((n) => {
              var c = r.miniCssF(n),
                s = r.p + c,
                o = e(c, s);
              o &&
                d.push(
                  new Promise((e, r) => {
                    var c = t(
                      n,
                      s,
                      o,
                      () => {
                        (c.as = 'style'), (c.rel = 'preload'), e();
                      },
                      r,
                    );
                    a.push(o), i.push(c);
                  }),
                );
            });
        };
      }
    })(),
    (() => {
      var t,
        e,
        a,
        i,
        n,
        c = (r.hmrS_jsonp = r.hmrS_jsonp || { 179: 0 }),
        s = {};
      function o(e, a) {
        return (
          (t = a),
          new Promise((t, a) => {
            s[e] = t;
            var i = r.p + r.hu(e),
              n = new Error();
            r.l(i, (t) => {
              if (s[e]) {
                s[e] = void 0;
                var i = t && ('load' === t.type ? 'missing' : t.type),
                  r = t && t.target && t.target.src;
                (n.message = 'Loading hot update chunk ' + e + ' failed.\n(' + i + ': ' + r + ')'),
                  (n.name = 'ChunkLoadError'),
                  (n.type = i),
                  (n.request = r),
                  a(n);
              }
            });
          })
        );
      }
      function d(t) {
        function s(t) {
          for (
            var e = [t],
              a = {},
              i = e.map(function (t) {
                return { chain: [t], id: t };
              });
            i.length > 0;

          ) {
            var n = i.pop(),
              c = n.id,
              s = n.chain,
              d = r.c[c];
            if (d && (!d.hot._selfAccepted || d.hot._selfInvalidated)) {
              if (d.hot._selfDeclined) return { type: 'self-declined', chain: s, moduleId: c };
              if (d.hot._main) return { type: 'unaccepted', chain: s, moduleId: c };
              for (var h = 0; h < d.parents.length; h++) {
                var l = d.parents[h],
                  p = r.c[l];
                if (p) {
                  if (p.hot._declinedDependencies[c])
                    return { type: 'declined', chain: s.concat([l]), moduleId: c, parentId: l };
                  -1 === e.indexOf(l) &&
                    (p.hot._acceptedDependencies[c]
                      ? (a[l] || (a[l] = []), o(a[l], [c]))
                      : (delete a[l], e.push(l), i.push({ chain: s.concat([l]), id: l })));
                }
              }
            }
          }
          return { type: 'accepted', moduleId: t, outdatedModules: e, outdatedDependencies: a };
        }
        function o(t, e) {
          for (var a = 0; a < e.length; a++) {
            var i = e[a];
            -1 === t.indexOf(i) && t.push(i);
          }
        }
        r.f && delete r.f.jsonpHmr, (e = void 0);
        var d = {},
          h = [],
          l = {},
          p = function (t) {};
        for (var u in a)
          if (r.o(a, u)) {
            var A,
              g = a[u],
              f = !1,
              m = !1,
              v = !1,
              C = '';
            switch (
              ((A = g ? s(u) : { type: 'disposed', moduleId: u }).chain &&
                (C = '\nUpdate propagation: ' + A.chain.join(' -> ')),
              A.type)
            ) {
              case 'self-declined':
                t.onDeclined && t.onDeclined(A),
                  t.ignoreDeclined || (f = new Error('Aborted because of self decline: ' + A.moduleId + C));
                break;
              case 'declined':
                t.onDeclined && t.onDeclined(A),
                  t.ignoreDeclined ||
                    (f = new Error('Aborted because of declined dependency: ' + A.moduleId + ' in ' + A.parentId + C));
                break;
              case 'unaccepted':
                t.onUnaccepted && t.onUnaccepted(A),
                  t.ignoreUnaccepted || (f = new Error('Aborted because ' + u + ' is not accepted' + C));
                break;
              case 'accepted':
                t.onAccepted && t.onAccepted(A), (m = !0);
                break;
              case 'disposed':
                t.onDisposed && t.onDisposed(A), (v = !0);
                break;
              default:
                throw new Error('Unexception type ' + A.type);
            }
            if (f) return { error: f };
            if (m)
              for (u in ((l[u] = g), o(h, A.outdatedModules), A.outdatedDependencies))
                r.o(A.outdatedDependencies, u) && (d[u] || (d[u] = []), o(d[u], A.outdatedDependencies[u]));
            v && (o(h, [A.moduleId]), (l[u] = p));
          }
        a = void 0;
        for (var w, b = [], D = 0; D < h.length; D++) {
          var k = h[D],
            E = r.c[k];
          E &&
            (E.hot._selfAccepted || E.hot._main) &&
            l[k] !== p &&
            !E.hot._selfInvalidated &&
            b.push({ module: k, require: E.hot._requireSelf, errorHandler: E.hot._selfAccepted });
        }
        return {
          dispose: function () {
            var t;
            i.forEach(function (t) {
              delete c[t];
            }),
              (i = void 0);
            for (var e, a = h.slice(); a.length > 0; ) {
              var n = a.pop(),
                s = r.c[n];
              if (s) {
                var o = {},
                  l = s.hot._disposeHandlers;
                for (D = 0; D < l.length; D++) l[D].call(null, o);
                for (r.hmrD[n] = o, s.hot.active = !1, delete r.c[n], delete d[n], D = 0; D < s.children.length; D++) {
                  var p = r.c[s.children[D]];
                  p && (t = p.parents.indexOf(n)) >= 0 && p.parents.splice(t, 1);
                }
              }
            }
            for (var u in d)
              if (r.o(d, u) && (s = r.c[u]))
                for (w = d[u], D = 0; D < w.length; D++)
                  (e = w[D]), (t = s.children.indexOf(e)) >= 0 && s.children.splice(t, 1);
          },
          apply: function (e) {
            for (var a in l) r.o(l, a) && (r.m[a] = l[a]);
            for (var i = 0; i < n.length; i++) n[i](r);
            for (var c in d)
              if (r.o(d, c)) {
                var s = r.c[c];
                if (s) {
                  w = d[c];
                  for (var o = [], p = [], u = [], A = 0; A < w.length; A++) {
                    var g = w[A],
                      f = s.hot._acceptedDependencies[g],
                      m = s.hot._acceptedErrorHandlers[g];
                    if (f) {
                      if (-1 !== o.indexOf(f)) continue;
                      o.push(f), p.push(m), u.push(g);
                    }
                  }
                  for (var v = 0; v < o.length; v++)
                    try {
                      o[v].call(null, w);
                    } catch (a) {
                      if ('function' == typeof p[v])
                        try {
                          p[v](a, { moduleId: c, dependencyId: u[v] });
                        } catch (i) {
                          t.onErrored &&
                            t.onErrored({
                              type: 'accept-error-handler-errored',
                              moduleId: c,
                              dependencyId: u[v],
                              error: i,
                              originalError: a,
                            }),
                            t.ignoreErrored || (e(i), e(a));
                        }
                      else
                        t.onErrored &&
                          t.onErrored({ type: 'accept-errored', moduleId: c, dependencyId: u[v], error: a }),
                          t.ignoreErrored || e(a);
                    }
                }
              }
            for (var C = 0; C < b.length; C++) {
              var D = b[C],
                k = D.module;
              try {
                D.require(k);
              } catch (a) {
                if ('function' == typeof D.errorHandler)
                  try {
                    D.errorHandler(a, { moduleId: k, module: r.c[k] });
                  } catch (i) {
                    t.onErrored &&
                      t.onErrored({
                        type: 'self-accept-error-handler-errored',
                        moduleId: k,
                        error: i,
                        originalError: a,
                      }),
                      t.ignoreErrored || (e(i), e(a));
                  }
                else
                  t.onErrored && t.onErrored({ type: 'self-accept-errored', moduleId: k, error: a }),
                    t.ignoreErrored || e(a);
              }
            }
            return h;
          },
        };
      }
      (self.webpackHotUpdatewebpack_demo = (e, i, c) => {
        for (var o in i) r.o(i, o) && ((a[o] = i[o]), t && t.push(o));
        c && n.push(c), s[e] && (s[e](), (s[e] = void 0));
      }),
        (r.hmrI.jsonp = function (t, e) {
          a || ((a = {}), (n = []), (i = []), e.push(d)), r.o(a, t) || (a[t] = r.m[t]);
        }),
        (r.hmrC.jsonp = function (t, s, h, l, p, u) {
          p.push(d),
            (e = {}),
            (i = s),
            (a = h.reduce(function (t, e) {
              return (t[e] = !1), t;
            }, {})),
            (n = []),
            t.forEach(function (t) {
              r.o(c, t) && void 0 !== c[t] ? (l.push(o(t, u)), (e[t] = !0)) : (e[t] = !1);
            }),
            r.f &&
              (r.f.jsonpHmr = function (t, a) {
                e && r.o(e, t) && !e[t] && (a.push(o(t)), (e[t] = !0));
              });
        }),
        (r.hmrM = () => {
          if ('undefined' == typeof fetch) throw new Error('No browser support: need fetch API');
          return fetch(r.p + r.hmrF()).then((t) => {
            if (404 !== t.status) {
              if (!t.ok) throw new Error('Failed to fetch update manifest ' + t.statusText);
              return t.json();
            }
          });
        });
    })();
  r(600);
})();
