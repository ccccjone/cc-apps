#!/bin/zsh
# 作品集根页（index.html，扭蛋机）字体子集化：站点零外部资源，字体自托管 woff2。
# 改了根页文案或加了作品后重跑。用法：tools/subset-fonts.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$PWD"; C="$ROOT/tools/.cache"; OUT="$ROOT/fonts"
mkdir -p "$C/src" "$OUT"
[[ -d "$C/venv" ]] || python3 -m venv "$C/venv"
"$C/venv/bin/pip" install -q fonttools brotli

GF=https://github.com/google/fonts/raw/main/ofl
get() { [[ -s "$C/src/$2" ]] || curl -sSfL -o "$C/src/$2" "$1" }
get "$GF/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf" ZCOOLKuaiLe-Regular.ttf
get "$GF/zcoolkuaile/OFL.txt" OFL-ZCOOLKuaiLe.txt
get "$GF/caveat/Caveat%5Bwght%5D.ttf" Caveat-VF.ttf
get "$GF/caveat/OFL.txt" OFL-Caveat.txt
get https://github.com/atelier-anchor/smiley-sans/releases/download/v2.0.1/smiley-sans-v2.0.1.zip smiley-sans-v2.0.1.zip
get https://raw.githubusercontent.com/atelier-anchor/smiley-sans/main/LICENSE OFL-SmileySans.txt
[[ -s "$C/src/SmileySans-Oblique.ttf" ]] || unzip -oq "$C/src/smiley-sans-v2.0.1.zip" SmileySans-Oblique.ttf -d "$C/src"

# 子集文本：根页完整源码（含 <script>，纸条上的「扭蛋 No.」「到手！」是脚本写出来的）
LATIN="U+0020-007E,U+00A0-00FF,U+2018-201F,U+2026,U+3000-303F,U+FF01-FF5E"
sub() { "$C/venv/bin/pyftsubset" "$C/src/$1" --text-file="$ROOT/index.html" --unicodes="$LATIN" --flavor=woff2 --output-file="$OUT/$2" }
sub ZCOOLKuaiLe-Regular.ttf kuaile.woff2
sub SmileySans-Oblique.ttf smiley.woff2
sub Caveat-VF.ttf caveat.woff2          # 保留字重轴，一个文件覆盖 400–700
cp "$C/src/OFL-ZCOOLKuaiLe.txt" "$C/src/OFL-SmileySans.txt" "$C/src/OFL-Caveat.txt" "$OUT/"
ls -la "$OUT"/*.woff2
