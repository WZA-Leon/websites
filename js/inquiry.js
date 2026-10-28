// 主页信息问卷
// 30 个字段 → 校验 → 自动保存草稿 → 生成 / 复制 / 导出 JSON
(function () {
    'use strict';

    const STORAGE_KEY = 'wza-profile-inquiry-v1';

    const HOBBY_OPTIONS = [
        '钢琴', '音乐', '动漫', '游戏', '阅读', '写作', '摄影',
        '绘画', '编程', '运动', '旅行', '美食', '电影', '手工'
    ];

    const GROUPS = [
        {
            id: 'basic',
            no: 'A',
            title: '基本资料',
            desc: '主页顶部、友链卡片和基本信息卡都会用到。',
            fields: [
                {
                    id: 'name', label: '显示名称', type: 'text', required: true, maxlength: 40,
                    placeholder: '冯猷悠 / Reori', hint: '主页大标题、友链卡片都会用这个名字。'
                },
                {
                    id: 'alias', label: '英文名 / 别名', type: 'text', maxlength: 30,
                    placeholder: 'FYY / reori', hint: '用在主页顶部的小标题，可留空。'
                },
                {
                    id: 'gender', label: '性别', type: 'radio', required: true,
                    options: ['女', '男', '其他', '不公开'], hint: '只用于基本信息卡。'
                },
                {
                    id: 'birthDate', label: '出生日期', type: 'date', required: true,
                    hint: '会用来算年龄和星座；主页上可以只显示月日。'
                },
                {
                    id: 'city', label: '所在城市', type: 'text', required: true, maxlength: 40,
                    placeholder: '辽宁大连 · 沙河口区'
                },
                {
                    id: 'school', label: '学校 / 单位', type: 'text', maxlength: 40,
                    placeholder: '辽宁师大附中'
                },
                {
                    id: 'identity', label: '年级 / 身份', type: 'text', required: true, maxlength: 40,
                    placeholder: '高二学生 / 独立开发者'
                },
                {
                    id: 'height', label: '身高', type: 'text', maxlength: 20,
                    placeholder: '159 cm', hint: '不想公开就留空。'
                },
                {
                    id: 'website', label: '个人网站 / 域名', type: 'text', maxlength: 120,
                    placeholder: 'https://example.com', hint: '还没有就留空，之后再加。'
                }
            ]
        },
        {
            id: 'contact',
            no: 'B',
            title: '联系方式',
            desc: '只会写进 JSON，不会自动公开到任何地方。',
            fields: [
                {
                    id: 'contactType', label: '主要联系方式', type: 'select', required: true,
                    options: ['微信', 'QQ', '邮箱', '抖音', '其他']
                },
                {
                    id: 'contactValue', label: '联系方式账号', type: 'text', required: true, maxlength: 80,
                    placeholder: '微信号 / QQ 号 / 邮箱地址', hint: '分享 JSON 前请确认是否愿意公开。'
                },
                {
                    id: 'email', label: '邮箱', type: 'email', maxlength: 120,
                    placeholder: 'name@example.com', hint: '用于接收主页草稿和上线通知。'
                },
                {
                    id: 'social', label: '其他社交账号', type: 'textarea', rows: 3, maxlength: 300,
                    placeholder: '每行一个，例如：\n抖音：78747JDQS\nGitHub：yourname', hint: '没有就留空。'
                }
            ]
        },
        {
            id: 'about',
            no: 'C',
            title: '关于你',
            desc: '这一组决定主页读起来像不像你本人。',
            fields: [
                {
                    id: 'tagline', label: '一句话简介', type: 'text', required: true, maxlength: 60,
                    placeholder: '弹琴、追番、听歌，也追星空和海。', hint: '会显示在主页标题下面。'
                },
                {
                    id: 'avatar', label: '头像链接', type: 'text', maxlength: 200,
                    placeholder: 'images/friends/xxx.jpg 或 https://…', hint: '可以先留空，之后把图片发给 WZA。'
                },
                {
                    id: 'about', label: '关于我', type: 'textarea', rows: 6, required: true, maxlength: 1200,
                    placeholder: '写写性格、日常、在意的事，或者最近的状态……', hint: '3–5 段最好，像跟新朋友聊天。'
                },
                {
                    id: 'quote', label: '座右铭 / 个人签名', type: 'text', maxlength: 80,
                    placeholder: '喜欢明媚，也喜欢忧郁。'
                },
                {
                    id: 'personality', label: '性格关键词', type: 'tags', required: true,
                    placeholder: '输入后按回车，例如：开朗幽默', hint: '3–6 个词，会显示成标签。'
                },
                {
                    id: 'hobbies', label: '兴趣爱好', type: 'checks', required: true,
                    options: HOBBY_OPTIONS, customTags: true, hint: '可多选，也能自己补。'
                },
                {
                    id: 'strengths', label: '擅长的事', type: 'text', maxlength: 80,
                    placeholder: '钢琴 / 文科 / C++'
                },
                {
                    id: 'recent', label: '最近在做的事', type: 'textarea', rows: 3, maxlength: 400,
                    placeholder: '最近在补《全职猎人》，也在练一首新曲子……'
                }
            ]
        },
        {
            id: 'favorites',
            no: 'D',
            title: '喜好清单',
            desc: '帮主页补上那些「一看就是你」的细节。',
            fields: [
                {
                    id: 'music', label: '喜欢的音乐', type: 'text', maxlength: 120,
                    placeholder: '华语、日语、纯音乐；最近单曲循环……'
                },
                {
                    id: 'anime', label: '喜欢的动漫 / 书影', type: 'text', maxlength: 120,
                    placeholder: '《全职猎人》《石纪元》……'
                },
                {
                    id: 'colors', label: '喜欢的颜色', type: 'text', maxlength: 60,
                    placeholder: '蓝色、绿色'
                },
                {
                    id: 'food', label: '喜欢的美食', type: 'text', maxlength: 80,
                    placeholder: '葱多多益善，秋葵不行'
                }
            ]
        },
        {
            id: 'homepage',
            no: 'E',
            title: '主页内容',
            desc: '作品、时间线和主题，决定主页长什么样。',
            fields: [
                {
                    id: 'skills', label: '技能关键词', type: 'tags',
                    placeholder: '输入后按回车，例如：钢琴 / C++ / 剪辑', hint: '会显示成主页上的技能标签。'
                },
                {
                    id: 'projects', label: '代表作品 / 正在做的事', type: 'textarea', rows: 4, maxlength: 800,
                    placeholder: '每行一个，格式：标题 | 一句话说明 | 标签1,标签2\n例如：晨曦海岸 | 长曝光拍的海边清晨 | 摄影,长曝光',
                    hint: '一行一个作品；没有作品也可以写「正在学的事」。'
                },
                {
                    id: 'timeline', label: '成长时间线', type: 'textarea', rows: 4, maxlength: 800,
                    placeholder: '每行一个，格式：年份 | 标题 | 一句话说明\n例如：2024 | 上高中 | 开始认真做主页',
                    hint: '3–5 条就够，不用写成简历。'
                },
                {
                    id: 'theme', label: '主页主题', type: 'select',
                    options: [
                        { value: 'colorful', label: '彩色（明亮）' },
                        { value: 'dark', label: '暗色（炫酷）' },
                        { value: 'light', label: '黑白极简' }
                    ],
                    hint: '之后也可以换。'
                },
                {
                    id: 'notes', label: '备注 / 期望', type: 'textarea', rows: 3, maxlength: 600,
                    placeholder: '想让主页强调什么、什么时候上线、有什么顾虑……'
                }
            ]
        }
    ];

    const FIELDS = GROUPS.flatMap((group) => group.fields);
    FIELDS.forEach((field, index) => {
        field.number = index + 1;
    });

    const FIELD_MAP = new Map(FIELDS.map((field) => [field.id, field]));
    const REQUIRED_TOTAL = FIELDS.filter((field) => field.required).length;

    const state = {
        tags: {},
        savedAt: '',
        clearArmed: false
    };

    const dom = {};
    const tagEditors = {};

    let saveTimer = 0;
    let toastTimer = 0;
    let clearTimer = 0;

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        dom.form = document.getElementById('profileForm');
        dom.fieldsRoot = document.getElementById('formFields');
        dom.preview = document.getElementById('jsonPreview');
        dom.filled = document.getElementById('filledCount');
        dom.required = document.getElementById('requiredCount');
        dom.progressBar = document.getElementById('progressBar');
        dom.progressFill = document.getElementById('progressFill');
        dom.saveStatus = document.getElementById('saveStatus');
        dom.toast = document.getElementById('inquiryToast');

        if (!dom.form || !dom.fieldsRoot) return;

        renderGroups();
        bindEvents();

        const restored = restoreDraft();
        if (!restored) {
            refresh({ save: false });
        }
    }

    /* ---------- 渲染字段 ---------- */

    function renderGroups() {
        GROUPS.forEach((group) => {
            const section = document.createElement('section');
            section.className = 'inquiry-block';
            section.id = `group-${group.id}`;

            const head = document.createElement('header');
            head.className = 'inquiry-block-head';

            const no = document.createElement('span');
            no.className = 'inquiry-block-no';
            no.textContent = group.no;
            no.setAttribute('aria-hidden', 'true');

            const text = document.createElement('div');
            const title = document.createElement('h2');
            title.textContent = group.title;
            const desc = document.createElement('p');
            desc.textContent = group.desc;
            text.append(title, desc);

            head.append(no, text);
            section.appendChild(head);

            const grid = document.createElement('div');
            grid.className = 'field-grid';
            group.fields.forEach((field) => grid.appendChild(renderField(field)));
            section.appendChild(grid);

            dom.fieldsRoot.appendChild(section);
        });
    }

    function renderField(field) {
        const usesLegend = field.type === 'radio' || field.type === 'checks';
        const wrapper = document.createElement(usesLegend ? 'fieldset' : 'div');
        wrapper.className = `field${isWide(field) ? ' field--wide' : ''}`;
        wrapper.dataset.field = field.id;

        const label = document.createElement(usesLegend ? 'legend' : 'label');
        label.className = 'field-label';
        if (!usesLegend) label.htmlFor = `field-${field.id}`;

        const number = document.createElement('span');
        number.className = 'field-no';
        number.textContent = String(field.number).padStart(2, '0');
        label.appendChild(number);
        label.appendChild(document.createTextNode(field.label));

        if (field.required) {
            const required = document.createElement('span');
            required.className = 'field-req';
            required.textContent = '必填';
            label.appendChild(required);
        }
        wrapper.appendChild(label);

        const control = renderControl(field);
        wrapper.appendChild(control);

        if (field.type === 'tags') {
            label.htmlFor = `field-${field.id}-tag-input`;
        }

        const described = [];
        if (field.hint) {
            const hint = document.createElement('p');
            hint.className = 'field-hint';
            hint.id = `hint-${field.id}`;
            hint.textContent = field.hint;
            wrapper.appendChild(hint);
            described.push(hint.id);
        }

        const error = document.createElement('p');
        error.className = 'field-error';
        error.id = `error-${field.id}`;
        error.setAttribute('role', 'alert');
        error.hidden = true;
        wrapper.appendChild(error);
        described.push(error.id);

        wrapper.querySelectorAll('input, textarea, select').forEach((node) => {
            node.setAttribute('aria-describedby', described.join(' '));
        });

        return wrapper;
    }

    function isWide(field) {
        return field.type === 'textarea' || field.type === 'tags' ||
            field.type === 'checks' || field.type === 'radio';
    }

    function renderControl(field) {
        if (field.type === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.rows = field.rows || 4;
            applyCommon(textarea, field);
            return textarea;
        }

        if (field.type === 'select') {
            const select = document.createElement('select');
            applyCommon(select, field);

            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = '请选择';
            select.appendChild(placeholder);

            field.options.forEach((option) => {
                const item = document.createElement('option');
                item.value = optionValue(option);
                item.textContent = optionLabel(option);
                select.appendChild(item);
            });
            return select;
        }

        if (field.type === 'radio') {
            return renderChoices(field, 'radio');
        }

        if (field.type === 'checks') {
            const stack = document.createElement('div');
            stack.className = 'field-stack';
            stack.appendChild(renderChoices(field, 'checkbox'));
            if (field.customTags) {
                stack.appendChild(createTagEditor(field, '其他爱好，按回车添加'));
            }
            return stack;
        }

        if (field.type === 'tags') {
            return createTagEditor(field, field.placeholder || '输入后按回车');
        }

        const input = document.createElement('input');
        input.type = field.type;
        applyCommon(input, field);
        return input;
    }

    function applyCommon(control, field) {
        control.id = `field-${field.id}`;
        control.name = field.id;
        control.autocomplete = 'off';
        control.spellcheck = false;

        if (field.placeholder) control.placeholder = field.placeholder;
        if (field.maxlength) control.maxLength = field.maxlength;
        if (field.required) control.setAttribute('aria-required', 'true');
        if (field.type === 'date') control.max = todayISO();
        if (field.type === 'date') control.min = '1900-01-01';
    }

    function renderChoices(field, type) {
        const grid = document.createElement('div');
        grid.className = type === 'radio' ? 'choice-row' : 'choice-grid';

        field.options.forEach((option) => {
            const value = optionValue(option);
            const label = document.createElement('label');
            label.className = 'choice';

            const input = document.createElement('input');
            input.type = type;
            input.name = field.id;
            input.value = value;

            const text = document.createElement('span');
            text.textContent = optionLabel(option);

            label.append(input, text);
            grid.appendChild(label);
        });

        return grid;
    }

    function createTagEditor(field, placeholder) {
        const editor = document.createElement('div');
        editor.className = 'tag-editor';

        const list = document.createElement('div');
        list.className = 'tag-list';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'tag-input';
        input.id = `field-${field.id}-tag-input`;
        input.placeholder = placeholder;
        input.autocomplete = 'off';
        input.setAttribute('aria-label', `${field.label}：输入后按回车添加`);

        editor.append(list, input);

        function ensureTags() {
            if (!Array.isArray(state.tags[field.id])) state.tags[field.id] = [];
            return state.tags[field.id];
        }

        function add(raw) {
            const value = String(raw || '').trim().replace(/[,，、;；]+$/g, '').trim();
            if (!value) return;

            if (value.length > 16) {
                toast('单个关键词最多 16 个字');
                return;
            }

            const tags = ensureTags();
            if (tags.length >= 12) {
                toast('最多添加 12 个关键词');
                return;
            }
            if (tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
                toast('这个关键词已经加过了');
                return;
            }

            if (field.type === 'checks' && Array.isArray(field.options) &&
                field.options.includes(value)) {
                toast('这一项已经勾选了');
                return;
            }

            tags.push(value);
            input.value = '';
            renderTags();
            clearFieldError(field);
            refresh();
        }

        function renderTags() {
            const tags = ensureTags();
            list.textContent = '';

            tags.forEach((value, index) => {
                const chip = document.createElement('span');
                chip.className = 'tag-chip';

                const text = document.createElement('span');
                text.textContent = value;

                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'tag-remove';
                remove.setAttribute('aria-label', `移除 ${value}`);
                remove.textContent = '×';
                remove.addEventListener('click', () => {
                    tags.splice(index, 1);
                    renderTags();
                    refresh();
                });

                chip.append(text, remove);
                list.appendChild(chip);
            });
        }

        input.addEventListener('keydown', (event) => {
            if (event.isComposing) return;

            if (event.key === 'Enter' || event.key === ',' || event.key === '，' || event.key === '、') {
                event.preventDefault();
                add(input.value);
                return;
            }

            if (event.key === 'Backspace' && !input.value) {
                const tags = ensureTags();
                if (!tags.length) return;
                tags.pop();
                renderTags();
                refresh();
            }
        });

        input.addEventListener('blur', () => {
            if (input.value.trim()) add(input.value);
        });

        renderTags();
        tagEditors[field.id] = { render: renderTags };

        return editor;
    }

    /* ---------- 读取与校验 ---------- */

    function fieldElement(field) {
        return dom.form.querySelector(`#field-${field.id}`);
    }

    function fieldWrapper(field) {
        return dom.form.querySelector(`.field[data-field="${field.id}"]`);
    }

    function readField(field) {
        if (field.type === 'radio') {
            const checked = dom.form.querySelector(`input[name="${field.id}"]:checked`);
            return checked ? checked.value : '';
        }

        if (field.type === 'checks') {
            const checked = Array.from(
                dom.form.querySelectorAll(`input[name="${field.id}"]:checked`)
            ).map((input) => input.value);
            return checked.concat(state.tags[field.id] || []);
        }

        if (field.type === 'tags') {
            return (state.tags[field.id] || []).slice();
        }

        const element = fieldElement(field);
        return element ? element.value.trim() : '';
    }

    function collectValues() {
        const values = {};
        FIELDS.forEach((field) => {
            values[field.id] = readField(field);
        });
        return values;
    }

    function isEmpty(value) {
        if (Array.isArray(value)) return value.length === 0;
        return !String(value == null ? '' : value).trim();
    }

    function formatProblem(field, value) {
        if (isEmpty(value)) return '';

        if (field.id === 'birthDate' && !isValidBirthDate(value)) {
            return '请填写 1900 年之后、且不晚于今天的日期。';
        }

        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
            return '邮箱格式看起来不太对。';
        }

        if ((field.id === 'website' || field.id === 'avatar') && /\s/.test(value)) {
            return '链接里不要包含空格。';
        }

        if (/^https?:\/\//i.test(value)) {
            try {
                new URL(value);
            } catch (error) {
                return '链接格式不太对，建议以 https:// 开头。';
            }
        }

        return '';
    }

    function validateField(field) {
        const value = readField(field);
        let message = '';

        if (field.required && isEmpty(value)) {
            message = '这一项需要填写。';
        } else if (!isEmpty(value)) {
            message = formatProblem(field, value);
        }

        setFieldError(field, message);
        return !message;
    }

    function validateAll() {
        const result = { missing: [], invalid: [] };

        FIELDS.forEach((field) => {
            const value = readField(field);
            let message = '';

            if (field.required && isEmpty(value)) {
                result.missing.push(field);
                message = '这一项需要填写。';
            } else if (!isEmpty(value)) {
                const problem = formatProblem(field, value);
                if (problem) {
                    result.invalid.push(field);
                    message = problem;
                }
            }

            setFieldError(field, message);
        });

        return result;
    }

    function setFieldError(field, message) {
        const wrapper = fieldWrapper(field);
        if (!wrapper) return;

        const error = wrapper.querySelector('.field-error');
        wrapper.classList.toggle('is-invalid', Boolean(message));
        wrapper.querySelectorAll('input, textarea, select').forEach((control) => {
            control.setAttribute('aria-invalid', message ? 'true' : 'false');
        });
        if (error) {
            error.textContent = message;
            error.hidden = !message;
        }
    }

    function clearFieldError(field) {
        setFieldError(field, '');
    }

    function focusFirstProblem() {
        const first = dom.form.querySelector('.field.is-invalid');
        if (!first) return;

        first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const control = first.querySelector('input, textarea, select, .tag-input');
        if (control) {
            window.setTimeout(() => control.focus({ preventScroll: true }), 320);
        }
    }

    /* ---------- 进度、预览与保存 ---------- */

    function refresh(options) {
        const settings = options || {};
        const values = collectValues();

        updateProgress(values);
        updatePreview(values);

        if (settings.save !== false) scheduleSave();
    }

    function updateProgress(values) {
        const filled = FIELDS.filter((field) => !isEmpty(values[field.id])).length;
        const requiredFilled = FIELDS.filter(
            (field) => field.required && !isEmpty(values[field.id])
        ).length;

        if (dom.filled) dom.filled.textContent = String(filled);
        if (dom.required) dom.required.textContent = `必填 ${requiredFilled} / ${REQUIRED_TOTAL}`;
        if (dom.progressFill) dom.progressFill.style.width = `${(filled / FIELDS.length) * 100}%`;
        if (dom.progressBar) {
            dom.progressBar.setAttribute('aria-valuenow', String(filled));
            dom.progressBar.setAttribute('aria-valuemax', String(FIELDS.length));
        }
    }

    function updatePreview(values) {
        if (!dom.preview) return;
        dom.preview.textContent = JSON.stringify(buildProfile(values), null, 2);
    }

    function setSavedStatus(message, highlight) {
        if (!dom.saveStatus) return;
        dom.saveStatus.textContent = message;
        dom.saveStatus.classList.toggle('is-saved', Boolean(highlight));
    }

    function scheduleSave() {
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(saveDraft, 500);
    }

    function saveDraft() {
        const snapshot = {
            version: 1,
            savedAt: new Date().toISOString(),
            values: collectValues()
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
            state.savedAt = snapshot.savedAt;
            setSavedStatus(`已自动保存 ${formatTime(snapshot.savedAt)}`, true);
        } catch (error) {
            setSavedStatus('浏览器禁止本地存储，草稿不会自动保存');
        }
    }

    function restoreDraft() {
        let snapshot = null;

        try {
            snapshot = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (error) {
            return false;
        }

        if (!snapshot || typeof snapshot.values !== 'object' || !snapshot.values) return false;

        const hasContent = FIELDS.some((field) => {
            const value = snapshot.values[field.id];
            return Array.isArray(value)
                ? value.length > 0
                : typeof value === 'string' && value.trim() !== '';
        });

        if (!hasContent) return false;

        FIELDS.forEach((field) => {
            const value = snapshot.values[field.id];
            if (value === undefined || value === null) return;

            if (field.type === 'tags') {
                state.tags[field.id] = Array.isArray(value) ? value.slice(0, 12) : [];
                return;
            }

            if (field.type === 'checks') {
                const selected = Array.isArray(value) ? value.slice() : [];
                const options = field.options || [];
                options.forEach((option) => {
                    const optionValueText = optionValue(option);
                    const input = dom.form.querySelector(
                        `input[name="${field.id}"][value="${cssEscape(optionValueText)}"]`
                    );
                    if (input) input.checked = selected.includes(optionValueText);
                });
                state.tags[field.id] = selected.filter((item) => !options.includes(item));
                return;
            }

            if (field.type === 'radio') {
                const input = dom.form.querySelector(
                    `input[name="${field.id}"][value="${cssEscape(value)}"]`
                );
                if (input) input.checked = true;
                return;
            }

            const element = fieldElement(field);
            if (element) element.value = value;
        });

        Object.keys(tagEditors).forEach((id) => tagEditors[id].render());
        state.savedAt = snapshot.savedAt;
        refresh({ save: false });
        setSavedStatus(`已恢复 ${formatDateTime(snapshot.savedAt)} 的草稿`, true);
        return true;
    }

    /* ---------- 生成 JSON ---------- */

    function buildProfile(values) {
        const filled = FIELDS.filter((field) => !isEmpty(values[field.id])).length;
        const requiredFilled = FIELDS.filter(
            (field) => field.required && !isEmpty(values[field.id])
        ).length;

        return {
            schema: 'wza-homepage-profile',
            version: 1,
            status: profileStatus(values),
            completeness: {
                filled,
                total: FIELDS.length,
                requiredFilled,
                requiredTotal: REQUIRED_TOTAL
            },
            profile: {
                name: values.name,
                alias: values.alias,
                gender: values.gender,
                birthDate: values.birthDate,
                age: calcAge(values.birthDate),
                zodiac: zodiacOf(values.birthDate),
                city: values.city,
                school: values.school,
                identity: values.identity,
                height: values.height,
                website: values.website,
                contact: {
                    type: values.contactType,
                    value: values.contactValue,
                    email: values.email,
                    social: parseSocial(values.social)
                },
                tagline: values.tagline,
                avatar: values.avatar,
                about: values.about,
                quote: values.quote,
                personality: values.personality,
                hobbies: values.hobbies,
                strengths: values.strengths,
                recent: values.recent,
                favorites: {
                    music: values.music,
                    anime: values.anime,
                    colors: values.colors,
                    food: values.food
                },
                skills: values.skills,
                projects: parseProjects(values.projects),
                timeline: parseTimeline(values.timeline),
                theme: values.theme,
                notes: values.notes
            }
        };
    }

    function profileStatus(values) {
        const hasFormatProblem = FIELDS.some((field) => {
            const value = values[field.id];
            return !isEmpty(value) && formatProblem(field, value);
        });
        if (hasFormatProblem) return 'draft';

        const missingRequired = FIELDS.some(
            (field) => field.required && isEmpty(values[field.id])
        );
        if (missingRequired) return 'draft';

        const filled = FIELDS.filter((field) => !isEmpty(values[field.id])).length;
        return filled === FIELDS.length ? 'complete' : 'ready';
    }

    function exportText() {
        const values = collectValues();
        const data = buildProfile(values);

        const payload = {
            schema: data.schema,
            version: data.version,
            exportedAt: new Date().toISOString(),
            status: data.status,
            completeness: data.completeness,
            profile: data.profile
        };

        return JSON.stringify(payload, null, 2);
    }

    function parseSocial(text) {
        if (!text) return [];

        return String(text)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                if (/^https?:\/\//i.test(line)) {
                    return { platform: '', account: line };
                }

                const match = line.match(/^(.{1,20}?)[：:]\s*(.+)$/);
                return match
                    ? { platform: match[1].trim(), account: match[2].trim() }
                    : { platform: '', account: line };
            });
    }

    function parseProjects(text) {
        if (!text) return [];

        return String(text)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const parts = line.split('|').map((part) => part.trim());
                return {
                    title: parts[0] || '',
                    description: parts[1] || '',
                    tags: (parts[2] || '')
                        .split(/[,，、;；]/)
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                };
            })
            .filter((item) => item.title || item.description);
    }

    function parseTimeline(text) {
        if (!text) return [];

        return String(text)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const parts = line.split('|').map((part) => part.trim());
                return {
                    year: parts[0] || '',
                    title: parts[1] || '',
                    description: parts[2] || ''
                };
            })
            .filter((item) => item.year || item.title || item.description);
    }

    function calcAge(dateString) {
        if (!isValidBirthDate(dateString)) return null;

        const [year, month, day] = dateString.split('-').map(Number);
        const now = new Date();
        let age = now.getFullYear() - year;
        const monthIndex = now.getMonth() + 1;
        const beforeBirthday = monthIndex < month ||
            (monthIndex === month && now.getDate() < day);

        if (beforeBirthday) age -= 1;
        return age >= 0 ? age : null;
    }

    function zodiacOf(dateString) {
        if (!isValidBirthDate(dateString)) return '';

        const [, month, day] = dateString.split('-').map(Number);
        const marker = month * 100 + day;

        if (marker >= 1222 || marker <= 119) return '摩羯座';
        if (marker <= 218) return '水瓶座';
        if (marker <= 320) return '双鱼座';
        if (marker <= 419) return '白羊座';
        if (marker <= 520) return '金牛座';
        if (marker <= 621) return '双子座';
        if (marker <= 722) return '巨蟹座';
        if (marker <= 822) return '狮子座';
        if (marker <= 922) return '处女座';
        if (marker <= 1023) return '天秤座';
        if (marker <= 1122) return '天蝎座';
        if (marker <= 1221) return '射手座';
        return '摩羯座';
    }

    function isValidBirthDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
        if (!match) return false;

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);

        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date >= new Date(1900, 0, 1) && date <= today;
    }

    /* ---------- 操作 ---------- */

    function bindEvents() {
        dom.form.addEventListener('submit', (event) => event.preventDefault());

        dom.form.addEventListener('input', (event) => {
            const wrapper = event.target.closest('.field');
            if (wrapper) clearFieldError(FIELD_MAP.get(wrapper.dataset.field));
            refresh();
        });

        dom.form.addEventListener('change', (event) => {
            const wrapper = event.target.closest('.field');
            if (wrapper) clearFieldError(FIELD_MAP.get(wrapper.dataset.field));
            refresh();
        });

        dom.form.addEventListener('focusout', (event) => {
            const wrapper = event.target.closest('.field');
            if (!wrapper) return;

            const field = FIELD_MAP.get(wrapper.dataset.field);
            if (!field) return;

            const value = readField(field);
            if (!isEmpty(value)) validateField(field);
        });

        document.addEventListener('click', (event) => {
            const button = event.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            if (action === 'clear') {
                handleClear();
                return;
            }
            handleAction(action);
        });
    }

    async function handleAction(action) {
        if (action === 'check') {
            const result = validateAll();
            const problems = result.missing.length + result.invalid.length;

            if (problems) {
                focusFirstProblem();
                toast(`还有 ${problems} 项要处理：必填 ${result.missing.length} 项，格式 ${result.invalid.length} 项`);
                return;
            }

            toast('检查通过，可以复制或导出 JSON 了');
            return;
        }

        if (action === 'copy' || action === 'download') {
            const result = validateAll();

            if (result.invalid.length) {
                focusFirstProblem();
                toast(`有 ${result.invalid.length} 项格式需要修正，暂未${action === 'copy' ? '复制' : '导出'}`);
                return;
            }

            const text = exportText();
            const values = collectValues();
            const filled = FIELDS.filter((field) => !isEmpty(values[field.id])).length;
            const optionalLeft = FIELDS.length - filled;
            const draftNote = result.missing.length
                ? `已生成草稿（还差 ${result.missing.length} 项必填）`
                : (optionalLeft > 0
                    ? `必填项已齐（还有 ${optionalLeft} 项可选未填）`
                    : '30 项已填完');

            if (action === 'copy') {
                const copied = await copyText(text);
                if (!copied) {
                    toast('复制失败，请手动选中 JSON 预览后复制');
                    if (dom.preview) dom.preview.focus();
                    return;
                }
                saveDraft();
                toast(`JSON 已复制到剪贴板，${draftNote}`);
                return;
            }

            downloadText(text);
            saveDraft();
            toast(`JSON 已开始下载，${draftNote}`);
        }
    }

    function handleClear() {
        if (!state.clearArmed) {
            state.clearArmed = true;
            document.querySelectorAll('[data-action="clear"]').forEach((button) => {
                button.dataset.originalText = button.textContent;
                button.textContent = '再点一次确认清空';
                button.classList.add('is-armed');
            });
            clearTimer = window.setTimeout(disarmClear, 3200);
            return;
        }

        disarmClear();
        clearAll();
    }

    function disarmClear() {
        window.clearTimeout(clearTimer);
        state.clearArmed = false;
        document.querySelectorAll('[data-action="clear"]').forEach((button) => {
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            button.classList.remove('is-armed');
        });
    }

    function clearAll() {
        window.clearTimeout(saveTimer);
        saveTimer = 0;

        dom.form.reset();
        FIELDS.forEach((field) => {
            if (field.type === 'tags' || field.type === 'checks') {
                state.tags[field.id] = [];
            }
        });
        Object.keys(tagEditors).forEach((id) => tagEditors[id].render());

        dom.form.querySelectorAll('.field.is-invalid').forEach((wrapper) => {
            wrapper.classList.remove('is-invalid');
            const error = wrapper.querySelector('.field-error');
            if (error) {
                error.textContent = '';
                error.hidden = true;
            }
        });

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            // 本地存储不可用时忽略。
        }

        state.savedAt = '';
        refresh({ save: false });
        setSavedStatus('问卷已清空，草稿也已删除');
        toast('问卷已清空');
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // 继续尝试兼容方案。
            }
        }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        let copied = false;
        try {
            copied = document.execCommand('copy');
        } catch (error) {
            copied = false;
        }
        textarea.remove();
        return copied;
    }

    function downloadText(text) {
        const values = collectValues();
        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName(values);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function downloadName(values) {
        const base = String(values.name || 'profile')
            .replace(/[\\/:*?"<>|\s]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 24) || 'profile';
        const now = new Date();
        const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        return `${base}-profile-${stamp}.json`;
    }

    function toast(message) {
        if (!dom.toast) return;
        dom.toast.textContent = message;
        dom.toast.classList.add('show');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => dom.toast.classList.remove('show'), 2800);
    }

    /* ---------- 工具 ---------- */

    function optionValue(option) {
        return typeof option === 'string' ? option : option.value;
    }

    function optionLabel(option) {
        return typeof option === 'string' ? option : option.label;
    }

    function todayISO() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function formatTime(iso) {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    function formatDateTime(iso) {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '上次';
        return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${formatTime(iso)}`;
    }

    function cssEscape(value) {
        if (window.CSS && typeof window.CSS.escape === 'function') {
            return window.CSS.escape(String(value));
        }
        return String(value).replace(/["\\]/g, '\\$&');
    }
})();
