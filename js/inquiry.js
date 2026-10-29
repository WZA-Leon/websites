// 主页信息问卷
// 一份完整的个人档案 → 校验 → 自动保存草稿 → 必填完成后生成 / 复制 / 导出 JSON
(function () {
    'use strict';

    const STORAGE_KEY = 'wza-profile-inquiry-v2';

    const HOBBY_OPTIONS = [
        '钢琴', '音乐', '动漫', '游戏', '阅读', '写作', '摄影',
        '绘画', '编程', '运动', '旅行', '美食', '电影', '手工'
    ];

    const GROUPS = [
        {
            id: 'basic',
            no: 'A',
            title: '基本资料',
            desc: '主页顶部、基本信息卡和第一印象都会用到。',
            fields: [
                {
                    id: 'name', label: '显示名称', type: 'text', required: true, maxlength: 40,
                    placeholder: '示例：林见夏 / Jax', hint: '我会把它放在主页大标题、友链卡片和浏览器标签上。'
                },
                {
                    id: 'alias', label: '英文名 / 别名', type: 'text', required: true, maxlength: 30,
                    placeholder: '示例：Jax / 小夏', hint: '没有英文名的话，用拼音或常用昵称也行，我会放在主页顶部的小标题。'
                },
                {
                    id: 'gender', label: '性别', type: 'radio', required: true,
                    options: ['女', '男', '其他', '不公开'], hint: '只出现在基本信息卡里。'
                },
                {
                    id: 'birthDate', label: '出生日期', type: 'date', required: true,
                    hint: '我会用它算年龄和星座；主页上只显示月日也可以。'
                },
                {
                    id: 'city', label: '所在城市', type: 'text', required: true, maxlength: 40,
                    placeholder: '示例：浙江杭州 · 西湖区'
                },
                {
                    id: 'school', label: '学校 / 单位', type: 'text', required: true, maxlength: 60,
                    placeholder: '示例：杭州第七中学'
                },
                {
                    id: 'identity', label: '年级 / 身份', type: 'text', required: true, maxlength: 40,
                    placeholder: '示例：高三学生 / 摄影社成员'
                },
                {
                    id: 'height', label: '身高', type: 'text', required: true, maxlength: 20,
                    placeholder: '示例：172 cm', hint: '不想公开就写「保密」，但这一项我会留着。'
                },
                {
                    id: 'website', label: '个人网站 / 域名', type: 'text', maxlength: 120,
                    placeholder: '示例：https://example.com', hint: '选填；还没有个人网站就留空。'
                },
                {
                    id: 'avatar', label: '头像链接', type: 'text', maxlength: 200,
                    placeholder: '示例：images/profile/me.jpg', hint: '选填；之后把图片发给我也行。'
                },
                {
                    id: 'about', label: '个人简介 / 关于我', type: 'textarea', rows: 6, required: true, maxlength: 1200,
                    placeholder: '示例：我是林见夏，平时喜欢拍照和散步……', hint: '我会把这几段放在「关于我」里，3–5 段最像聊天。'
                }
            ]
        },
        {
            id: 'contact',
            no: 'B',
            title: '联系方式',
            desc: '常用的都填上；没有的社媒可以留空，微信、QQ、电话必填。',
            fields: [
                {
                    id: 'wechat', label: '微信', type: 'text', required: true, maxlength: 60,
                    placeholder: '示例：jianxia_2026'
                },
                {
                    id: 'qq', label: 'QQ', type: 'text', required: true, maxlength: 20,
                    placeholder: '示例：100200300', hint: '5–12 位数字；我会把它放在联系方式里。'
                },
                {
                    id: 'phone', label: '电话', type: 'tel', required: true, maxlength: 30,
                    placeholder: '示例：+86 139 0000 0000'
                },
                {
                    id: 'email', label: '邮箱', type: 'email', maxlength: 120,
                    placeholder: '示例：hello@example.com', hint: '选填；没有邮箱就留空。'
                },
                {
                    id: 'github', label: 'GitHub', type: 'text', maxlength: 120,
                    placeholder: '示例：jianxia', hint: '选填；没有就留空。'
                },
                {
                    id: 'facebook', label: 'Facebook', type: 'text', maxlength: 120,
                    placeholder: '示例：jianxia.lin', hint: '选填；没有就留空。'
                },
                {
                    id: 'otherContact', label: '其他联系方式', type: 'textarea', rows: 3, maxlength: 300,
                    placeholder: '示例：\n微博：@见夏\nB站：UID 100200300\n小红书：见夏的日常',
                    hint: '选填；微博、B站、小红书、抖音都可以写在这里。'
                }
            ]
        },
        {
            id: 'achievements',
            no: 'C',
            title: '成就与近况',
            desc: '让你被记住的部分：做成过什么，最近在忙什么。',
            fields: [
                {
                    id: 'achievements', label: '成就 / 奖项 / 里程碑', type: 'textarea', rows: 4, required: true, maxlength: 800,
                    placeholder: '示例：校摄影社社长；拿过一次市级比赛二等奖。',
                    hint: '我会把它放在「成就」或「正在做的事」里，不用只写官方奖项。'
                },
                {
                    id: 'recent', label: '最近在干嘛', type: 'textarea', rows: 3, required: true, maxlength: 400,
                    placeholder: '示例：最近在学手冲咖啡，也在整理暑假拍的照片。'
                }
            ]
        },
        {
            id: 'personality',
            no: 'D',
            title: '性格与爱好',
            desc: '性格、爱好和擅长的事，决定主页读起来像不像你。',
            fields: [
                {
                    id: 'personality', label: '性格关键词', type: 'tags', required: true,
                    placeholder: '示例：慢热、爱笑、做事认真', hint: '3–6 个词，我会把它们做成主页上的标签。'
                },
                {
                    id: 'hobbies', label: '兴趣爱好', type: 'checks', required: true,
                    options: HOBBY_OPTIONS, customTags: true, hint: '多选或自己补都行，我会挑几个放进「喜欢的事」。'
                },
                {
                    id: 'strengths', label: '擅长的事', type: 'text', required: true, maxlength: 120,
                    placeholder: '示例：拍照 / 修图 / 整理资料'
                }
            ]
        },
        {
            id: 'likes',
            no: 'E',
            title: '喜欢与不喜欢',
            desc: '越具体越像你：歌、影视、食物、人，都可以写。',
            fields: [
                {
                    id: 'likeMusic', label: '喜欢的歌曲 / 音乐', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：城市民谣和轻电子；最近循环《晚风》'
                },
                {
                    id: 'dislikeMusic', label: '不喜欢的歌曲 / 音乐', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：太吵的重低音'
                },
                {
                    id: 'likeScreen', label: '喜欢的影视 / 动漫', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：《海街日记》《小森林》'
                },
                {
                    id: 'dislikeScreen', label: '不喜欢的影视 / 动漫', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：强行煽情的综艺'
                },
                {
                    id: 'likeFood', label: '喜欢的食物', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：番茄牛腩、冰美式'
                },
                {
                    id: 'dislikeFood', label: '不喜欢的食物', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：肥肉、苦瓜'
                },
                {
                    id: 'likePeople', label: '喜欢的人 / 偶像 / 角色', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：认真生活、说话算数的人'
                },
                {
                    id: 'dislikePeople', label: '不喜欢的人 / 类型', type: 'text', required: true, maxlength: 160,
                    placeholder: '示例：爱打断别人说话的人'
                }
            ]
        },
        {
            id: 'words',
            no: 'F',
            title: '想说的话',
            desc: '可以正经，也可以不正经；这些话会单独成块。',
            fields: [
                {
                    id: 'message', label: '想对别人说的话', type: 'textarea', rows: 4, required: true, maxlength: 600,
                    placeholder: '示例：谢谢你点进来。这里没有标准答案，只有一些认真记录过的日子。'
                },
                {
                    id: 'rant', label: '想吐槽的', type: 'textarea', rows: 4, required: true, maxlength: 600,
                    placeholder: '示例：为什么周一总是来得这么快，快递却总是那么慢。'
                },
                {
                    id: 'quote', label: '格言 / 座右铭', type: 'text', required: true, maxlength: 100,
                    placeholder: '示例：把普通的日子过得具体一点。'
                }
            ]
        },
        {
            id: 'timeline',
            no: 'G',
            title: '人生时间线',
            desc: '挑几件真正重要的事，按时间顺序写。',
            fields: [
                {
                    id: 'timeline', label: '重要时间点', type: 'textarea', rows: 5, required: true, maxlength: 800,
                    placeholder: '示例：\n2018 年，第一次拿起相机\n2021 年，开始写博客\n2025 年，做出第一个自己满意的小工具',
                    hint: '一行一件，我会按顺序排成时间线，不用写得很正式。'
                }
            ]
        },
        {
            id: 'projects',
            no: 'H',
            title: '项目作品',
            desc: '一个项目一组，名称、说明、链接分开填；没有可以留空。',
            fields: [
                {
                    id: 'project1Name', label: '名称', type: 'text', maxlength: 60,
                    placeholder: '示例：旧城散步'
                },
                {
                    id: 'project1Desc', label: '一句话说明', type: 'text', maxlength: 120,
                    placeholder: '示例：一组关于老城区的照片'
                },
                {
                    id: 'project1Link', label: '链接', type: 'text', maxlength: 200,
                    placeholder: '示例：https://example.com/old-town'
                },
                {
                    id: 'project2Name', label: '名称', type: 'text', maxlength: 60,
                    placeholder: '示例：晚风电台'
                },
                {
                    id: 'project2Desc', label: '一句话说明', type: 'text', maxlength: 120,
                    placeholder: '示例：一个只播独立音乐的小站'
                },
                {
                    id: 'project2Link', label: '链接', type: 'text', maxlength: 200,
                    placeholder: '示例：https://example.com/radio'
                },
                {
                    id: 'project3Name', label: '名称', type: 'text', maxlength: 60,
                    placeholder: '示例：桌面收纳盒'
                },
                {
                    id: 'project3Desc', label: '一句话说明', type: 'text', maxlength: 120,
                    placeholder: '示例：用废纸板做的收纳实验'
                },
                {
                    id: 'project3Link', label: '链接', type: 'text', maxlength: 200,
                    placeholder: '示例：https://example.com/box'
                }
            ]
        },
        {
            id: 'skills',
            no: 'I',
            title: '技能与主页',
            desc: '最后是标签和主页的外观选项。',
            fields: [
                {
                    id: 'skills', label: '技能关键词', type: 'tags', required: true,
                    placeholder: '示例：拍照 / 修图 / 剪辑',
                    hint: '不一定是技术，也可以是「做手账」「养植物」。'
                },
                {
                    id: 'theme', label: '主页主题', type: 'select', required: true,
                    options: [
                        { value: 'colorful', label: '彩色（明亮）' },
                        { value: 'dark', label: '暗色（炫酷）' },
                        { value: 'light', label: '黑白极简' }
                    ],
                    hint: '之后也可以换，我会先按这个主题做。'
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
        dom.total = document.getElementById('totalCount');
        dom.required = document.getElementById('requiredCount');
        dom.requiredTip = document.getElementById('requiredTipCount');
        dom.gate = document.getElementById('exportGate');
        dom.progressBar = document.getElementById('progressBar');
        dom.progressFill = document.getElementById('progressFill');
        dom.saveStatus = document.getElementById('saveStatus');
        dom.toast = document.getElementById('inquiryToast');

        if (!dom.form || !dom.fieldsRoot) return;

        if (dom.total) dom.total.textContent = String(FIELDS.length);
        if (dom.requiredTip) dom.requiredTip.textContent = String(REQUIRED_TOTAL);
        if (dom.required) dom.required.textContent = `必填 0 / ${REQUIRED_TOTAL}`;
        if (dom.progressBar) dom.progressBar.setAttribute('aria-valuemax', String(FIELDS.length));

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

            if (group.id === 'projects') {
                grid.className = 'project-list';

                [1, 2, 3].forEach((index) => {
                    const slot = document.createElement('section');
                    slot.className = 'project-slot';

                    const heading = document.createElement('h3');
                    heading.textContent = `项目 ${index}`;
                    slot.appendChild(heading);

                    const fields = document.createElement('div');
                    fields.className = 'field-grid field-grid--project';
                    group.fields
                        .filter((field) => field.id.startsWith(`project${index}`))
                        .forEach((field) => fields.appendChild(renderField(field)));

                    slot.appendChild(fields);
                    grid.appendChild(slot);
                });
            } else {
                grid.className = 'field-grid';
                group.fields.forEach((field) => grid.appendChild(renderField(field)));
            }

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
        } else {
            const optional = document.createElement('span');
            optional.className = 'field-opt';
            optional.textContent = '选填';
            label.appendChild(optional);
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
                stack.appendChild(createTagEditor(field, '其他爱好，按回车添加（示例：拼模型）'));
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

        if (field.id === 'qq' && !/^\d{5,12}$/.test(value)) {
            return 'QQ 号通常是 5–12 位数字。';
        }

        if (field.id === 'phone' && !/^[+\d][\d\s-]{5,19}$/.test(value)) {
            return '电话号码格式看起来不太对。';
        }

        if (isLinkField(field) && /\s/.test(value)) {
            return '链接里不要包含空格。';
        }

        if (isLinkField(field) && /^https?:\/\//i.test(value)) {
            try {
                new URL(value);
            } catch (error) {
                return '链接格式不太对，建议以 https:// 开头。';
            }
        }

        return '';
    }

    function isLinkField(field) {
        return [
            'website', 'avatar', 'github', 'facebook',
            'project1Link', 'project2Link', 'project3Link'
        ].includes(field.id);
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
        updateGate(values);

        if (settings.save !== false) scheduleSave();
    }

    function updateProgress(values) {
        const filled = FIELDS.filter((field) => !isEmpty(values[field.id])).length;
        const requiredFilled = FIELDS.filter(
            (field) => field.required && !isEmpty(values[field.id])
        ).length;

        if (dom.filled) dom.filled.textContent = String(filled);
        if (dom.total) dom.total.textContent = String(FIELDS.length);
        if (dom.required) dom.required.textContent = `必填 ${requiredFilled} / ${REQUIRED_TOTAL}`;
        if (dom.progressFill) dom.progressFill.style.width = `${(filled / FIELDS.length) * 100}%`;
        if (dom.progressBar) {
            dom.progressBar.setAttribute('aria-valuenow', String(filled));
            dom.progressBar.setAttribute('aria-valuemax', String(FIELDS.length));
        }
    }

    function updateGate(values) {
        if (!dom.gate) return;

        const missing = FIELDS.filter(
            (field) => field.required && isEmpty(values[field.id])
        ).length;
        const invalid = FIELDS.filter(
            (field) => !isEmpty(values[field.id]) && formatProblem(field, values[field.id])
        ).length;
        const ready = missing === 0 && invalid === 0;

        dom.gate.classList.toggle('is-ready', ready);
        dom.gate.textContent = ready
            ? '必填项已全部完成，可以复制或导出 JSON'
            : `还差 ${missing} 项必填${invalid ? `、${invalid} 项格式待修正` : ''}，完成后才能导出`;

        document.querySelectorAll('[data-action="copy"], [data-action="download"]').forEach((button) => {
            button.classList.toggle('is-locked', !ready);
            button.setAttribute('aria-disabled', String(!ready));
        });
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
            version: 2,
            status: profileStatus(values),
            completeness: {
                filled,
                total: FIELDS.length,
                requiredFilled,
                requiredTotal: REQUIRED_TOTAL,
                optionalFilled: filled - requiredFilled,
                optionalTotal: FIELDS.length - REQUIRED_TOTAL
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
                avatar: values.avatar,
                about: values.about,
                achievements: values.achievements,
                contacts: {
                    wechat: values.wechat,
                    qq: values.qq,
                    phone: values.phone,
                    email: values.email,
                    github: values.github,
                    facebook: values.facebook,
                    others: parseSocial(values.otherContact)
                },
                personality: values.personality,
                hobbies: values.hobbies,
                strengths: values.strengths,
                recent: values.recent,
                likes: {
                    music: values.likeMusic,
                    screen: values.likeScreen,
                    food: values.likeFood,
                    people: values.likePeople
                },
                dislikes: {
                    music: values.dislikeMusic,
                    screen: values.dislikeScreen,
                    food: values.dislikeFood,
                    people: values.dislikePeople
                },
                message: values.message,
                rant: values.rant,
                quote: values.quote,
                timeline: parseTimeline(values.timeline),
                projects: collectProjects(values),
                skills: values.skills,
                theme: values.theme
            }
        };
    }

    function profileStatus(values) {
        const hasProblem = FIELDS.some((field) => {
            const value = values[field.id];
            if (field.required && isEmpty(value)) return true;
            return !isEmpty(value) && Boolean(formatProblem(field, value));
        });
        return hasProblem ? 'draft' : 'complete';
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

    function collectProjects(values) {
        return [1, 2, 3]
            .map((index) => ({
                name: values[`project${index}Name`] || '',
                description: values[`project${index}Desc`] || '',
                link: values[`project${index}Link`] || ''
            }))
            .filter((project) => project.name || project.description || project.link);
    }

    function parseTimeline(text) {
        if (!text) return [];

        return String(text)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const match = line.match(/^([^，,:：、]{1,16})\s*[，,:：、]\s*(.+)$/);
                return match
                    ? { time: match[1].trim(), event: match[2].trim() }
                    : { time: '', event: line };
            });
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

            if (result.missing.length || result.invalid.length) {
                focusFirstProblem();

                const problems = [];
                if (result.missing.length) problems.push(`还差 ${result.missing.length} 项必填`);
                if (result.invalid.length) problems.push(`${result.invalid.length} 项格式待修正`);

                toast(`${problems.join('，')}，填完才能${action === 'copy' ? '复制' : '导出'} JSON`);
                return;
            }

            const text = exportText();

            if (action === 'copy') {
                const copied = await copyText(text);
                if (!copied) {
                    toast('复制失败，请手动选中 JSON 预览后复制');
                    if (dom.preview) dom.preview.focus();
                    return;
                }
                saveDraft();
                toast('JSON 已复制到剪贴板');
                return;
            }

            downloadText(text);
            saveDraft();
            toast('JSON 已开始下载');
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
