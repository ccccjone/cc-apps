#!/bin/zsh
# 作品集根页上线前检查。用法：tools/check.sh
# bedtime-games/ 的检查在 sleepy-game 仓库的 tools/site-check.sh，那边也会顺带查根页。
set -uo pipefail
cd "$(dirname "$0")/.."
P=index.html
fail=0
bad() { print -r -- "✗ $1"; fail=1 }
ok() { print -r -- "✓ $1" }

# 1. 必需文件
for f in index.html favicon.svg apple-touch-icon.png og.png .nojekyll \
         fonts/kuaile.woff2 fonts/smiley.woff2 fonts/caveat.woff2 \
         fonts/OFL-ZCOOLKuaiLe.txt fonts/OFL-SmileySans.txt fonts/OFL-Caveat.txt; do
  [[ -e "$f" ]] || bad "缺文件 $f"
done
(( fail )) && { print -r -- "—— 有未通过项 ——"; exit 1 }
ok "必需文件齐全"

# 2. 零外部资源：图片、脚本、样式、字体都得在本仓库里；<a href> 跳去别的网站不算资源（作品可以放在别处）
if grep -nE 'src="(https?:)?//|<link[^>]+href="(https?:)?//' $P; then
  bad "引用了外部资源（见上）"
elif grep -nE 'url\(["'"'"']?(https?:)?//|@import' $P; then
  bad "样式引用了外部资源（见上）"
else ok "零外部资源"; fi

# 3. 站内链接都指向真实存在的文件（目录按 index.html 算）
missing=$(python3 - $P <<'PY'
import os,re,sys
s=open(sys.argv[1],encoding='utf-8').read()
s=re.sub(r'<!--.*?-->|<script>.*?</script>','',s,flags=re.S)   # 注释里的示例、脚本里的模板不算
for u in sorted(set(re.findall(r'(?:src|href)="([^"]*)"',s))):
    if re.match(r'[a-z]+:|#|data:',u): continue
    u=u.split('?')[0].split('#')[0]
    if u.endswith('/') or u=='': u+='index.html'
    if not os.path.exists(u): print(u)
PY
)
[[ -z "$missing" ]] && ok "站内链接都存在" || bad "站内链接指向不存在的文件：${missing//$'\n'/ }"

# 4. 每个作品：有标题、中英两段文字、至少一个按钮
python3 - $P <<'PY' && ok "作品清单格式正确" || bad "作品清单格式有问题（见上）"
import re,sys
s=open(sys.argv[1],encoding='utf-8').read()
m=re.search(r'<ul class="grid" id="list">(.*?)</ul>',s,re.S)
if not m: print('  找不到 <ul id="list">'); sys.exit(1)
works=re.findall(r'<li class="work">(.*?)</li>',m.group(1),re.S)
err=0
if not works: print('  清单是空的'); err=1
for i,w in enumerate(works,1):
    need={'标题 h3':'<h3 class="name','中文':'lang="zh-Hans"','英文':'lang="en"','按钮区':'class="links"'}
    for k,v in need.items():
        if v not in w: print(f'  第 {i} 个作品缺{k}'); err=1
    if not re.search(r'<a class="(site|story|code)"',w): print(f'  第 {i} 个作品没有任何按钮'); err=1
if len(works)>15: print(f'  作品 {len(works)} 个，扭蛋机只装 15 颗'); err=1
sys.exit(err)
PY

# 5. 字体子集没过期：页面里出现的汉字，快乐体和得意黑子集里都得有（没有说明加了文案忘了跑 tools/subset-fonts.sh）
V=tools/.cache/venv/bin/python
if [[ -x $V ]]; then
  $V - $P <<'PY' && ok "字体子集覆盖全部汉字" || bad "字体子集缺字，跑 tools/subset-fonts.sh"
import sys
from fontTools.ttLib import TTFont
han=sorted({c for c in open(sys.argv[1],encoding='utf-8').read() if '一'<=c<='鿿'})
err=0
for f in ('kuaile','smiley'):
    cmap=TTFont(f'fonts/{f}.woff2').getBestCmap()
    miss=[c for c in han if ord(c) not in cmap]
    if miss: print(f'  {f}.woff2 缺：{"".join(miss)}'); err=1
sys.exit(err)
PY
else print -r -- "· 跳过字体检查（先跑一次 tools/subset-fonts.sh 建环境）"; fi

# 6. 脚本语法、分享图带版本号、字体变量没和主题色 --body 撞名
if command -v node >/dev/null; then
  python3 -c 'import re,sys;s=open(sys.argv[1],encoding="utf-8").read();print(re.findall(r"<script>(.*?)</script>",s,re.S)[-1])' $P > tools/.page.js 2>/dev/null
  node --check tools/.page.js 2>&1 && ok "页面脚本语法正确" || bad "页面脚本语法错误（见上）"
  rm -f tools/.page.js
fi
grep -qE 'og:image" content="[^"]*og\.png\?v=[0-9]+"' $P && ok "分享图地址带 ?v=" || bad "og:image 缺 ?v= 版本号"
if grep -nE '\-\-body:\s*(-apple|system|"|ui-)' $P; then bad "--body 被当成字体变量用了（它是机身颜色）"; else ok "主题变量没撞名"; fi

(( fail )) && { print -r -- "—— 有未通过项 ——"; exit 1 }
print -r -- "—— 全部通过 ——"
