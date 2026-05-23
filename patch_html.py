import re
import glob

files = glob.glob('*.html')
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    orig = text

    text = re.sub(r'<header>[\s\S]*?</header>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<footer>[\s\S]*?</footer>', '', text, flags=re.IGNORECASE)

    if 'id="nav-placeholder"' not in text:
        text = re.sub(r'(<body[^>]*>)', r'\1\n    <div id="nav-placeholder"></div>\n', text, count=1, flags=re.IGNORECASE)

    if 'id="footer-placeholder"' not in text:
        text = re.sub(r'(</body>)', r'    <div id="footer-placeholder"></div>\n    <script src="script.js"></script>\n\1', text, count=1, flags=re.IGNORECASE)
    elif 'script.js' not in text:
        text = re.sub(r'(</body>)', r'    <script src="script.js"></script>\n\1', text, count=1, flags=re.IGNORECASE)

    if 'script.js' not in text:
        text = re.sub(r'(</body>)', r'    <script src="script.js"></script>\n\1', text, count=1, flags=re.IGNORECASE)

    if path == 'index.html':
        text = text.replace('href="contact.html" class="btn">开始探索</a>', 'href="site-map.html" class="btn">开始探索</a>')
        text = text.replace('<h3>计算机</h3>', '<h3><a href="projects.html" class="feature-link">计算机</a></h3>')
        text = text.replace('<h3>摄影</h3>', '<h3><a href="gallery.html" class="feature-link">摄影</a></h3>')

    if text != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'patched {path}')
