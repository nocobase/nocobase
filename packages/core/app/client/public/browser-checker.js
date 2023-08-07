showLog = true;
function log(m) {
  if (window.console && showLog) {
    console.log(m);
  }
}
function css_browser_selector(u) {
  var uaInfo = {},
    screens = [320, 480, 640, 768, 1024, 1152, 1280, 1440, 1680, 1920, 2560],
    allScreens = screens.length,
    ua = u.toLowerCase(),
    is = function (t) {
      return RegExp(t, 'i').test(ua);
    },
    version = function (p, n) {
      n = n.replace('.', '_');
      var i = n.indexOf('_'),
        ver = '';
      while (i > 0) {
        ver += ' ' + p + n.substring(0, i);
        i = n.indexOf('_', i + 1);
      }
      ver += ' ' + p + n;
      return ver;
    },
    g = 'gecko',
    w = 'webkit',
    c = 'chrome',
    f = 'firefox',
    s = 'safari',
    o = 'opera',
    m = 'mobile',
    a = 'android',
    bb = 'blackberry',
    lang = 'lang_',
    dv = 'device_',
    html = document.documentElement,
    b = [
      (!/opera|webtv/i.test(ua) && /msie\s(\d+)/.test(ua)) || /trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.test(ua)
        ? 'ie ie' + (/trident\/4\.0/.test(ua) ? '8' : RegExp.$1 == '11.0' ? '11' : RegExp.$1)
        : is('firefox/')
        ? g +
          ' ' +
          f +
          (/firefox\/((\d+)(\.(\d+))(\.\d+)*)/.test(ua)
            ? ' ' + f + RegExp.$2 + ' ' + f + RegExp.$2 + '_' + RegExp.$4
            : '')
        : is('gecko/')
        ? g
        : is('opera')
        ? o +
          (/version\/((\d+)(\.(\d+))(\.\d+)*)/.test(ua)
            ? ' ' + o + RegExp.$2 + ' ' + o + RegExp.$2 + '_' + RegExp.$4
            : /opera(\s|\/)(\d+)\.(\d+)/.test(ua)
            ? ' ' + o + RegExp.$2 + ' ' + o + RegExp.$2 + '_' + RegExp.$3
            : '')
        : is('konqueror')
        ? 'konqueror'
        : is('blackberry')
        ? bb +
          (/Version\/(\d+)(\.(\d+)+)/i.test(ua)
            ? ' ' + bb + RegExp.$1 + ' ' + bb + RegExp.$1 + RegExp.$2.replace('.', '_')
            : /Blackberry ?(([0-9]+)([a-z]?))[\/|;]/gi.test(ua)
            ? ' ' + bb + RegExp.$2 + (RegExp.$3 ? ' ' + bb + RegExp.$2 + RegExp.$3 : '')
            : '')
        : is('android')
        ? a +
          (/Version\/(\d+)(\.(\d+))+/i.test(ua)
            ? ' ' + a + RegExp.$1 + ' ' + a + RegExp.$1 + RegExp.$2.replace('.', '_')
            : '') +
          (/Android (.+); (.+) Build/i.test(ua) ? ' ' + dv + RegExp.$2.replace(/ /g, '_').replace(/-/g, '_') : '')
        : is('chrome')
        ? w +
          ' ' +
          c +
          (/chrome\/((\d+)(\.(\d+))(\.\d+)*)/.test(ua)
            ? ' ' + c + RegExp.$2 + (RegExp.$4 > 0 ? ' ' + c + RegExp.$2 + '_' + RegExp.$4 : '')
            : '')
        : is('iron')
        ? w + ' iron'
        : is('applewebkit/')
        ? w +
          ' ' +
          s +
          (/version\/((\d+)(\.(\d+))(\.\d+)*)/.test(ua)
            ? ' ' + s + RegExp.$2 + ' ' + s + RegExp.$2 + RegExp.$3.replace('.', '_')
            : / Safari\/(\d+)/i.test(ua)
            ? RegExp.$1 == '419' || RegExp.$1 == '417' || RegExp.$1 == '416' || RegExp.$1 == '412'
              ? ' ' + s + '2_0'
              : RegExp.$1 == '312'
              ? ' ' + s + '1_3'
              : RegExp.$1 == '125'
              ? ' ' + s + '1_2'
              : RegExp.$1 == '85'
              ? ' ' + s + '1_0'
              : ''
            : '')
        : is('mozilla/')
        ? g
        : '',
      is('android|mobi|mobile|j2me|iphone|ipod|ipad|blackberry|playbook|kindle|silk') ? m : '',
      is('j2me')
        ? 'j2me'
        : is('ipad|ipod|iphone')
        ? (/CPU( iPhone)? OS (\d+[_|\.]\d+([_|\.]\d+)*)/i.test(ua) ? 'ios' + version('ios', RegExp.$2) : '') +
          ' ' +
          (/(ip(ad|od|hone))/gi.test(ua) ? RegExp.$1 : '')
        : is('playbook')
        ? 'playbook'
        : is('kindle|silk')
        ? 'kindle'
        : is('playbook')
        ? 'playbook'
        : is('mac')
        ? 'mac' +
          (/mac os x ((\d+)[.|_](\d+))/.test(ua) ? ' mac' + RegExp.$2 + ' mac' + RegExp.$1.replace('.', '_') : '')
        : is('win')
        ? 'win' +
          (is('windows nt 6.2')
            ? ' win8'
            : is('windows nt 6.1')
            ? ' win7'
            : is('windows nt 6.0')
            ? ' vista'
            : is('windows nt 5.2') || is('windows nt 5.1')
            ? ' win_xp'
            : is('windows nt 5.0')
            ? ' win_2k'
            : is('windows nt 4.0') || is('WinNT4.0')
            ? ' win_nt'
            : '')
        : is('freebsd')
        ? 'freebsd'
        : is('x11|linux')
        ? 'linux'
        : '',
      /[; |\[](([a-z]{2})(\-[a-z]{2})?)[)|;|\]]/i.test(ua)
        ? (lang + RegExp.$2).replace('-', '_') + (RegExp.$3 != '' ? (' ' + lang + RegExp.$1).replace('-', '_') : '')
        : '',
      is('ipad|iphone|ipod') && !is('safari') ? 'ipad_app' : '',
    ];
  console.debug(ua);
  function screenSize() {
    var w = window.outerWidth || html.clientWidth;
    var h = window.outerHeight || html.clientHeight;
    uaInfo.orientation = w < h ? 'portrait' : 'landscape';
    html.className = html.className.replace(/ ?orientation_\w+/g, '').replace(/ [min|max|cl]+[w|h]_\d+/g, '');
    for (var i = allScreens - 1; i >= 0; i--) {
      if (w >= screens[i]) {
        uaInfo.maxw = screens[i];
        break;
      }
    }
    widthClasses = '';
    for (var info in uaInfo) {
      widthClasses += ' ' + info + '_' + uaInfo[info];
    }
    html.className = html.className + widthClasses;
    return widthClasses;
  }
  window.onresize = screenSize;
  screenSize();
  function retina() {
    var r = window.devicePixelRatio > 1;
    if (r) {
      html.className += ' retina';
    } else {
      html.className += ' non-retina';
    }
  }
  retina();
  var cssbs = b.join(' ') + ' js ';
  html.className = (cssbs + html.className.replace(/\b(no[-|_]?)?js\b/g, '')).replace(/^ /, '').replace(/ +/g, ' ');
  return cssbs;
}
css_browser_selector(navigator.userAgent);
