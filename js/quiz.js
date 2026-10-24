// ========================================
// 测验系统
// 题库位于 questions/*.json，按分类异步加载。
// ========================================
(function () {
    'use strict';

    const categorySection = document.getElementById('categorySection');
    const quizContainer = document.getElementById('quizContainer');
    const result = document.getElementById('result');
    const quizEl = document.getElementById('quiz');
    const progressBar = document.getElementById('progressBar');
    const progressWrap = document.getElementById('quizProgress');
    const submitBtn = document.getElementById('submitBtn');
    const warningEl = document.getElementById('quizWarning');
    const toast = document.getElementById('quizToast');

    if (!quizEl) return;

    const PERSONALITY_META = {
        '分析型': { icon: 'fa-brain', description: '你习惯先理解规则，再做出判断。' },
        '社交型': { icon: 'fa-comments', description: '你从人与人的连接中获得能量。' },
        '创意型': { icon: 'fa-lightbulb', description: '你更喜欢新的角度和不一样的做法。' },
        '稳定型': { icon: 'fa-anchor', description: '你重视可靠、秩序和持续的节奏。' }
    };

    const state = {
        category: null,
        quiz: null,
        answers: {},
        startedAt: 0,
        answerData: null
    };

    const quizCache = new Map();
    let loadingCategory = null;
    let toastTimer = 0;

    function escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character]));
    }

    function formatQuestion(value) {
        return escapeHtml(value).replace(/\n/g, '<br>');
    }

    function optionLabel(option) {
        if (typeof option === 'string') return option;
        if (option && typeof option.label === 'string') return option.label;
        return '';
    }

    function getOption(question, index) {
        if (!question || !Array.isArray(question.options)) return null;
        return question.options[index] || null;
    }

    function scrollToElement(element) {
        if (!element) return;
        const reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const top = element.getBoundingClientRect().top + window.scrollY - 86;
        window.scrollTo({
            top: Math.max(0, top),
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    }

    function showToast(message, duration = 2600) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
        }, duration);
    }

    async function fetchJson(url) {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    async function loadQuiz(category) {
        if (quizCache.has(category)) return quizCache.get(category);
        const data = await fetchJson(`questions/${category}.json`);
        if (!data || !Array.isArray(data.questions) || !data.questions.length) {
            throw new Error('题库为空或格式不正确');
        }
        quizCache.set(category, data);
        return data;
    }

    async function startQuiz(category) {
        if (loadingCategory) return;

        const card = Array.from(document.querySelectorAll('.category-card'))
            .find(item => item.dataset.category === category);
        const countEl = card ? card.querySelector('.category-count') : null;
        const originalCount = countEl ? countEl.textContent : '';

        loadingCategory = category;
        if (card) {
            card.classList.add('is-loading');
            card.setAttribute('aria-busy', 'true');
        }
        if (countEl) countEl.textContent = '加载中…';

        try {
            const quiz = await loadQuiz(category);

            state.category = category;
            state.quiz = quiz;
            state.answers = {};
            state.startedAt = Date.now();
            state.answerData = null;

            categorySection.classList.add('hidden');
            result.classList.add('hidden');
            result.classList.remove('is-personality');
            quizContainer.classList.remove('hidden');

            const label = document.getElementById('quizCategoryLabel');
            if (label) label.textContent = quiz.title || category;
            if (warningEl) warningEl.textContent = '';
            if (submitBtn) submitBtn.disabled = false;

            renderQuestions(quiz);
            updateProgress();

            // 等布局完成后再滚动，避免隐藏分类区后仍停留在页面底部。
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => scrollToElement(quizContainer));
            });
        } catch (error) {
            console.error('Failed to load quiz:', category, error);
            showToast('题库加载失败，请通过本地服务器或线上地址访问后重试。', 4200);
        } finally {
            loadingCategory = null;
            if (card) {
                card.classList.remove('is-loading');
                card.removeAttribute('aria-busy');
            }
            if (countEl) countEl.textContent = originalCount;
        }
    }

    function renderQuestions(quiz) {
        quizEl.innerHTML = quiz.questions.map((question, index) => {
            const options = Array.isArray(question.options) ? question.options : [];
            return `
                <article class="question" data-index="${index}" id="question-${index}">
                    <div class="question-head">
                        <span class="question-number">${String(index + 1).padStart(2, '0')}</span>
                        <h3 class="question-text">${formatQuestion(question.question)}</h3>
                    </div>
                    <div class="options" role="group" aria-label="第 ${index + 1} 题选项">
                        ${options.map((option, optionIndex) => `
                            <button type="button" class="option" data-option="${optionIndex}" aria-pressed="false">
                                <span class="option-key">${String.fromCharCode(65 + optionIndex)}</span>
                                <span class="option-text">${escapeHtml(optionLabel(option))}</span>
                            </button>
                        `).join('')}
                    </div>
                </article>
            `;
        }).join('');

        quizEl.querySelectorAll('.option').forEach(button => {
            button.addEventListener('click', onOptionClick);
        });
    }

    function onOptionClick(event) {
        const button = event.currentTarget;
        const question = button.closest('.question');
        if (!question) return;

        const questionIndex = Number(question.dataset.index);
        const optionIndex = Number(button.dataset.option);

        question.querySelectorAll('.option').forEach(option => {
            const selected = option === button;
            option.classList.toggle('selected', selected);
            option.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });

        question.classList.remove('is-unanswered');
        state.answers[questionIndex] = optionIndex;
        updateProgress();
    }

    function updateProgress() {
        if (!state.quiz) return;
        const total = state.quiz.questions.length;
        const answered = Object.keys(state.answers).length;
        const percentage = total ? Math.round((answered / total) * 100) : 0;

        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressWrap) progressWrap.setAttribute('aria-valuenow', String(percentage));

        const answeredEl = document.getElementById('quizAnsweredCount');
        if (answeredEl) answeredEl.textContent = `${answered} / ${total} 已作答`;
    }

    function buildAnswerData(quiz, completedAt) {
        const answers = quiz.questions.map((question, index) => {
            const selectedIndex = state.answers[index] === undefined ? null : Number(state.answers[index]);
            const selectedOption = selectedIndex === null ? null : getOption(question, selectedIndex);
            const correctIndex = Number.isInteger(question.answer) ? question.answer : null;
            const correctOption = correctIndex === null ? null : getOption(question, correctIndex);

            return {
                index: index + 1,
                question: question.question,
                options: Array.isArray(question.options) ? question.options.map(optionLabel) : [],
                selectedIndex,
                selected: selectedOption ? optionLabel(selectedOption) : null,
                selectedCategory: selectedOption && selectedOption.category ? selectedOption.category : null,
                correctIndex,
                correct: correctOption ? optionLabel(correctOption) : null,
                isCorrect: correctIndex === null ? null : selectedIndex === correctIndex,
                explanation: question.explanation || null
            };
        });

        const total = answers.length;
        const answered = answers.filter(answer => answer.selectedIndex !== null).length;
        const isPersonality = quiz.type === 'personality';
        const score = isPersonality
            ? null
            : answers.filter(answer => answer.isCorrect === true).length;
        const percentage = isPersonality ? null : Math.round((score / total) * 100);

        const personalityScores = {};
        if (isPersonality) {
            answers.forEach(answer => {
                if (!answer.selectedCategory) return;
                personalityScores[answer.selectedCategory] =
                    (personalityScores[answer.selectedCategory] || 0) + 1;
            });
        }

        return {
            quiz: {
                id: state.category,
                title: quiz.title,
                type: quiz.type || 'quiz'
            },
            startedAt: new Date(state.startedAt).toISOString(),
            completedAt: completedAt.toISOString(),
            durationSeconds: Math.max(1, Math.round((completedAt.getTime() - state.startedAt) / 1000)),
            total,
            answered,
            score,
            percentage,
            personalityScores: isPersonality ? personalityScores : null,
            answers
        };
    }

    function submitQuiz() {
        if (!state.quiz) return;

        const total = state.quiz.questions.length;
        const answered = Object.keys(state.answers).length;

        if (answered < total) {
            const proceed = window.confirm(
                `还有 ${total - answered} 题没有作答，未作答将计为错误。仍要提交吗？`
            );
            if (!proceed) {
                const firstUnanswered = state.quiz.questions.findIndex(
                    (_, index) => state.answers[index] === undefined
                );
                const questionEl = document.getElementById(`question-${firstUnanswered}`);
                if (questionEl) {
                    questionEl.classList.add('is-unanswered');
                    scrollToElement(questionEl);
                }
                return;
            }
        }

        const data = buildAnswerData(state.quiz, new Date());
        state.answerData = data;
        showResult(state.quiz, data);
    }

    function topPersonalityType(scores) {
        const order = ['分析型', '社交型', '创意型', '稳定型'];
        return order.reduce((best, type) =>
            (scores[type] || 0) > (scores[best] || 0) ? type : best
        , order[0]);
    }

    function formatDuration(seconds) {
        if (seconds < 60) return `${seconds} 秒`;
        return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
    }

    function showResult(quiz, data) {
        quizContainer.classList.add('hidden');
        result.classList.remove('hidden');

        const isPersonality = data.quiz.type === 'personality';
        result.classList.toggle('is-personality', isPersonality);

        const scoreCircle = document.getElementById('scoreCircle');
        const scoreText = document.getElementById('scoreText');
        const titleEl = document.getElementById('resultTitle');
        const messageEl = document.getElementById('resultMessage');
        const statsEl = document.getElementById('resultStats');

        if (isPersonality) {
            if (scoreCircle) scoreCircle.style.display = 'none';
            const top = topPersonalityType(data.personalityScores || {});
            const meta = PERSONALITY_META[top] || { description: '' };
            if (titleEl) titleEl.textContent = `你的主导倾向：${top}`;
            if (messageEl) {
                messageEl.textContent = `${meta.description} 你在「${top}」上选择了 ${data.personalityScores[top] || 0} 次。`;
            }
        } else {
            if (scoreCircle) scoreCircle.style.display = '';
            if (scoreText) scoreText.textContent = `${data.score}/${data.total}`;
            if (scoreCircle) {
                scoreCircle.style.setProperty('--score-angle', `${data.percentage * 3.6}deg`);
            }

            let title;
            let message;
            if (data.percentage >= 90) {
                title = '🎉 优秀！你表现得很棒！';
                message = `你的正确率为 ${data.percentage}%。你对这个领域的知识掌握得非常扎实，继续保持。`;
            } else if (data.percentage >= 80) {
                title = '👍 很好！再接再厉！';
                message = `你的正确率为 ${data.percentage}%。你的知识基础不错，还有一些可以继续加强的地方。`;
            } else if (data.percentage >= 70) {
                title = '🙂 及格！还可以更好！';
                message = `你的正确率为 ${data.percentage}%。基础知识已经掌握了一部分，建议再看一眼错题。`;
            } else if (data.percentage >= 60) {
                title = '🤔 需要努力！';
                message = `你的正确率为 ${data.percentage}%。这个领域还有不少知识需要进一步学习和巩固。`;
            } else {
                title = '😅 加油吧！';
                message = `你的正确率为 ${data.percentage}%。建议从基础知识开始系统学习，下次会更好。`;
            }
            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.textContent = message;
        }

        if (statsEl) {
            const stats = isPersonality
                ? [
                    ['完成题目', `${data.answered}/${data.total}`],
                    ['用时', formatDuration(data.durationSeconds)],
                    ['主导类型', topPersonalityType(data.personalityScores || {})]
                ]
                : [
                    ['正确', `${data.score} 题`],
                    ['错误', `${data.total - data.score} 题`],
                    ['正确率', `${data.percentage}%`],
                    ['用时', formatDuration(data.durationSeconds)]
                ];
            statsEl.innerHTML = stats.map(([label, value]) => `
                <div class="result-stat">
                    <strong>${escapeHtml(value)}</strong>
                    <span>${escapeHtml(label)}</span>
                </div>
            `).join('');
        }

        renderReview(data);

        const preview = document.getElementById('answerDataPreview');
        if (preview) preview.textContent = JSON.stringify(data, null, 2);

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => scrollToElement(result));
        });
    }

    function renderReview(data) {
        const isPersonality = data.quiz.type === 'personality';
        const reviewEl = document.getElementById('answerReview');
        if (!reviewEl) return;

        const summary = isPersonality ? renderPersonalitySummary(data) : '';
        const items = data.answers.map(answer => {
            const statusClass = isPersonality
                ? 'is-neutral'
                : answer.selectedIndex === null
                    ? 'is-unanswered'
                    : answer.isCorrect
                        ? 'is-correct'
                        : 'is-wrong';
            const statusLabel = isPersonality
                ? '已选择'
                : answer.selectedIndex === null
                    ? '未作答'
                    : answer.isCorrect
                        ? '正确'
                        : '错误';
            const selected = answer.selected || '未作答';
            const selectedDetail = answer.selectedCategory
                ? `${selected} · ${answer.selectedCategory}`
                : selected;

            return `
                <article class="review-item ${statusClass}">
                    <div class="review-head">
                        <span class="review-index">${String(answer.index).padStart(2, '0')}</span>
                        <p class="review-question">${escapeHtml(answer.question)}</p>
                        <span class="review-status">${statusLabel}</span>
                    </div>
                    <div class="review-answers">
                        <span class="review-chip">你的答案 <strong>${escapeHtml(selectedDetail)}</strong></span>
                        ${answer.correct ? `<span class="review-chip is-correct">正确答案 <strong>${escapeHtml(answer.correct)}</strong></span>` : ''}
                    </div>
                    ${answer.explanation ? `<p class="review-explanation">${escapeHtml(answer.explanation)}</p>` : ''}
                </article>
            `;
        }).join('');

        reviewEl.innerHTML = summary + items;
    }

    function renderPersonalitySummary(data) {
        const scores = data.personalityScores || {};
        const order = ['分析型', '社交型', '创意型', '稳定型'];
        const rows = order.map(type => {
            const value = scores[type] || 0;
            const percentage = data.total ? (value / data.total) * 100 : 0;
            return `
                <div class="personality-row">
                    <span class="personality-label">${type}</span>
                    <div class="personality-meter"><span style="width: ${percentage}%"></span></div>
                    <strong>${value}</strong>
                </div>
            `;
        }).join('');

        return `
            <div class="personality-summary">
                <div class="personality-summary-head">
                    <span>倾向分布</span>
                    <small>共 ${data.total} 题</small>
                </div>
                ${rows}
            </div>
        `;
    }

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // 继续使用兼容方案。
            }
        }

        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.top = '-999px';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();

        let copied = false;
        try {
            copied = document.execCommand('copy');
        } catch (error) {
            copied = false;
        }
        area.remove();
        return copied;
    }

    async function copyAnswerData() {
        if (!state.answerData) return;
        const text = JSON.stringify(state.answerData, null, 2);
        const copied = await copyText(text);
        if (copied) {
            showToast('答题数据已复制到剪贴板');
            return;
        }

        // 浏览器拒绝剪贴板权限时，展开 JSON 并选中内容，方便直接按 Ctrl+C。
        const details = document.querySelector('.answer-json');
        if (details) details.open = true;
        const preview = document.getElementById('answerDataPreview');
        if (preview && window.getSelection) {
            const range = document.createRange();
            range.selectNodeContents(preview);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showToast('复制受限，已选中 JSON，请按 Ctrl+C 复制', 3600);
        } else {
            showToast('复制失败，请展开原始 JSON 手动复制', 3600);
        }
    }

    function downloadAnswerData() {
        if (!state.answerData) return;
        const text = JSON.stringify(state.answerData, null, 2);
        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const stamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            '-',
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0')
        ].join('');
        const link = document.createElement('a');
        link.href = url;
        link.download = `wza-quiz-${state.category || 'result'}-${stamp}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast('答题数据已开始下载');
    }

    function backToCategories() {
        const quizVisible = !quizContainer.classList.contains('hidden');
        if (quizVisible && Object.keys(state.answers).length) {
            const proceed = window.confirm('退出后本次作答不会保留，确定返回分类吗？');
            if (!proceed) return;
        }

        quizContainer.classList.add('hidden');
        result.classList.add('hidden');
        result.classList.remove('is-personality');
        categorySection.classList.remove('hidden');

        state.category = null;
        state.quiz = null;
        state.answers = {};
        state.answerData = null;

        if (progressBar) progressBar.style.width = '0%';
        if (progressWrap) progressWrap.setAttribute('aria-valuenow', '0');
        const answeredEl = document.getElementById('quizAnsweredCount');
        if (answeredEl) answeredEl.textContent = '0 / 0 已作答';
        if (warningEl) warningEl.textContent = '';

        window.requestAnimationFrame(() => scrollToElement(categorySection));
    }

    async function hydrateCategoryCounts() {
        try {
            const manifest = await fetchJson('questions/manifest.json');
            if (!Array.isArray(manifest)) return;

            let total = 0;
            manifest.forEach(item => {
                const card = Array.from(document.querySelectorAll('.category-card'))
                    .find(entry => entry.dataset.category === item.id);
                if (!card) return;

                const countEl = card.querySelector('.category-count');
                if (countEl && item.count) countEl.textContent = `${item.count} 道题`;

                const descEl = card.querySelector('.category-copy small');
                if (descEl && item.description) descEl.textContent = item.description;

                total += Number(item.count) || 0;
            });

            const totalEl = document.getElementById('quizTotalQuestions');
            if (totalEl && total) totalEl.textContent = String(total);
        } catch (error) {
            // 静态数量和描述已经写在页面里，清单加载失败不影响使用。
        }
    }

    function init() {
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => startQuiz(card.dataset.category));
        });

        const quizBackBtn = document.getElementById('quizBackBtn');
        if (quizBackBtn) quizBackBtn.addEventListener('click', backToCategories);

        if (submitBtn) submitBtn.addEventListener('click', submitQuiz);

        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                if (state.category) startQuiz(state.category);
            });
        }

        const backToCategoriesBtn = document.getElementById('backToCategoriesBtn');
        if (backToCategoriesBtn) backToCategoriesBtn.addEventListener('click', backToCategories);

        const copyDataBtn = document.getElementById('copyDataBtn');
        if (copyDataBtn) copyDataBtn.addEventListener('click', copyAnswerData);

        const downloadDataBtn = document.getElementById('downloadDataBtn');
        if (downloadDataBtn) downloadDataBtn.addEventListener('click', downloadAnswerData);

        hydrateCategoryCounts();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
