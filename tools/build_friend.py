#!/usr/bin/env python3
"""把主页信息问卷导出的 JSON 编译成一张静态友链主页。

用法：
    python tools/build_friend.py <profile.json>
    python tools/build_friend.py <profile.json> --slug 4ta
    python tools/build_friend.py <profile.json> --output friends/friend-demo.html

默认输出到 friends/friend-<名字>.html。生成结果是纯静态 HTML，
不依赖 fetch，也不需要把 JSON 放到站点目录。
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import quote

SITE_ROOT = Path(__file__).resolve().parent.parent
FRIENDS_DIR = SITE_ROOT / "friends"
PLACEHOLDER_AVATAR = "../images/placeholder.svg"
THEMES = ("colorful", "dark", "light")

LIKE_LABELS = (
    ("音乐", "music"),
    ("影视 / 动漫", "screen"),
    ("食物", "food"),
    ("人", "people"),
)


def esc(value: object) -> str:
    return html.escape("" if value is None else str(value), quote=True)


def as_text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(value)
    return ""


def as_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [as_text(item) for item in value if as_text(item)]


def as_paragraphs(value: object) -> list[str]:
    return [line.strip() for line in re.split(r"\r?\n+", as_text(value)) if line.strip()]


def multiline(value: object) -> str:
    return "<br>".join(esc(line) for line in as_paragraphs(value))


def is_valid_date(value: str) -> bool:
    match = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", value or "")
    if not match:
        return False
    try:
        date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        return True
    except ValueError:
        return False


def calc_age(birth_date: str) -> int | None:
    if not is_valid_date(birth_date):
        return None
    year, month, day = (int(part) for part in birth_date.split("-"))
    today = date.today()
    age = today.year - year - ((today.month, today.day) < (month, day))
    return age if age >= 0 else None


def zodiac_of(birth_date: str) -> str:
    if not is_valid_date(birth_date):
        return ""
    _, month, day = (int(part) for part in birth_date.split("-"))
    marker = month * 100 + day
    if marker >= 1222 or marker <= 119:
        return "摩羯座"
    if marker <= 218:
        return "水瓶座"
    if marker <= 320:
        return "双鱼座"
    if marker <= 419:
        return "白羊座"
    if marker <= 520:
        return "金牛座"
    if marker <= 621:
        return "双子座"
    if marker <= 722:
        return "巨蟹座"
    if marker <= 822:
        return "狮子座"
    if marker <= 922:
        return "处女座"
    if marker <= 1023:
        return "天秤座"
    if marker <= 1122:
        return "天蝎座"
    return "射手座"


def normalize_timeline(value: object) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    items = []
    for item in value:
        if isinstance(item, str):
            parts = re.split(r"[，,]", item, maxsplit=1)
            time_text = parts[0].strip() if len(parts) > 1 else ""
            event_text = parts[1].strip() if len(parts) > 1 else item.strip()
        elif isinstance(item, dict):
            time_text = as_text(item.get("time") or item.get("year"))
            event_text = as_text(item.get("event") or item.get("title") or item.get("description"))
        else:
            continue

        if time_text or event_text:
            items.append({"time": time_text, "event": event_text})

    return items


def normalize_projects(value: object) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    items = []
    for item in value:
        if not isinstance(item, dict):
            continue
        name = as_text(item.get("name") or item.get("title"))
        description = as_text(item.get("description") or item.get("desc"))
        link = as_text(item.get("link") or item.get("url"))
        if name or description or link:
            items.append({"name": name, "description": description, "link": link})

    return items


def normalize_profile(raw: dict) -> dict:
    contacts = raw.get("contacts") if isinstance(raw.get("contacts"), dict) else {}
    likes = raw.get("likes") if isinstance(raw.get("likes"), dict) else {}
    dislikes = raw.get("dislikes") if isinstance(raw.get("dislikes"), dict) else {}

    others = []
    if isinstance(contacts.get("others"), list):
        for item in contacts["others"]:
            if isinstance(item, str):
                platform, account = "", item.strip()
            elif isinstance(item, dict):
                platform = as_text(item.get("platform"))
                account = as_text(item.get("account"))
            else:
                continue
            if platform or account:
                others.append({"platform": platform, "account": account})

    birth_date = as_text(raw.get("birthDate"))
    age = None
    raw_age = raw.get("age")
    if isinstance(raw_age, (int, float)) and not isinstance(raw_age, bool) and raw_age >= 0:
        age = int(raw_age)
    elif isinstance(raw_age, str) and raw_age.strip().isdigit():
        age = int(raw_age.strip())
    if age is None:
        age = calc_age(birth_date)

    theme = as_text(raw.get("theme"))

    return {
        "name": as_text(raw.get("name")) or "未命名",
        "alias": as_text(raw.get("alias")),
        "gender": as_text(raw.get("gender")),
        "birthDate": birth_date,
        "age": age,
        "zodiac": as_text(raw.get("zodiac")) or zodiac_of(birth_date),
        "city": as_text(raw.get("city")),
        "school": as_text(raw.get("school")),
        "identity": as_text(raw.get("identity")),
        "height": as_text(raw.get("height")),
        "website": as_text(raw.get("website")),
        "avatar": as_text(raw.get("avatar")),
        "tagline": as_text(raw.get("tagline")),
        "about": as_text(raw.get("about")),
        "achievements": as_text(raw.get("achievements")),
        "contacts": {
            "wechat": as_text(contacts.get("wechat")),
            "qq": as_text(contacts.get("qq")),
            "phone": as_text(contacts.get("phone")),
            "email": as_text(contacts.get("email")),
            "github": as_text(contacts.get("github")),
            "facebook": as_text(contacts.get("facebook")),
            "others": others,
        },
        "personality": as_list(raw.get("personality")),
        "hobbies": as_list(raw.get("hobbies")),
        "strengths": as_text(raw.get("strengths")),
        "recent": as_text(raw.get("recent")),
        "likes": {
            "music": as_text(likes.get("music")),
            "screen": as_text(likes.get("screen")),
            "food": as_text(likes.get("food")),
            "people": as_text(likes.get("people")),
        },
        "dislikes": {
            "music": as_text(dislikes.get("music")),
            "screen": as_text(dislikes.get("screen")),
            "food": as_text(dislikes.get("food")),
            "people": as_text(dislikes.get("people")),
        },
        "message": as_text(raw.get("message")),
        "rant": as_text(raw.get("rant")),
        "quote": as_text(raw.get("quote")),
        "timeline": normalize_timeline(raw.get("timeline")),
        "projects": normalize_projects(raw.get("projects")),
        "skills": as_list(raw.get("skills")),
        "theme": theme if theme in THEMES else "colorful",
    }


def slugify(value: str) -> str:
    slug = re.sub(r"[^\w\u4e00-\u9fff-]+", "-", value, flags=re.UNICODE)
    slug = re.sub(r"-{2,}", "-", slug).strip("-_")
    if not slug:
        slug = "profile-" + hashlib.sha1(value.encode("utf-8")).hexdigest()[:8]
    return slug[:60]


def resolve_avatar(value: str) -> str:
    if not value:
        return PLACEHOLDER_AVATAR
    if value.startswith(("http://", "https://", "data:")):
        return value
    if value.startswith("../"):
        return value

    clean = value.lstrip("/")
    if (SITE_ROOT / clean).is_file():
        return "../" + clean
    return PLACEHOLDER_AVATAR


def tagline_for(profile: dict) -> str:
    if profile["tagline"]:
        return profile["tagline"]
    first = as_paragraphs(profile["about"])[0] if as_paragraphs(profile["about"]) else ""
    sentence = re.split(r"[。！？!?]", first)[0].strip()
    if sentence and len(sentence) <= 42:
        return sentence
    return profile["identity"]


def format_birthday(profile: dict) -> str:
    parts = []
    if profile["birthDate"]:
        parts.append(profile["birthDate"])
    if profile["age"] is not None:
        parts.append(f"{profile['age']} 岁")
    if profile["zodiac"]:
        parts.append(profile["zodiac"])
    return " · ".join(parts)


def contact_href(label: str, value: str) -> str | None:
    if label == "微信":
        return "weixin://"
    if label == "QQ":
        return "https://wpa.qq.com/msgrd?v=3&uin=" + quote(value, safe="") + "&site=qq&menu=yes"
    if label == "电话":
        digits = re.sub(r"[^\d+]", "", value)
        return f"tel:{digits}" if digits else None
    if label == "邮箱":
        return "mailto:" + value
    if label == "GitHub":
        return value if value.startswith(("http://", "https://")) else "https://github.com/" + quote(value, safe="")
    if label == "Facebook":
        return value if value.startswith(("http://", "https://")) else "https://facebook.com/" + quote(value, safe="")
    return None


def card(title: str, icon: str, body: str) -> str:
    if not body.strip():
        return ""
    return f"""<section class="card friend-home-card">
    <h2><i class="{icon}" aria-hidden="true"></i> {esc(title)}</h2>
    {body}
</section>"""


def render_about(profile: dict) -> str:
    body = "\n".join(f"<p>{esc(paragraph)}</p>" for paragraph in as_paragraphs(profile["about"]))
    if profile["quote"]:
        body += f'\n<p class="friend-home-quote">“{esc(profile["quote"])}”</p>'
    return card("关于我", "fas fa-user", body)


def render_achievements(profile: dict) -> str:
    body = "\n".join(f"<p>{esc(paragraph)}</p>" for paragraph in as_paragraphs(profile["achievements"]))
    if profile["recent"]:
        body += f'\n<h3 class="fg-subhead">最近在干嘛</h3>\n<p>{multiline(profile["recent"])}</p>'
    return card("成就与近况", "fas fa-trophy", body)


def render_like_list(profile: dict, key: str) -> str:
    items = []
    for label, field in LIKE_LABELS:
        value = profile[key].get(field)
        if value:
            items.append(
                f'<li class="fg-like-item"><span class="fg-like-label">{esc(label)}</span>'
                f'<p class="fg-like-text">{esc(value)}</p></li>'
            )
    if not items:
        return ""
    return '<ul class="fg-like-list">' + "".join(items) + "</ul>"


def render_likes(profile: dict) -> str:
    likes = render_like_list(profile, "likes")
    dislikes = render_like_list(profile, "dislikes")
    if not likes and not dislikes:
        return ""

    columns = []
    if likes:
        columns.append(f'<div class="fg-likes-col"><h3>喜欢</h3>{likes}</div>')
    if dislikes:
        columns.append(f'<div class="fg-likes-col"><h3>不喜欢</h3>{dislikes}</div>')

    single = " is-single" if len(columns) == 1 else ""
    body = f'<div class="fg-likes-grid{single}">' + "".join(columns) + "</div>"
    return card("喜欢与不喜欢", "fas fa-heart", body)


def render_timeline(profile: dict) -> str:
    items = []
    for item in profile["timeline"]:
        event = esc(item["event"]) if item["event"] else ""
        time_text = esc(item["time"]) if item["time"] else "记录"
        inner = f'<div class="timeline-date">{time_text}</div>'
        if event:
            inner += f"<h3>{event}</h3>"
        items.append(f'<div class="timeline-item">{inner}</div>')

    if not items:
        return ""
    body = '<div class="timeline">' + "".join(items) + "</div>"
    return card("人生时间线", "fas fa-clock-rotate-left", body)


def render_projects(profile: dict) -> str:
    items = []
    for project in profile["projects"]:
        inner = []
        if project["name"]:
            inner.append(f"<h3>{esc(project['name'])}</h3>")
        if project["description"]:
            inner.append(f"<p>{esc(project['description'])}</p>")
        if project["link"]:
            if project["link"].startswith(("http://", "https://")):
                inner.append(
                    f'<a class="fg-project-link" href="{esc(project["link"])}" target="_blank" rel="noopener">查看链接 →</a>'
                )
            else:
                inner.append(f'<span class="fg-project-link is-plain">{esc(project["link"])}</span>')
        items.append('<article class="friend-home-project">' + "".join(inner) + "</article>")

    if not items:
        return ""
    body = '<div class="friend-home-project-grid">' + "".join(items) + "</div>"
    return card("项目作品", "fas fa-layer-group", body)


def render_words(profile: dict) -> str:
    blocks = []
    if profile["message"]:
        blocks.append(f'<div><h3>想对别人说的话</h3><blockquote>{multiline(profile["message"])}</blockquote></div>')
    if profile["rant"]:
        blocks.append(f'<div><h3>想吐槽的</h3><blockquote>{multiline(profile["rant"])}</blockquote></div>')
    if not blocks:
        return ""
    body = '<div class="fg-words">' + "".join(blocks) + "</div>"
    return card("想说的话", "fas fa-comment-dots", body)


def render_basic(profile: dict) -> str:
    rows = []

    def add(label: str, value: str, inner_html: str | None = None) -> None:
        if not value and not inner_html:
            return
        rows.append(f"<li><span>{esc(label)}</span><strong>{inner_html or esc(value)}</strong></li>")

    add("姓名", profile["name"])
    add("别名", profile["alias"])
    add("性别", profile["gender"])
    add("生日", format_birthday(profile))
    add("城市", profile["city"])
    add("学校", profile["school"])
    add("身份", profile["identity"])
    add("身高", profile["height"])

    if profile["website"]:
        if profile["website"].startswith(("http://", "https://")):
            link = f'<a href="{esc(profile["website"])}" target="_blank" rel="noopener">{esc(profile["website"])}</a>'
            add("网站", profile["website"], link)
        else:
            add("网站", profile["website"])

    if not rows:
        return ""
    body = '<ul class="friend-home-info-list">' + "".join(rows) + "</ul>"
    return card("基本信息", "fas fa-id-card", body)


def render_tags(profile: dict) -> str:
    groups = []

    def add_group(label: str, values: list[str]) -> None:
        if not values:
            return
        chips = "".join(f'<span class="skill">{esc(value)}</span>' for value in values)
        groups.append(
            f'<div class="fg-tag-group"><strong>{esc(label)}</strong>'
            f'<div class="skills-container">{chips}</div></div>'
        )

    add_group("性格", profile["personality"])
    add_group("爱好", profile["hobbies"])
    add_group("技能", profile["skills"])

    body = "".join(groups)
    if profile["strengths"]:
        body += f'<p class="fg-strengths">{esc(profile["strengths"])}</p>'

    return card("性格 · 爱好 · 技能", "fas fa-tags", body)


def render_contacts(profile: dict) -> str:
    contacts = profile["contacts"]
    items = []

    def add(label: str, value: str, icon: str) -> None:
        if not value:
            return
        href = contact_href(label, value)
        inner = (
            f'<span class="friend-home-contact-icon"><i class="{icon}" aria-hidden="true"></i></span>'
            f'<span class="friend-home-contact-text"><small>{esc(label)}</small><strong>{esc(value)}</strong></span>'
        )
        if href:
            items.append(
                f'<li><a href="{esc(href)}" aria-label="{esc(label)} {esc(value)}" '
                f'title="{esc(label)}：{esc(value)}">{inner}</a></li>'
            )
        else:
            items.append(f'<li><div class="fg-contact-static">{inner}</div></li>')

    add("微信", contacts["wechat"], "fab fa-weixin")
    add("QQ", contacts["qq"], "fab fa-qq")
    add("电话", contacts["phone"], "fas fa-phone")
    add("邮箱", contacts["email"], "fas fa-envelope")
    add("GitHub", contacts["github"], "fab fa-github")
    add("Facebook", contacts["facebook"], "fab fa-facebook")

    for item in contacts["others"]:
        add(item["platform"] or "其他", item["account"], "fas fa-link")

    if not items:
        return ""
    body = '<ul class="friend-home-contact-list">' + "".join(items) + "</ul>"
    return card("联系方式", "fas fa-paper-plane", body)


def render_meta(profile: dict) -> str:
    items = []
    if profile["city"]:
        items.append(("fas fa-location-dot", profile["city"]))
    if profile["age"] is not None:
        items.append(("fas fa-cake-candles", f"{profile['age']} 岁"))
    if profile["identity"]:
        items.append(("fas fa-id-badge", profile["identity"]))
    if profile["school"]:
        items.append(("fas fa-school", profile["school"]))

    return "".join(
        f'<span><i class="{icon}" aria-hidden="true"></i> {esc(text)}</span>'
        for icon, text in items
    )


def build_page(profile: dict, source_name: str) -> str:
    name = profile["name"]
    avatar = resolve_avatar(profile["avatar"])
    kicker = f"{profile['alias']} · PROFILE" if profile["alias"] else "PERSONAL PROFILE"
    tagline = tagline_for(profile)

    main_sections = "\n".join(
        section for section in (
            render_about(profile),
            render_achievements(profile),
            render_likes(profile),
            render_timeline(profile),
            render_projects(profile),
            render_words(profile),
        ) if section
    )
    side_sections = "\n".join(
        section for section in (
            render_basic(profile),
            render_tags(profile),
            render_contacts(profile),
        ) if section
    )

    meta_html = render_meta(profile)
    meta_block = f'<div class="friend-home-meta">{meta_html}</div>' if meta_html else ""
    source_name = esc(source_name)
    generated_at = date.today().isoformat()

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{esc(name)}的个人主页，由主页信息问卷生成。">
    <title>{esc(name)} · 个人主页</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../style.css">
    <link rel="stylesheet" href="../css/friends.css">
    <link rel="stylesheet" href="../css/friend-generated.css">
</head>
<body class="friend-home friend-home--xinghe theme-{profile['theme']}" data-friend-theme-key="friend-page-theme">
    <script src="../js/friend-theme.js"></script>

    <header class="friend-home-header">
        <a class="friend-home-back" href="../friends.html" aria-label="返回友链列表">
            <i class="fas fa-arrow-left" aria-hidden="true"></i>
            <span>返回友链</span>
        </a>
        <button type="button" class="friend-home-theme" id="friendThemeToggle"
                data-friend-theme-toggle title="切换主题" aria-label="切换主题">🌈</button>
    </header>

    <main class="friend-home-main">
        <section class="friend-home-hero">
            <div class="container">
                <div class="friend-home-profile">
                    <img class="friend-home-avatar" src="{esc(avatar)}" alt="{esc(name)}的头像"
                         width="150" height="150">
                    <div class="friend-home-title">
                        <p class="friend-home-kicker">{esc(kicker)}</p>
                        <h1>这里是<span>{esc(name)}</span>的个人主页</h1>
                        <p class="friend-home-tagline">{esc(tagline)}</p>
                        {meta_block}
                    </div>
                </div>
            </div>
        </section>

        <div class="container friend-home-content">
            <div class="friend-home-grid">
                <div class="friend-home-main-col">
{main_sections}
                </div>

                <aside class="friend-home-side">
{side_sections}
                </aside>
            </div>

            <p class="friend-home-note">
                由 <code>tools/build_friend.py</code> 根据 <code>{source_name}</code> 生成于 {generated_at}。
                内容来自问卷导出；联系方式公开前请先确认。
            </p>
        </div>
    </main>
</body>
</html>
"""


def load_profile(path: Path) -> tuple[dict, str]:
    try:
        raw_text = path.read_text(encoding="utf-8-sig")
    except OSError as error:
        raise SystemExit(f"读取 JSON 失败：{error}") from error

    try:
        payload = json.loads(raw_text)
    except json.JSONDecodeError as error:
        raise SystemExit(f"JSON 解析失败：{error}") from error

    if not isinstance(payload, dict):
        raise SystemExit("JSON 顶层必须是一个对象")

    raw_profile = payload.get("profile", payload)
    if not isinstance(raw_profile, dict):
        raise SystemExit("没有找到有效的 profile 对象")

    if payload.get("schema") and payload.get("schema") != "wza-homepage-profile":
        print(f"警告：schema 是 {payload.get('schema')!r}，不是 wza-homepage-profile。", file=sys.stderr)
    if payload.get("version") not in (None, 2):
        print(f"警告：version 是 {payload.get('version')!r}，脚本按 version 2 处理。", file=sys.stderr)

    return normalize_profile(raw_profile), path.name


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="把主页信息问卷 JSON 编译成静态友链主页。")
    parser.add_argument("json_file", type=Path, help="问卷导出的 JSON 文件")
    parser.add_argument("--slug", help="输出文件名后缀，默认从名字生成")
    parser.add_argument("--output", type=Path, help="完整输出路径；默认 friends/friend-<slug>.html")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的输出文件")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    profile, source_name = load_profile(args.json_file)

    slug = slugify(args.slug or profile["name"])
    output = args.output or (FRIENDS_DIR / f"friend-{slug}.html")

    if output.exists() and not args.force:
        raise SystemExit(f"输出文件已存在：{output}（加 --force 覆盖）")

    output.parent.mkdir(parents=True, exist_ok=True)
    page = build_page(profile, source_name)

    with output.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(page)

    try:
        shown = output.resolve().relative_to(SITE_ROOT)
    except ValueError:
        shown = output

    print(f"已生成：{shown}")
    print(f"姓名：{profile['name']} · 主题：{profile['theme']} · 项目 {len(profile['projects'])} 个 · 时间线 {len(profile['timeline'])} 条")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
