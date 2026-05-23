// 测验系统 JS
let quizData = {};
let currentCategory = null;
let selectedAnswers = {};

// 题库数据结构
const quizDatabase = {
    life: {
        title: "生活常识",
        questions: [
            {
                id: 1,
                text: "以下哪种水果含有最多的维生素C？",
                options: ["苹果", "猕猴桃", "香蕉", "橙子"],
                correct: 1
            },
            {
                id: 2,
                text: "人体最大的器官是？",
                options: ["心脏", "皮肤", "肝脏", "大脑"],
                correct: 1
            },
            {
                id: 3,
                text: "以下哪种烹饪方法最健康？",
                options: ["油炸", "蒸", "煎", "烤"],
                correct: 1
            },
            {
                id: 4,
                text: "成年人每天应该睡多少小时？",
                options: ["4-6小时", "7-9小时", "10-12小时", "2-4小时"],
                correct: 1
            },
            {
                id: 5,
                text: "以下哪种运动最适合减肥？",
                options: ["举重", "有氧运动", "瑜伽", "游泳"],
                correct: 1
            },
            {
                id: 6,
                text: "人体含水量最多的器官是？",
                options: ["血液", "大脑", "肌肉", "皮肤"],
                correct: 1
            },
            {
                id: 7,
                text: "以下哪种维生素主要存在于水果和蔬菜中？",
                options: ["维生素A", "维生素C", "维生素D", "维生素K"],
                correct: 1
            },
            {
                id: 8,
                text: "健康饮食中碳水化合物应该占总热量的多少？",
                options: ["10-20%", "45-65%", "25-35%", "70-80%"],
                correct: 1
            },
            {
                id: 9,
                text: "以下哪种行为最有助于保护环境？",
                options: ["使用一次性塑料袋", "回收利用", "过度用水", "开车出行"],
                correct: 1
            },
            {
                id: 10,
                text: "压力过大时，以下哪种方法最有效？",
                options: ["吃垃圾食品", "深呼吸和冥想", "熬夜工作", "喝咖啡"],
                correct: 1
            }
        ]
    },
    culture: {
        title: "文化知识",
        questions: [
            {
                id: 1,
                text: "中国古代四大名著不包括以下哪部作品？",
                options: ["红楼梦", "三体", "三国演义", "西游记"],
                correct: 1
            },
            {
                id: 2,
                text: "莎士比亚是哪个国家的著名戏剧家？",
                options: ["法国", "英国", "意大利", "西班牙"],
                correct: 1
            },
            {
                id: 3,
                text: "以下哪一个不是中国传统节日？",
                options: ["春节", "圣诞节", "中秋节", "端午节"],
                correct: 1
            },
            {
                id: 4,
                text: "古代埃及的标志性建筑物是？",
                options: ["帕台农神庙", "金字塔", "比萨斜塔", "自由女神像"],
                correct: 1
            },
            {
                id: 5,
                text: "儒家文化中最重要的德行是？",
                options: ["勇气", "仁义", "聪慧", "财富"],
                correct: 1
            },
            {
                id: 6,
                text: "唐诗三百首中最著名的诗人是？",
                options: ["李白", "杜甫", "白居易", "都对"],
                correct: 3
            },
            {
                id: 7,
                text: "文艺复兴运动最早发源于哪个国家？",
                options: ["法国", "德国", "意大利", "西班牙"],
                correct: 2
            },
            {
                id: 8,
                text: "中国书法中的'楷书'是由哪种书体发展而来？",
                options: ["篆书", "隶书", "行书", "草书"],
                correct: 1
            },
            {
                id: 9,
                text: "京剧是中国传统艺术，它融合了哪些艺术形式？",
                options: ["唱、念、做、打", "琴、棋、书、画", "诗、词、曲、赋", "礼、乐、射、御"],
                correct: 0
            },
            {
                id: 10,
                text: "以下哪部作品是列夫·托尔斯泰的著作？",
                options: ["罪与罚", "战争与和平", "人间喜剧", "人性的弱点"],
                correct: 1
            }
        ]
    },
    science: {
        title: "科学常识",
        questions: [
            {
                id: 1,
                text: "以下哪种元素的原子序数最小？",
                options: ["氧", "氮", "碳", "氢"],
                correct: 3
            },
            {
                id: 2,
                text: "光在真空中的传播速度约为多少？",
                options: ["3×10^8 m/s", "3×10^5 m/s", "3×10^6 m/s", "3×10^7 m/s"],
                correct: 0
            },
            {
                id: 3,
                text: "地球绕太阳一周需要多长时间？",
                options: ["365天", "365.25天", "364天", "366天"],
                correct: 1
            },
            {
                id: 4,
                text: "以下哪种物质是绝缘体？",
                options: ["铜", "塑料", "铝", "银"],
                correct: 1
            },
            {
                id: 5,
                text: "人体中最硬的物质是？",
                options: ["骨头", "牙釉质", "指甲", "皮肤"],
                correct: 1
            },
            {
                id: 6,
                text: "DNA的双螺旋结构是由谁发现的？",
                options: ["巴斯德", "门捷列夫", "沃森和克里克", "爱因斯坦"],
                correct: 2
            },
            {
                id: 7,
                text: "物体的质量和重量有什么区别？",
                options: ["没有区别", "质量是物体所含物质的多少，重量是重力作用", "重量是物体所含物质的多少，质量是重力作用", "重量和质量都一样"],
                correct: 1
            },
            {
                id: 8,
                text: "以下哪种能量转换最常见？",
                options: ["化学能→光能", "机械能→化学能", "电能→机械能", "光能→热能"],
                correct: 3
            },
            {
                id: 9,
                text: "细胞核内包含的主要物质是？",
                options: ["蛋白质", "DNA和RNA", "脂肪", "糖类"],
                correct: 1
            },
            {
                id: 10,
                text: "以下哪种物质具有防腐作用？",
                options: ["糖", "盐", "油", "都有"],
                correct: 3
            }
        ]
    },
    geography: {
        title: "地理常识",
        questions: [
            {
                id: 1,
                text: "世界上最大的洲是？",
                options: ["亚洲", "非洲", "北美洲", "南美洲"],
                correct: 0
            },
            {
                id: 2,
                text: "以下哪个国家是海岛国？",
                options: ["英国", "日本", "新西兰", "都是"],
                correct: 3
            },
            {
                id: 3,
                text: "赤道将地球分为？",
                options: ["东西两半球", "南北两半球", "上下两部分", "不分"],
                correct: 1
            },
            {
                id: 4,
                text: "喜马拉雅山脉位于哪两个国家之间？",
                options: ["中国和印度", "中国和尼泊尔", "印度和尼泊尔", "中国、尼泊尔和印度"],
                correct: 3
            },
            {
                id: 5,
                text: "撒哈拉沙漠位于哪个大洲？",
                options: ["亚洲", "非洲", "南美洲", "大洋洲"],
                correct: 1
            },
            {
                id: 6,
                text: "大连位于中国的哪个方向？",
                options: ["东北", "东南", "西北", "西南"],
                correct: 0
            },
            {
                id: 7,
                text: "亚马逊河流经哪个大陆？",
                options: ["非洲", "亚洲", "南美洲", "北美洲"],
                correct: 2
            },
            {
                id: 8,
                text: "以下哪个城市不是中国首都？",
                options: ["北京", "西安", "南京", "都是首都"],
                correct: 3
            },
            {
                id: 9,
                text: "澳大利亚的首都是？",
                options: ["悉尼", "墨尔本", "堪培拉", "布里斯班"],
                correct: 2
            },
            {
                id: 10,
                text: "海拔最高的地方是？",
                options: ["珠穆朗玛峰", "乞力马扎罗山", "勃朗峰", "厄尔布鲁士山"],
                correct: 0
            }
        ]
    },
    code: {
        title: "编程基础",
        questions: [
            {
                id: 1,
                text: "HTML中用来创建段落的标签是？",
                options: ["<para>", "<p>", "<paragraph>", "<text>"],
                correct: 1
            },
            {
                id: 2,
                text: "CSS代表什么？",
                options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Sheets", "Coded Style Sheets"],
                correct: 1
            },
            {
                id: 3,
                text: "JavaScript中定义变量使用哪个关键字？",
                options: ["var、let、const", "variable", "define", "declare"],
                correct: 0
            },
            {
                id: 4,
                text: "以下哪个不是编程语言？",
                options: ["Python", "Java", "HTML", "C++"],
                correct: 2
            },
            {
                id: 5,
                text: "什么是API？",
                options: ["应用程序接口", "高级程序指令", "自动程序集成", "应用编程实例"],
                correct: 0
            },
            {
                id: 6,
                text: "Git的主要用途是？",
                options: ["编写代码", "版本控制", "编译程序", "管理服务器"],
                correct: 1
            },
            {
                id: 7,
                text: "以下哪个是前端技术？",
                options: ["Node.js", "React", "Python", "都不是"],
                correct: 1
            },
            {
                id: 8,
                text: "什么是JSON？",
                options: ["Java Script Object Nation", "Java Script Object Notation", "Java Standard Object Notation", "JavaScript Official Notation"],
                correct: 1
            },
            {
                id: 9,
                text: "Python中用来重复执行代码的关键字是？",
                options: ["repeat", "loop", "for", "都对"],
                correct: 3
            },
            {
                id: 10,
                text: "什么是响应式设计？",
                options: ["快速响应用户", "使网站在各种设备上都能正常显示", "页面加载快", "安全的设计"],
                correct: 1
            }
        ]
    },
    personality: {
        title: "性格测试",
        questions: [
            {
                id: 1,
                text: "你通常如何度过周末？",
                options: ["宅在家里", "外出冒险", "和朋友聚会", "工作或学习"],
                correct: -1
            },
            {
                id: 2,
                text: "面对困难时，你的反应是？",
                options: ["逃避", "坚持", "寻求帮助", "分析解决"],
                correct: -1
            },
            {
                id: 3,
                text: "你认为自己是什么样的人？",
                options: ["外向热情", "内向温和", "理性分析", "创意十足"],
                correct: -1
            },
            {
                id: 4,
                text: "在团队中，你通常扮演什么角色？",
                options: ["领导者", "执行者", "思考者", "支持者"],
                correct: -1
            },
            {
                id: 5,
                text: "遇到陌生人，你的态度是？",
                options: ["主动交流", "被动接受", "保持距离", "观察他们"],
                correct: -1
            },
            {
                id: 6,
                text: "你的学习风格是？",
                options: ["通过实践学习", "通过听讲学习", "通过阅读学习", "通过讨论学习"],
                correct: -1
            },
            {
                id: 7,
                text: "压力大时，你会？",
                options: ["运动释放", "倾诉宣泄", "冥想静思", "投入工作"],
                correct: -1
            },
            {
                id: 8,
                text: "你对未来的态度是？",
                options: ["乐观期待", "谨慎规划", "随遇而安", "担忧害怕"],
                correct: -1
            },
            {
                id: 9,
                text: "你最重视的是？",
                options: ["成功成就", "家庭关系", "个人兴趣", "社会贡献"],
                correct: -1
            },
            {
                id: 10,
                text: "你的最大优点是？",
                options: ["行动力强", "同理心强", "思维深入", "适应性强"],
                correct: -1
            },
            {
                id: 11,
                text: "处理冲突时，你通常？",
                options: ["直接对抗", "委婉协商", "避免冲突", "寻求妥协"],
                correct: -1
            },
            {
                id: 12,
                text: "你的理想生活是？",
                options: ["充满冒险", "稳定舒适", "自由创意", "帮助他人"],
                correct: -1
            }
        ]
    }
};

// 初始化测验
document.addEventListener('DOMContentLoaded', () => {
    // 设置分类卡片点击事件
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', startQuiz);
    });
});

// 开始测验
function startQuiz(e) {
    const category = e.currentTarget.dataset.category;
    currentCategory = category;
    selectedAnswers = {};
    
    const quiz = quizDatabase[category];
    if (!quiz) return;
    
    // 隐藏分类选择，显示测验容器
    document.querySelector('.quiz-category-section').style.display = 'none';
    document.getElementById('quizContainer').classList.remove('hidden');
    
    // 渲染题目
    renderQuestions(quiz.questions);
    
    // 设置提交按钮
    document.getElementById('submitBtn').addEventListener('click', () => {
        submitQuiz(quiz.questions.length);
    });
}

// 渲染题目
function renderQuestions(questions) {
    const quizContainer = document.getElementById('quiz');
    quizContainer.innerHTML = questions.map((q, index) => `
        <div class="question" data-index="${index}">
            <h3>${index + 1}. ${q.text}</h3>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <button class="option" data-option="${optIndex}">
                        <span class="option-text">${option}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // 添加选项点击事件
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function() {
            const questionDiv = this.closest('.question');
            const questionIndex = questionDiv.dataset.index;
            const optionIndex = this.dataset.option;
            
            // 移除同题其他选项的选中状态
            questionDiv.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // 添加选中状态
            this.classList.add('selected');
            selectedAnswers[questionIndex] = optionIndex;
            
            // 更新进度条
            updateProgressBar(questions.length);
        });
    });
}

// 更新进度条
function updateProgressBar(total) {
    const answered = Object.keys(selectedAnswers).length;
    const percentage = (answered / total) * 100;
    document.getElementById('progressBar').style.width = percentage + '%';
}

// 提交测验
function submitQuiz(totalQuestions) {
    const quiz = quizDatabase[currentCategory];
    let score = 0;
    
    // 如果是性格测试，不计分
    if (currentCategory === 'personality') {
        showPersonalityResult();
    } else {
        // 计算分数
        quiz.questions.forEach((q, index) => {
            const selectedIndex = selectedAnswers[index];
            if (selectedIndex !== undefined && parseInt(selectedIndex) === q.correct) {
                score++;
            }
        });
        
        showResult(score, totalQuestions);
    }
}

// 显示结果
function showResult(score, total) {
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('result').classList.remove('hidden');
    
    const percentage = Math.round((score / total) * 100);
    const angle = (score / total) * 360;
    
    document.getElementById('scoreText').textContent = `${score}/${total}`;
    document.querySelector('.score-circle').style.setProperty('--score-angle', `${angle}deg`);
    
    let title, message;
    if (percentage >= 90) {
        title = "🎉 优秀！你表现得很棒！";
        message = `你的正确率为${percentage}%。你对这个领域的知识掌握得非常扎实！继续保持这种学习热情。`;
    } else if (percentage >= 80) {
        title = "👍 很好！再接再厉！";
        message = `你的正确率为${percentage}%。你的知识基础不错，还有一些需要加强的地方。`;
    } else if (percentage >= 70) {
        title = "🙂 及格！还可以更好！";
        message = `你的正确率为${percentage}%。基础知识掌握得还不够扎实，建议多看相关资料。`;
    } else if (percentage >= 60) {
        title = "🤔 需要努力！";
        message = `你的正确率为${percentage}%。这个领域的知识还需要进一步学习和巩固。`;
    } else {
        title = "😅 加油吧！";
        message = `你的正确率为${percentage}%。建议从基础知识开始系统学习。`;
    }
    
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultMessage').textContent = message;
}

// 显示性格测试结果（简单版本）
function showPersonalityResult() {
    document.getElementById('quizContainer').classList.add('hidden');
    document.getElementById('result').classList.remove('hidden');
    
    document.querySelector('.score-circle').style.display = 'none';
    document.getElementById('resultTitle').textContent = "性格分析完成！";
    document.getElementById('resultMessage').textContent = "根据你的选择，你是一个独特而有趣的个体。每个人都有自己独特的性格特征，重要的是认识自己、接纳自己。祝你未来一切顺利！";
}
