#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WZA-Leon 博客生成器
识别 Markdown 文件，支持嵌入图片/视频，生成与现有网站风格统一的 HTML 博客页面。
"""

import os
import re
import json
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from datetime import datetime
import shutil

# ========================================
# 配置
# ========================================
CATEGORIES = ["编程", "摄影", "文学", "游戏", "生活", "科技", "教程"]

POST_TEMPLATE = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - WZA-Leon 博客</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../../style.css">
    <link rel="stylesheet" href="../../css/blog.css">
    <style>
        .blog-post-body {{ max-width: 800px; margin: 120px auto 60px; padding: 0 20px; }}
        .blog-post-body .post-header {{ text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid var(--border-light); }}
        .blog-post-body .post-header h1 {{ font-size: 2.5rem; margin-bottom: 15px; color: var(--text-primary); }}
        .blog-post-body .post-header .post-meta {{ color: var(--text-secondary); font-size: 0.95rem; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; }}
        .blog-post-body .post-header .post-meta span {{ display: flex; align-items: center; gap: 8px; }}
        .blog-post-body .post-header .category-tag {{ background: var(--primary-color); color: var(--bg-primary); padding: 4px 14px; border-radius: 15px; font-size: 0.85rem; font-weight: 600; }}
        .blog-post-body .post-content {{ color: var(--text-primary); line-height: 1.8; font-size: 1.05rem; }}
        .blog-post-body .post-content h2 {{ font-size: 1.8rem; margin: 35px 0 15px; color: var(--text-primary); border-bottom: 2px solid var(--border-light); padding-bottom: 10px; }}
        .blog-post-body .post-content h3 {{ font-size: 1.4rem; margin: 25px 0 12px; color: var(--text-primary); }}
        .blog-post-body .post-content p {{ margin-bottom: 16px; color: var(--text-secondary); }}
        .blog-post-body .post-content ul, .blog-post-body .post-content ol {{ margin: 15px 0; padding-left: 30px; color: var(--text-secondary); }}
        .blog-post-body .post-content li {{ margin-bottom: 8px; }}
        .blog-post-body .post-content blockquote {{ border-left: 4px solid var(--primary-color); padding-left: 20px; margin: 20px 0; color: var(--text-secondary); font-style: italic; }}
        .blog-post-body .post-content code {{ background: rgba(0,212,255,0.1); color: var(--primary-color); padding: 2px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 0.95em; }}
        .blog-post-body .post-content pre {{ background: var(--card-bg); border: 1px solid var(--border-light); border-radius: 8px; padding: 18px; overflow-x: auto; margin: 20px 0; }}
        .blog-post-body .post-content pre code {{ background: none; color: var(--text-secondary); padding: 0; }}
        .blog-post-body .post-content hr {{ border: none; border-top: 2px solid var(--border-light); margin: 35px 0; }}
        .blog-post-body .post-content img {{ max-width: 100%; border-radius: 12px; margin: 20px 0; }}
        .blog-post-body .post-content .resource-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }}
        .blog-post-body .post-content .resource-grid img {{ width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin: 0; }}
        .blog-post-body .post-content video {{ max-width: 100%; border-radius: 12px; margin: 20px 0; }}
        .blog-post-body .post-footer {{ margin-top: 40px; padding-top: 25px; border-top: 2px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }}
        .blog-post-body .post-footer .back-link {{ color: var(--primary-color); text-decoration: none; display: flex; align-items: center; gap: 8px; font-weight: 600; transition: var(--transition); }}
        .blog-post-body .post-footer .back-link:hover {{ transform: translateX(-5px); }}
        .blog-post-body .post-footer .tags {{ display: flex; gap: 8px; flex-wrap: wrap; }}
        .blog-post-body .post-footer .tags .tag {{ background: rgba(0,212,255,0.1); color: var(--primary-color); padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; border: 1px solid rgba(0,212,255,0.2); }}
        body.theme-colorful .blog-post-body .post-header h1 {{ background: linear-gradient(90deg, #ff6b6b, #ffd166, #06d6a0); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }}
        @media (max-width: 768px) {{ .blog-post-body .post-header h1 {{ font-size: 1.8rem; }} .blog-post-body {{ margin-top: 100px; }} }}
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>

    <div class="blog-post-body">
        <div class="post-header">
            <h1>{title}</h1>
            <div class="post-meta">
                <span><i class="fas fa-calendar"></i> {date}</span>
                <span><i class="fas fa-folder"></i> <span class="category-tag">{category}</span></span>
                <span><i class="fas fa-clock"></i> 阅读约 {read_time} 分钟</span>
            </div>
        </div>

        <div class="post-content">
{content}
        </div>

        <div class="post-footer">
            <a href="../../blog.html" class="back-link"><i class="fas fa-arrow-left"></i> 返回博客列表</a>
            <div class="tags">
                {tags_html}
            </div>
        </div>
    </div>

    <div id="footer-placeholder"></div>
    <script src="../../script.js"></script>
</body>
</html>
'''


class BlogGeneratorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("WZA-Leon 博客生成器")
        self.root.geometry("900x700")
        self.root.minsize(700, 600)

        # 设置样式
        style = ttk.Style()
        style.theme_use('clam')

        self.resource_files = []  # 存储资源文件路径列表

        self._build_ui()

    def _build_ui(self):
        # ========== 主框架 ==========
        main_frame = ttk.Frame(self.root, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 标题
        title_label = tk.Label(main_frame, text="📝 WZA-Leon 博客生成器",
                               font=("Microsoft YaHei", 16, "bold"))
        title_label.pack(pady=(0, 20))

        # ========== 基本信息区域 ==========
        info_frame = ttk.LabelFrame(main_frame, text=" 基本信息 ", padding=15)
        info_frame.pack(fill=tk.X, pady=(0, 10))

        # 标题
        ttk.Label(info_frame, text="文章标题：").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.title_entry = ttk.Entry(info_frame, width=50)
        self.title_entry.grid(row=0, column=1, sticky=tk.W, padx=10, pady=5)

        # 分类
        ttk.Label(info_frame, text="分类：").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.category_var = tk.StringVar(value="编程")
        category_combo = ttk.Combobox(info_frame, textvariable=self.category_var,
                                      values=CATEGORIES, state="readonly", width=20)
        category_combo.grid(row=1, column=1, sticky=tk.W, padx=10, pady=5)

        # 标签
        ttk.Label(info_frame, text="标签（逗号分隔）：").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.tags_entry = ttk.Entry(info_frame, width=50)
        self.tags_entry.grid(row=2, column=1, sticky=tk.W, padx=10, pady=5)
        ttk.Label(info_frame, text="例如：Web开发, HTML, CSS",
                  foreground="gray", font=("", 9)).grid(row=2, column=2, sticky=tk.W, padx=5, pady=5)

        # ========== Markdown 内容区域 ==========
        md_frame = ttk.LabelFrame(main_frame, text=" Markdown 内容 ", padding=15)
        md_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # 工具栏
        tool_frame = ttk.Frame(md_frame)
        tool_frame.pack(fill=tk.X, pady=(0, 10))

        self.import_md_btn = ttk.Button(tool_frame, text="📂 导入 Markdown 文件",
                                        command=self.import_markdown)
        self.import_md_btn.pack(side=tk.LEFT, padx=(0, 10))

        self.add_img_btn = ttk.Button(tool_frame, text="🖼️ 添加图片资源",
                                      command=self.add_image_resource)
        self.add_img_btn.pack(side=tk.LEFT, padx=(0, 10))

        self.add_video_btn = ttk.Button(tool_frame, text="🎬 添加视频资源",
                                        command=self.add_video_resource)
        self.add_video_btn.pack(side=tk.LEFT, padx=(0, 10))

        self.clear_res_btn = ttk.Button(tool_frame, text="🗑️ 清空资源列表",
                                        command=self.clear_resources)
        self.clear_res_btn.pack(side=tk.LEFT, padx=(0, 10))

        # 资源列表
        self.res_list_label = ttk.Label(tool_frame, text="资源: 0个",
                                        foreground="gray")
        self.res_list_label.pack(side=tk.RIGHT, padx=5)

        # Markdown 编辑框
        self.md_text = scrolledtext.ScrolledText(md_frame, wrap=tk.WORD,
                                                  font=("Consolas", 11),
                                                  height=12,
                                                  undo=True)
        self.md_text.pack(fill=tk.BOTH, expand=True)

        # 预览帮助说明
        help_frame = ttk.Frame(md_frame)
        help_frame.pack(fill=tk.X, pady=(5, 0))
        help_text = "支持 Markdown 语法：标题(#)、列表(-/*)、引用(>)、代码(```)、粗体(**)、斜体(*)等。\n图片会自动嵌入到文章中，视频会生成 video 标签。使用 <!--more--> 可设置摘要截断点。"
        ttk.Label(help_frame, text=help_text, foreground="gray",
                  font=("", 9), wraplength=800).pack(anchor=tk.W)

        # ========== 输出设置区域 ==========
        output_frame = ttk.LabelFrame(main_frame, text=" 输出设置 ", padding=15)
        output_frame.pack(fill=tk.X, pady=(0, 15))

        # 输出目录
        ttk.Label(output_frame, text="输出目录（website 的 blog-data 下）：").grid(
            row=0, column=0, sticky=tk.W, pady=5)
        self.output_dir_var = tk.StringVar(value=os.path.join(os.getcwd(), "blog-data"))
        self.output_entry = ttk.Entry(output_frame, textvariable=self.output_dir_var, width=60)
        self.output_entry.grid(row=0, column=1, sticky=tk.W, padx=10, pady=5)
        ttk.Button(output_frame, text="选择目录", command=self.select_output_dir).grid(
            row=0, column=2, padx=5, pady=5)

        # 高级选项
        self.auto_register_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(output_frame, text="自动注册到 blog-list.js",
                        variable=self.auto_register_var).grid(row=1, column=0, columnspan=3,
                                                              sticky=tk.W, pady=5)

        # ========== 生成按钮 ==========
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill=tk.X)

        self.generate_btn = ttk.Button(btn_frame, text="🚀 生成博客 HTML",
                                       command=self.generate_blog,
                                       style="Accent.TButton")
        self.generate_btn.pack(side=tk.RIGHT, padx=(10, 0))

        self.preview_btn = ttk.Button(btn_frame, text="👁️ 预览生成效果",
                                      command=self.preview_html)
        self.preview_btn.pack(side=tk.RIGHT)

        # 状态栏
        self.status_var = tk.StringVar(value="就绪")
        status_bar = ttk.Label(self.root, textvariable=self.status_var,
                               relief=tk.SUNKEN, anchor=tk.W, padding=(10, 5))
        status_bar.pack(fill=tk.X, side=tk.BOTTOM)

    def import_markdown(self):
        """导入 Markdown 文件"""
        filepath = filedialog.askopenfilename(
            title="选择 Markdown 文件",
            filetypes=[("Markdown 文件", "*.md *.markdown"), ("所有文件", "*.*")]
        )
        if not filepath:
            return

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self.md_text.delete("1.0", tk.END)
            self.md_text.insert("1.0", content)
            self.status_var.set(f"已导入: {os.path.basename(filepath)}")

            # 尝试从文件名提取标题
            basename = os.path.splitext(os.path.basename(filepath))[0]
            # 将文件名中的连字符、下划线替换为空格
            suggested_title = basename.replace("-", " ").replace("_", " ").title()
            if not self.title_entry.get():
                self.title_entry.insert(0, suggested_title)
        except Exception as e:
            messagebox.showerror("导入失败", f"无法读取文件：\n{str(e)}")

    def add_image_resource(self):
        """添加图片资源"""
        files = filedialog.askopenfilenames(
            title="选择图片文件",
            filetypes=[
                ("图片文件", "*.png *.jpg *.jpeg *.gif *.bmp *.webp *.svg"),
                ("所有文件", "*.*")
            ]
        )
        if not files:
            return
        self.resource_files.extend(files)
        self._update_resource_label()

        # 在 Markdown 末尾插入图片引用提示
        names = [os.path.basename(f) for f in files]
        self.status_var.set(f"已添加 {len(files)} 个图片资源")

    def add_video_resource(self):
        """添加视频资源"""
        files = filedialog.askopenfilenames(
            title="选择视频文件",
            filetypes=[
                ("视频文件", "*.mp4 *.webm *.avi *.mov *.mkv *.flv"),
                ("所有文件", "*.*")
            ]
        )
        if not files:
            return
        self.resource_files.extend(files)
        self._update_resource_label()
        self.status_var.set(f"已添加 {len(files)} 个视频资源")

    def clear_resources(self):
        """清空资源列表"""
        if self.resource_files and messagebox.askyesno("确认", "确定要清空所有资源吗？"):
            self.resource_files = []
            self._update_resource_label()
            self.status_var.set("资源列表已清空")

    def _update_resource_label(self):
        """更新资源计数标签"""
        self.res_list_label.config(text=f"资源: {len(self.resource_files)}个")

    def select_output_dir(self):
        """选择输出目录"""
        dirpath = filedialog.askdirectory(
            title="选择输出目录（将在其中创建博客文件夹）",
            initialdir=self.output_dir_var.get()
        )
        if dirpath:
            self.output_dir_var.set(dirpath)

    def _parse_markdown(self, md_text):
        """将 Markdown 转换为 HTML"""
        if not md_text.strip():
            return "", ""

        excerpt = ""
        lines = md_text.split("\n")
        html_lines = []
        in_code_block = False
        code_lang = ""
        code_content = []
        in_list = None  # 'ul' or 'ol'
        list_items = []

        def flush_list():
            nonlocal in_list, list_items
            if not list_items:
                return
            tag = in_list if in_list else "ul"
            html_lines.append(f"<{tag}>")
            for item in list_items:
                html_lines.append(f"<li>{item}</li>")
            html_lines.append(f"</{tag}>")
            list_items = []
            in_list = None

        for i, line in enumerate(lines):
            # 代码块处理
            if line.startswith("```"):
                if in_code_block:
                    html_lines.append(f"<pre><code>{''.join(code_content)}</code></pre>")
                    code_content = []
                    in_code_block = False
                else:
                    flush_list()
                    in_code_block = True
                    code_lang = line[3:].strip()
                continue

            if in_code_block:
                code_content.append(line + "\n")
                continue

            # 空行
            if not line.strip():
                flush_list()
                html_lines.append("")
                continue

            # 截断标记
            if line.strip() == "<!--more-->" and not excerpt:
                excerpt = "\n".join(html_lines)
                continue

            # 标题
            heading_match = re.match(r"^(#{1,6})\s+(.+)$", line)
            if heading_match:
                flush_list()
                level = len(heading_match.group(1))
                text = self._inline_markdown(heading_match.group(2))
                html_lines.append(f"<h{level}>{text}</h{level}>")
                continue

            # 水平线
            if re.match(r"^[-*_]{3,}\s*$", line.strip()):
                flush_list()
                html_lines.append("<hr>")
                continue

            # 引用
            if line.startswith(">"):
                flush_list()
                quote_text = self._inline_markdown(line.lstrip("> ").strip())
                html_lines.append(f"<blockquote>{quote_text}</blockquote>")
                continue

            # 无序列表
            ul_match = re.match(r"^[\s]*[-*+]\s+(.+)$", line)
            if ul_match:
                if in_list != "ul":
                    flush_list()
                    in_list = "ul"
                list_items.append(self._inline_markdown(ul_match.group(1)))
                continue

            # 有序列表
            ol_match = re.match(r"^\s*\d+[.)]\s+(.+)$", line)
            if ol_match:
                if in_list != "ol":
                    flush_list()
                    in_list = "ol"
                list_items.append(self._inline_markdown(ol_match.group(1)))
                continue

            # 普通段落
            flush_list()
            text = self._inline_markdown(line)
            if text.strip():
                html_lines.append(f"<p>{text}</p>")

        flush_list()
        if in_code_block:
            html_lines.append(f"<pre><code>{''.join(code_content)}</code></pre>")

        content = "\n".join(html_lines)
        return content, excerpt

    def _inline_markdown(self, text):
        """处理行内 Markdown 语法"""
        # 图片 ![alt](url)
        text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)',
                      r'<img src="\2" alt="\1">', text)
        # 链接 [text](url)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)',
                      r'<a href="\2">\1</a>', text)
        # 加粗 **text**
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        # 斜体 *text*
        text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', text)
        # 行内代码 `code`
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        # 删除线 ~~text~~
        text = re.sub(r'~~([^~]+)~~', r'<del>\1</del>', text)
        return text

    def _process_resources(self, blog_id, output_dir):
        """处理资源文件，复制到对应目录并生成资源引用 HTML"""
        if not self.resource_files:
            return "", []

        resource_dir = os.path.join(output_dir, blog_id, "resource")
        os.makedirs(resource_dir, exist_ok=True)

        resource_html_parts = []
        resource_entries = []
        image_exts = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'}
        video_exts = {'.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv'}

        images = []
        videos = []

        for filepath in self.resource_files:
            if not os.path.isfile(filepath):
                continue
            ext = os.path.splitext(filepath)[1].lower()
            filename = os.path.basename(filepath)
            dest_path = os.path.join(resource_dir, filename)

            try:
                shutil.copy2(filepath, dest_path)
            except Exception as e:
                print(f"复制资源失败 {filepath}: {e}")
                continue

            rel_path = f"./resource/{filename}"

            if ext in image_exts:
                images.append(rel_path)
            elif ext in video_exts:
                videos.append(rel_path)

            resource_entries.append({
                "filename": filename,
                "type": "image" if ext in image_exts else "video",
                "path": rel_path
            })

        # 生成资源展示区 HTML
        if images:
            resource_html_parts.append('<div class="resource-grid">')
            for img_path in images:
                resource_html_parts.append(f'<img src="{img_path}" alt="配图">')
            resource_html_parts.append('</div>')

        if videos:
            for vid_path in videos:
                resource_html_parts.append(
                    f'<div style="margin: 15px 0;"><video controls><source src="{vid_path}" type="video/mp4">您的浏览器不支持视频播放</video></div>'
                )

        return "\n".join(resource_html_parts), resource_entries

    def generate_blog(self):
        """生成博客 HTML 文件"""
        # 验证输入
        title = self.title_entry.get().strip()
        if not title:
            messagebox.showwarning("缺少标题", "请输入文章标题")
            return

        md_content = self.md_text.get("1.0", tk.END).strip()
        if not md_content:
            messagebox.showwarning("缺少内容", "请录入 Markdown 内容")
            return

        category = self.category_var.get()
        tags_text = self.tags_entry.get().strip()
        tags = [t.strip() for t in tags_text.split(",") if t.strip()]

        output_base = self.output_dir_var.get().strip()
        if not output_base:
            messagebox.showwarning("缺少目录", "请选择输出目录")
            return

        # 生成博客 ID（使用标题拼音转英文+连字符）
        blog_id = self._slugify(title)
        today = datetime.now().strftime("%Y-%m-%d")

        # 解析 Markdown
        html_content, excerpt_raw = self._parse_markdown(md_content)

        # 处理资源
        resource_html, resource_entries = self._process_resources(blog_id, output_base)

        # 如果有资源，追加到内容末尾
        if resource_html:
            html_content += "\n" + resource_html

        # 提取摘要
        excerpt = excerpt_raw if excerpt_raw else self._extract_excerpt(html_content)

        # 计算阅读时间
        word_count = len(md_content)
        read_time = max(1, round(word_count / 500))

        # 生成标签 HTML
        tags_html = "\n                ".join(
            [f'<span class="tag">{t}</span>' for t in tags]
        )

        # 生成文章内容（缩进处理）
        indented_content = ""
        for line in html_content.split("\n"):
            if line.strip():
                indented_content += "            " + line + "\n"
            else:
                indented_content += "\n"

        # 填充模板
        post_html = POST_TEMPLATE.format(
            title=title,
            date=today,
            category=category,
            read_time=read_time,
            content=indented_content,
            tags_html=tags_html
        )

        # 创建输出文件夹
        blog_dir = os.path.join(output_base, blog_id)
        os.makedirs(blog_dir, exist_ok=True)

        # 保存 HTML
        post_path = os.path.join(blog_dir, "post.html")
        try:
            with open(post_path, "w", encoding="utf-8") as f:
                f.write(post_html)
        except Exception as e:
            messagebox.showerror("写入失败", f"无法写入博客文件：\n{str(e)}")
            return

        # 自动注册到 blog-list.js
        if self.auto_register_var.get():
            self._register_to_blog_list(blog_id, title, excerpt, today, category, tags)

        self.status_var.set(f"✅ 生成成功！博客路径：{post_path}")
        messagebox.showinfo("生成成功",
                            f"博客已成功生成！\n\n"
                            f"标题：{title}\n"
                            f"位置：{post_path}\n"
                            f"资源：{len(self.resource_files)} 个\n"
                            f"字数：{word_count}\n"
                            f"阅读时间：约 {read_time} 分钟")

    def _slugify(self, text):
        """将中文标题转换为英文标识符"""
        # 简单替换：去除特殊字符，空格替换为连字符
        import unicodedata
        # 尝试将 unicode 字符近似转成 ASCII
        slug = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii', 'ignore')
        slug = re.sub(r'[^\w\s-]', '', slug.lower())
        slug = re.sub(r'[-\s]+', '-', slug).strip('-')
        if not slug:
            # 如果全中文，使用时间戳
            slug = f"post-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        return slug

    def _extract_excerpt(self, html_content):
        """从 HTML 中提取纯文本摘要"""
        # 移除所有 HTML 标签
        text = re.sub(r'<[^>]+>', '', html_content)
        # 截取前 150 个字符
        if len(text) > 150:
            return text[:150].strip() + "..."
        return text.strip()[:200]

    def _register_to_blog_list(self, blog_id, title, excerpt, date, category, tags):
        """将新博客注册到 blog-list.js"""
        blog_list_path = os.path.join(os.path.dirname(self.output_dir_var.get()), "js", "blog-list.js")
        if not os.path.exists(blog_list_path):
            # 尝试从当前目录查找
            blog_list_path = os.path.join(os.getcwd(), "js", "blog-list.js")

        if not os.path.exists(blog_list_path):
            self.status_var.set("⚠️ 未找到 blog-list.js，请手动注册")
            return

        # 构建新条目
        entry = f'''    {{
        id: "{blog_id}",
        title: "{title}",
        excerpt: "{excerpt}",
        date: "{date}",
        category: "{category}",
        tags: {json.dumps(tags, ensure_ascii=False)},
        url: "./blog-data/{blog_id}/post.html"
    }}'''

        try:
            with open(blog_list_path, "r", encoding="utf-8") as f:
                content = f.read()

            # 在最后一个 '];' 之前插入新条目
            if "// ========================================" in content:
                # 在最后一个 ] 前插入
                insert_pos = content.rfind("]")
                if insert_pos > 0:
                    new_content = content[:insert_pos] + ",\n" + entry + "\n" + content[insert_pos:]
                    with open(blog_list_path, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    self.status_var.set("✅ 已自动注册到 blog-list.js")
        except Exception as e:
            self.status_var.set(f"⚠️ 注册到 blog-list.js 失败: {str(e)}")

    def preview_html(self):
        """预览生成的 HTML"""
        title = self.title_entry.get().strip() or "示例标题"
        category = self.category_var.get()
        tags_text = self.tags_entry.get().strip()
        tags = [t.strip() for t in tags_text.split(",") if t.strip()]

        md_content = self.md_text.get("1.0", tk.END).strip()
        if not md_content:
            messagebox.showinfo("提示", "请先录入 Markdown 内容以预览")
            return

        html_content, _ = self._parse_markdown(md_content)
        today = datetime.now().strftime("%Y-%m-%d")
        word_count = len(md_content)
        read_time = max(1, round(word_count / 500))

        tags_html = "\n                ".join(
            [f'<span class="tag">{t}</span>' for t in tags]
        )

        indented_content = ""
        for line in html_content.split("\n"):
            if line.strip():
                indented_content += "            " + line + "\n"
            else:
                indented_content += "\n"

        preview_html = POST_TEMPLATE.format(
            title=title,
            date=today,
            category=category,
            read_time=read_time,
            content=indented_content,
            tags_html=tags_html
        )

        # 在预览窗口中显示
        preview_win = tk.Toplevel(self.root)
        preview_win.title(f"预览 - {title}")
        preview_win.geometry("900x700")

        preview_text = scrolledtext.ScrolledText(preview_win, wrap=tk.WORD,
                                                  font=("Consolas", 10))
        preview_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        preview_text.insert("1.0", preview_html)
        preview_text.config(state=tk.DISABLED)

        ttk.Label(preview_win,
                  text="👆 此为生成的完整 HTML 源码预览，可直接复制使用",
                  foreground="gray", font=("", 9)).pack(pady=(0, 10))

        ttk.Button(preview_win, text="关闭", command=preview_win.destroy).pack(pady=(0, 10))


def main():
    root = tk.Tk()
    app = BlogGeneratorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
