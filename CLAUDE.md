# cc-apps：Aria 的作品集站

公开仓库 `ccccjone/cc-apps`，只有 `gh-pages` 一个分支，**整个分支原样发布**到 https://ccccjone.github.io/cc-apps/
（有 `.nojekyll`，不经 Jekyll，零构建）。push 即上线，所以 **push 前先问用户**。
仓库里的每个文件（包括本文件和 `tools/`）都能被公开访问到：设计过程、规格、草稿不要提交进来。
不能公开的上下文（本机路径、记忆、设计稿链接）放在被忽略的 `CLAUDE.local.md` 和 `.private/` 里，只存在本机。

## 目录

- `index.html`：作品集首页「Aria 的扭蛋机」。单文件，样式和脚本都内联。
- `favicon.svg`、`apple-touch-icon.png`、`og.png`（分享图）：都属于首页。后两个由 `tools/render-art.sh` 生成，不要手改。
- `fonts/`：首页的自托管字体子集，由 `tools/subset-fonts.sh` 生成。
- `bedtime-games/`：Nighty（晚安游戏机）的官网、隐私政策、技术支持、试玩和幕后页。**已定稿，不要动**。
  它的图片、字体、幕后存档由另一个仓库 sleepy-game 的工具生成（本机路径见 CLAUDE.local.md）。
  要改的话去那边按它的 CLAUDE.md 做，并跑那边的 `tools/site-check.sh`。
  隐私政策的文字自提审后一字不能改。
- `tools/`：首页用的脚本。`tools/.cache/` 是下载的字体源和 Python 环境，不入库。

## 常用命令

- 上线前检查：`tools/check.sh`。查必需文件、零外部资源、站内链接、作品清单格式、字体缺字和脚本语法。
- 字体子集（改了首页文案或加了作品后）：`tools/subset-fonts.sh`。输出是确定性的，文案没变时重跑不会产生 diff。
- 分享图和触屏图标（改了扭蛋机外观、配色或站名后，需本机 Chrome）：`tools/render-art.sh`。
  跑完把 `index.html` 里 `og:image` 的 `?v=` 加一，逼各平台重新抓图。
- 本地预览：`python3 -m http.server 8765`，然后打开 http://localhost:8765/ 。
  直接双击打开文件时字体加载不了，必须走 http。

## 常做的事

**加一个作品**
1. 在 `index.html` 的 `<ul id="list">` 里复制一个 `<li class="work">`，改图标、中英名字、标签和中英简介。
2. 按钮三种都可选，有哪个放哪个：
   - 看网站 `class="site"`
   - 看复盘 `class="story"`
   - 看代码 `class="code"`：只放手绘 GitHub 小猫图标，写法在清单上方的注释里。
3. 图标必须放在本仓库里，放在作品自己的目录或根目录 `art/`，不能外链。作品网站本身可以放在别处，`<a href>` 外链没问题。
4. 扭蛋机会自动多出一颗对应的扭蛋，最多 15 颗，不足的补空蛋，不用改脚本。
5. 跑 `tools/subset-fonts.sh` 和 `tools/check.sh`，本地预览看一眼，再问用户是否推送。

**改署名**：`Aria` 出现在 `<title>`、meta、og 标签、header logo、footer、脚本里的 `document.title` 和纸条的「Aria 出品」。
用 `grep -n Aria index.html` 全部找出来一起改，然后重出分享图（`tools/render-art.sh`，图上也有名字）。

**加节日主题**（万圣节、圣诞、春节……）
1. 复制 CSS 里的 `[data-theme="retro"]` 整块，改名、改颜色。扭蛋机、扭蛋、纸条的颜色全部取自这些变量。
2. 在脚本的 `SEASONS` 里按日期配上，用 `?theme=主题名` 预览。

## 首页的设计约定（用户定的，改之前先问）

- 布局：第一屏是扭蛋机，第二屏是「全部作品」。切换语言、弹出纸条时，机器和标题都不能移位。
  `.hero` 的高度由机器决定，结果区留固定高度。
- 双语：中/EN 切换，内容写成成对的 `<span lang="zh-Hans">` / `<span lang="en">`，靠 `html[data-lang]` 隐藏另一半。
  选择存在 localStorage 的 `lang` 里，标题跟着切。给 `[lang]` 元素设 `display` 的规则，特异度必须低于 (0,2,1)。
- 字体分工：
  - 大标题（logo、h1、h2、铭牌）用站酷快乐体。
  - 作品卡标题用得意黑。快乐体在小卡里太乱，所以卡片不用它。
  - 英文展示字用 Caveat。
  - 正文中英文都用系统字体。
- 链接：
  - 右上角 GitHub 用官方图标，让人一眼认出来。
  - 卡片里的看代码用手绘小猫。
  - 页脚只放「© 2026 Aria」和链到 GitHub 的 ccccjone，不放邮箱。
  - Nighty 的「看复盘」公开链到幕后页，这是用户确认过的。
- 扭蛋机：七十年代贴纸风，粗墨线、奶白贴纸描边、机身三道彩条。用户否掉过所有立体风方案。
  转动时的动画顺序：
  1. 先清空托盘里的旧扭蛋。
  2. 选中的扭蛋靠重力下沉，从罩子底部出口掉出去。
  3. 掉落时外壳图层在扭蛋之上，扭蛋被领口和机身挡住。
  4. 扭蛋落进托盘弹两下，剩下的扭蛋重新堆好。
  5. 被拿走的那颗从顶盖补回来。
- 纸条卡：模拟扭蛋里的纸条，有纸纹、折痕、锯齿撕边和印章。右上角 × 或 Esc 收起。
- 渐进增强：禁用 JS 时扭蛋机隐藏，作品清单照样完整可读。
- 分享图：扭蛋机放在正中间，因为微信等平台会把图裁成正方形，只取中间。
- 变量撞名：CSS 变量 `--body` / `--body2` 是机身颜色，字体变量叫 `--font-body`。曾经撞名导致机身透明，`check.sh` 会查这一项。

## 验证与坑

- 无头 Chrome 不跑 `requestAnimationFrame`，测扭蛋动画要先把它换成 `setTimeout`。
- 无头 Chrome 的窗口最窄约 500px，看手机宽度要把页面放进 375px 宽的 iframe 里截图。
- 涉及 CSS 层叠和覆盖的改动，用 `getComputedStyle` 读实际值来验收，别只看截图。
- push 断开时用 `git -c http.postBuffer=524288000 push`。

## 协作

- 用简体中文交流。commit 用中文 conventional 风格（feat:/fix:/docs:/chore:），一件事一个 commit。
- 有合理默认、能自己查清的小决定直接定，事后说一句；只有不可逆或明确属于用户的选择才停下来问。
- 大改动（新首页风格、新功能）先出几版设计稿给用户挑，定了再落成正式页。
- 以后可能的方向（用户喜欢、还没做）：
  - 「小镇」：作品是房子，有昼夜，未完成的作品显示脚手架。
  - 「软木板」：板上所有东西都能拖动。
