#!/bin/zsh
# 重出分享图 og.png（1200×630）和 apple-touch-icon.png（180×180），需本机 Chrome。
# 改了扭蛋机外观、配色或站名后跑；跑完把 index.html 里 og:image 的 ?v= 加一，逼各平台重新抓图。
# 分享图扭蛋机居中：微信等会把图裁成正方形只取中间，两侧站名被裁掉也不影响。
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8765
shot() { "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size="$1" --virtual-time-budget=4000 --screenshot="$2" "http://localhost:$PORT/$3" 2>/dev/null }

# 分享图：根页本身 + 一段覆盖样式（只留扭蛋机，两侧加站名），临时文件放根目录以便读到 fonts/
python3 - <<'PY'
s=open('index.html',encoding='utf-8').read()
css='''<style>
.top,.hero-text,.result,.cue,.screen2{display:none!important}
body{background-image:repeating-conic-gradient(from 0deg at 50% 118%,#f2c14e 0 7deg,#e9ae35 7deg 14deg);background-attachment:scroll}
.screen1{min-height:0;height:630px;padding:0;display:grid;place-items:center}
.screen1 .in{max-width:none}
.hero{display:grid!important;place-items:center;height:auto!important;grid-template:none!important}
.machine{width:372px!important;grid-area:auto!important}
.side{position:fixed;top:50%;translate:0 -50%;font-size:46px;line-height:1.1;width:250px}
.side.l{left:40px;font-family:var(--zh-hero)}
.side.r{right:40px;text-align:right;font-family:var(--en);font-weight:700;font-size:58px}
.side small{display:block;font-size:20px;color:var(--mute);margin-top:12px;font-family:var(--font-body);font-weight:400}
</style>
</head>'''
for a,b in [('</head>',css),
            ('<main>','<main><div class="side l">Aria<br>的扭蛋机<small>转一下，掉出一个小作品</small></div><div class="side r">Aria\'s<br>Gacha<small>out pops a little thing I made</small></div>'),
            ("<script>\n(()=>{","<script>\ntry{localStorage.setItem('lang','zh-Hans')}catch(e){}\n(()=>{")]:
    assert s.count(a)>=1,a; s=s.replace(a,b,1)
open('_og.html','w',encoding='utf-8').write(s)
PY
cp tools/art/touch-icon.html _touch.html
python3 -m http.server $PORT >/dev/null 2>&1 & SRV=$!
trap 'kill $SRV 2>/dev/null; rm -f _og.html _touch.html' EXIT
sleep 1
shot 1200,630 og.png _og.html
shot 180,180 apple-touch-icon.png _touch.html
sips -g pixelWidth -g pixelHeight og.png apple-touch-icon.png | grep -v '^/' | paste - - | sed 's/  */ /g'
