#!/usr/bin/env python3
"""把字符画转成 box-shadow 像素画 CSS。# = amber, o = dim, . = 空。像素 8px。

用法：python3 tools/pxgen.py > bedtime-games/pxart.css
以后加新游戏：在 scenes 里加一幅 13×10 字符画，重新生成即可。
"""
PX = 8

scenes = {
    "snake": [
        ".............",
        ".#########...",
        ".........#...",
        ".........#...",
        "....######...",
        "....#........",
        "....#..oo....",
        "....#..oo....",
        ".............",
        ".............",
    ],
    "blocks": [
        ".............",
        "....##.......",
        "....##.......",
        ".............",
        ".............",
        ".............",
        "oo.oo....oooo",
        "ooooo.ooo.ooo",
        "ooooooooo.ooo",
        "ooooooooooooo",
    ],
    "sokoban": [
        "ooooooooooooo",
        "o...........o",
        "o..oo.......o",
        "o...........o",
        "o..#..##....o",
        "o..#..##..o.o",
        "o...........o",
        "o......oo...o",
        "o...........o",
        "ooooooooooooo",
    ],
    "maze": [
        "ooooooooooooo",
        "o.....o.....o",
        "o.ooo.o.ooo.o",
        "o.o...o...o.o",
        "o.o.ooo.o.o.o",
        "o.....#.o...o",
        "ooooo.o.ooo.o",
        "o.....o.....o",
        "o.ooooooooo.o",
        "ooooooooo.ooo",
    ],
}

print("/* 由 tools/pxgen.py 生成 — 勿手改；改字符画后重新生成 */\n")
for name, rows in scenes.items():
    amber, dim = [], []
    for r, row in enumerate(rows):
        for c, ch in enumerate(row):
            off = f"{c*PX}px {r*PX}px"
            if ch == "#":
                amber.append(off)
            elif ch == "o":
                dim.append(off)
    parts = [f"{o} 0 0 var(--amber)" for o in amber] + \
            [f"{o} 0 0 var(--dim)" for o in dim]
    body = ",\n    ".join(parts)
    print(f".px-{name} {{\n  box-shadow:\n    {body};\n}}\n")
