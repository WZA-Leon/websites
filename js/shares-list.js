// ========================================
// 云盘分享数据
// 编辑方式：复制下面任意一个模板，去掉每行开头的 //，填好后保存。
//
// 字段说明：
// title / description  标题和一句说明
// category             分类，例如：软件工具、游戏与整合包、学习资料、素材、电子书
// type                 资源类型，例如：软件、整合包、模板、课程、素材
// source               原创 / 转载（不填时有 credit 或 sourceUrl 会自动视为转载）
// credit               转载来源名称
// sourceUrl            转载来源链接
// platform             平台：baidu / aliyun / quark / pan123 / lanzou / onedrive / gdrive / mega / other
// version              版本号或年份，例如：v1.2 / 2026 版
// date / updated       发布 / 最近更新日期（YYYY-MM-DD）
// url / code           网盘链接与提取码
// size                 文件大小，例如：1.2 GB
// files                文件清单，例如：["文件一.zip", "说明.txt"]
// tags                 标签
// note                 解压密码、安装说明等补充信息
// status               active（可用）/ expired（已失效）/ planned（整理中）
//
// 转载或整合他人资源时，请确认授权并标注来源；不确定版权的内容不要公开分享。
// ========================================
window.SHARES_LIST = [
    // 模板一：原创分享
    // {
    //     id: "my-tool-pack",
    //     title: "我整理的工具包",
    //     description: "里面有什么、适合谁用、包含哪些版本。",
    //     category: "软件工具",
    //     type: "软件",
    //     source: "原创",
    //     platform: "baidu",
    //     version: "v1.0",
    //     date: "2026-10-25",
    //     updated: "2026-10-25",
    //     size: "1.2 GB",
    //     url: "https://pan.baidu.com/s/替换成你的分享ID",
    //     code: "abcd",
    //     note: "解压密码：wza",
    //     files: ["文件一.zip", "说明.txt"],
    //     tags: ["工具", "Windows"],
    //     status: "active"
    // },

    // 模板二：转载分享
    // {
    //     id: "repost-example",
    //     title: "转载的资源",
    //     description: "转载时写清楚来源、版本和文件内容。",
    //     category: "游戏与整合包",
    //     type: "整合包",
    //     source: "转载",
    //     credit: "来源作者 / 频道名称",
    //     sourceUrl: "https://example.com/source",
    //     platform: "quark",
    //     version: "2026 版",
    //     date: "2026-10-24",
    //     updated: "2026-10-25",
    //     size: "8.4 GB",
    //     url: "https://pan.quark.cn/s/替换成分享ID",
    //     code: "wza1",
    //     files: ["整合包.zip", "安装说明.pdf"],
    //     tags: ["整合包", "游戏"],
    //     status: "active"
    // }
];
