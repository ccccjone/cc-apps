/* 语言切换：?lang= > localStorage > 浏览器语言 > 中文。
   页面可用 <html data-langs="…"> 声明语言子集，选中的语言不在其中时回退英文。
   渐进增强——脚本不跑时页面就是三语平铺，照样能读。
   同一份脚本供 index.html / privacy.html / support.html 及后续新页面直接引入，
   不对具体页面结构做假设，只依赖 .lang-switch 按钮组与 [lang] / [data-alt-*] 约定。 */
(function () {
  var LANGS = ['zh-Hans', 'en', 'es'];
  var KEY = 'bedtime-games-lang';
  // 页面可声明自己支持的语言（如幕后页只有中英）：<html data-langs="zh-Hans en">
  var declared = (document.documentElement.getAttribute('data-langs') || '').split(/\s+/).filter(Boolean);
  var SUPPORTED = declared.length ? LANGS.filter(function (l) { return declared.indexOf(l) >= 0; }) : LANGS;

  function fit(lang) {
    if (lang && SUPPORTED.indexOf(lang) >= 0) return lang;
    return SUPPORTED.indexOf('en') >= 0 ? 'en' : SUPPORTED[0];
  }

  function normalize(tag) {
    if (!tag) return null;
    tag = tag.toLowerCase();
    if (tag.indexOf('zh') === 0) return 'zh-Hans';
    if (tag.indexOf('en') === 0) return 'en';
    if (tag.indexOf('es') === 0) return 'es';
    return null;
  }

  function pick() {
    var q = normalize(new URLSearchParams(location.search).get('lang'));
    if (q) return q;
    try {
      var saved = normalize(localStorage.getItem(KEY));
      if (saved) return saved;
    } catch (e) { /* 隐私模式下 localStorage 会抛，忽略 */ }
    var navLangs = navigator.languages || [navigator.language];
    for (var i = 0; i < navLangs.length; i++) {
      var hit = normalize(navLangs[i]);
      if (hit) return hit;
    }
    return declared.length ? 'en' : 'zh-Hans';
  }

  function apply(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute('data-lang') === lang;
      buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    var imgs = document.querySelectorAll('img[data-alt-' + lang.toLowerCase() + ']');
    for (var j = 0; j < imgs.length; j++) {
      imgs[j].alt = imgs[j].getAttribute('data-alt-' + lang.toLowerCase());
    }
  }

  var current = fit(pick());
  apply(current);   // 在 <head> 里同步跑，避免先闪三语

  document.addEventListener('DOMContentLoaded', function () {
    apply(current);
    var box = document.querySelector('.lang-switch');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var lang = e.target.getAttribute && e.target.getAttribute('data-lang');
      if (SUPPORTED.indexOf(lang) < 0) return;
      current = lang;
      apply(lang);
      try { localStorage.setItem(KEY, lang); } catch (err) { /* 同上 */ }
      var url = new URL(location.href);
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    });
  });
})();
