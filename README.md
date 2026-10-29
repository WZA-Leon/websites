# WZA-Leon 的个人网站

> 一个高中生的数字创作基地：用影像定格瞬间，用代码构建逻辑，用游戏创造故事。
> 这个markdown是DeepSeek写的，就是，很糊弄，凑付看吧

**网站地址：** [wza-leon.top](https://wza-leon.top)

---

## 关于我

我是 **WZA**，英文名 **Leon**。

我是一名高中学生，同时也是一名痴迷于编程与摄影的10后。我喜欢用镜头捕捉决定性瞬间，用代码实现想法，也偶尔研究地理和游戏。[reference:0]

这个小网站是我自己搭建的数字实验室，用来分享作品、感悟与想法，也希望能和更多志同道合的同学成为朋友。[reference:1]

## 兴趣领域

我的创作与学习主要围绕以下方向展开：

- **文学**：小说、诗歌、创作手记
- **数理化**：理科热爱者的解题与探索
- **艺术**：音乐、绘画、设计
- **计算机**：Web 开发、小工具、算法
- **摄影**：记录美好瞬间，分享视觉故事
- **游戏**：游戏杂谈与独立游戏推荐

## 代表项目

### Picchooser：基于 EXIF 的照片自动整理工具

一个用 Python 实现的轻量工具，能根据照片的拍摄时间自动将图片归类为 **连拍**、**孤立照片** 和 **无拍摄信息** 三类，方便快速清理和归档。[reference:8]

- 核心功能：批量扫描、EXIF 时间解析、连拍识别、孤立照片识别、配置驱动
- 技术栈：纯 Python 实现，依赖 `exifread`，使用 `uv` 管理依赖，支持 PyInstaller 打包
- 源码仓库：[github.com/WZA-Leon/Picchooser](https://github.com/WZA-Leon/Picchooser)

## 技术说明

- **前端**：HTML / CSS / JavaScript（站点为静态页面结构）
- **项目工具**：Python（`uv` 管理依赖，`PyInstaller` 打包）
- **源码仓库**：GitHub 上的 `WZA-Leon` 账号下可见 `Picchooser` 等项目

## 内容维护

站点没有后端，所有内容都通过静态文件维护：

- **博客文章**：正文放在 `blog-data/<id>.md`，列表信息写在 `js/blog-list.js`。
- **云盘分享**：在 `js/shares-list.js` 的 `SHARES_LIST` 中添加条目，支持百度网盘、阿里云盘、夸克、123 云盘、蓝奏云、OneDrive、Google Drive 等平台。列表为空时页面会显示“整理中”的空状态，添加第一条后筛选栏与统计会自动出现。
- **项目文档**：`project-data/<id>/README.md` 与 `js/projects-list.js`。
- **摄影作品**：`images/photograph/` 下的 `index.json` 决定分类与作品，图片文件与对应索引放在同一目录。
- **主页信息问卷**：`inquiry.html` 收集做个人主页所需的完整资料（简介、成就、联系方式、喜好、时间线、项目作品等），支持本机草稿、JSON 预览、复制与下载；必填项全部完成后才允许导出。入口在 `friends.html` 底部，导出结构见 `js/inquiry.js` 的 `buildProfile()`。

云盘分享的常用字段：

| 字段 | 说明 |
| --- | --- |
| `title` / `description` | 分享标题和一句说明 |
| `platform` | `baidu`、`aliyun`、`quark`、`pan123`、`lanzou`、`onedrive`、`gdrive`、`mega`、`other` |
| `category` | 分类，例如“学习资料”“软件工具”“游戏与整合包” |
| `type` | 资源类型，例如“软件”“整合包”“模板”“课程”“素材” |
| `source` | `原创` 或 `转载`；转载时填写 `credit` / `sourceUrl` 标注来源 |
| `url` / `code` | 网盘链接与提取码 |
| `version` / `size` / `updated` | 版本号、文件大小与最近更新日期 |
| `files` / `tags` | 文件清单与标签 |
| `note` | 解压密码等补充说明 |
| `status` | `active`（可用）、`expired`（已失效）、`planned`（整理中） |

转载或整合他人资源时，请确认授权并标注来源；不确定版权的内容不要公开分享。

### 摄影作品的数据结构

每个目录一层 `index.json`，新增作品不需要改 JavaScript：

```text
images/photograph/
├── index.json                  # { "categories": ["landscape", "street"] }
└── landscape/
    ├── index.json              # 分类名、简介、封面与作品列表
    ├── cover.jpg               # 分类封面（可选）
    └── work1/
        ├── index.json          # 作品标题、简介、日期与图片列表
        └── DSC_0001.JPG
```

分类索引示例：

```json
{
  "name": "城市风景",
  "description": "城市与海岸线的光影记录。",
  "cover": "cover.jpg",
  "works": ["work1"]
}
```

作品索引示例：

```json
{
  "title": "晨曦海岸",
  "description": "一次早晨的海边拍摄，长曝光。",
  "date": "2026-06-01",
  "cover": "DSC_0001.JPG",
  "images": [
    { "filename": "DSC_0001.JPG", "caption": "主图" },
    { "filename": "DSC_0002.JPG", "caption": "细节" }
  ]
}
```

- `cover` 可省略：会自动取 `images` 的第一张，再退回分类封面；都没有时显示占位图与“图片待补充”。
- `images` 支持 `{ "filename": "...", "caption": "..." }` 或直接写文件名。
- 图片文件缺失不会中断页面，卡片会回退到占位图；查看器支持左右方向键切换、Esc 关闭。

## 免责声明

本站内容除特别注明外，均为个人学习与创作记录，不代表任何机构立场。

---

感谢访问 **wza-leon.top**。
