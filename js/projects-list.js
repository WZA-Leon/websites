// ========================================
// 项目手动列表
// 每新增一个项目：添加 project-data/<id>/README.md 与 index.json，
// 然后在这里补充一条记录。
// ========================================
window.PROJECTS_LIST = [
    {
        id: "work1",
        name: "智能笔记助手",
        description: "基于 Markdown 文档和 JSON 配置自动展示项目简介，适合快速整理学习笔记与项目链接。",
        category: "工具",
        date: "2026-04-10",
        technologies: ["JavaScript", "JSON", "Markdown"],
        link: "https://example.com",
        markdown: "README.md"
    },
    {
        id: "work2",
        name: "WZA 创想日志",
        description: "一个持续生长的个人网站：博客、项目、摄影、云盘分享和若干小实验都收在这里。",
        category: "网站",
        date: "2026-10-15",
        technologies: ["HTML", "CSS", "JavaScript"],
        link: "https://wza-leon.top",
        markdown: "README.md"
    },
    {
        id: "work3",
        name: "ZADM 随机点名",
        description: "基于 Python Tkinter 的图形化随机点名工具，支持滚动抽选、名单管理和 JSON 配置。",
        category: "工具",
        date: "2026-06-06",
        technologies: ["Python", "Tkinter", "JSON"],
        link: "",
        markdown: "README.md"
    }
];
