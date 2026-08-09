import type { Lesson } from '../types'

const includes = (...parts: string[]) => (code: string) => parts.every((part) => code.toLowerCase().includes(part.toLowerCase()))
const matches = (pattern: RegExp) => (code: string) => pattern.test(code)

export const ROADMAP = [
  { name: '网页起步', detail: 'HTML、CSS、移动端，共 11 课', weeks: '第 1–2 周', status: 'available' },
  { name: 'JavaScript 入门', detail: '逻辑、DOM、小项目，共 9 课', weeks: '第 3–4 周', status: 'available' },
  { name: '开发工具', detail: 'Git、调试、部署', weeks: '第 5–8 周', status: 'planned' },
  { name: 'React 前端', detail: '组件、状态、TypeScript', weeks: '第 9–16 周', status: 'planned' },
  { name: '数据与登录', detail: 'SQL、Supabase、权限', weeks: '第 17–24 周', status: 'planned' },
  { name: '后端入门', detail: 'Node.js、接口、验证', weeks: '第 25–36 周', status: 'planned' },
  { name: '毕业项目', detail: '独立重做个人网站', weeks: '第 37–48 周', status: 'planned' },
] as const

export const LESSONS: Lesson[] = [
  {
    id: 'html-01', stage: '网页起步', day: 1, minutes: 20,
    eyebrow: '第一步 · HTML', title: '网页到底是什么？',
    objective: '亲手写出标题和一段文字，并在右侧看到它变成网页。',
    explanation: [
      '网页不是图片。浏览器会读取一份叫 HTML 的文字说明，然后把它画在屏幕上。',
      'HTML 用“标签”说明内容是什么。<h1> 是最重要的标题，<p> 是普通段落。标签通常一前一后，中间放内容。',
    ],
    remember: 'HTML 负责说明“这是什么”，不是说明“它长什么样”。',
    starter: `<h1>把这里改成你的名字</h1>\n<p>这是我做的第一个网页。</p>`,
    hint: '把 h1 标签中间的文字改成你自己的名字。',
    checks: [
      { label: '有一个一级标题', test: matches(/<h1>.+<\/h1>/is) },
      { label: '有一个段落', test: matches(/<p>.+<\/p>/is) },
      { label: '已经替换示例文字', test: (code) => !code.includes('把这里改成你的名字') },
    ],
  },
  {
    id: 'html-02', stage: '网页起步', day: 2, minutes: 20,
    eyebrow: '内容结构 · HTML', title: '给网页排出清楚的层级',
    objective: '使用标题、段落和强调标签，做一张个人介绍。',
    explanation: [
      '一篇文章需要大标题和小标题，网页也一样。h1 一页通常只有一个，h2 用来分区，p 放正文。',
      '<strong> 表示这段文字很重要。好的结构让人和搜索引擎都能更快读懂。',
    ],
    remember: '不要为了字号选择标题标签；先看内容层级，再决定 h1 或 h2。',
    starter: `<h1>我的介绍</h1>\n<h2>我正在学习</h2>\n<p>我每天学习 <strong>20 分钟</strong>。</p>`,
    hint: '再增加一个 h2 和一个 p，写你的学习目标。',
    checks: [
      { label: '只有一个 h1', test: (code) => (code.match(/<h1/gi) || []).length === 1 },
      { label: '至少两个 h2', test: (code) => (code.match(/<h2/gi) || []).length >= 2 },
      { label: '至少两个段落', test: (code) => (code.match(/<p/gi) || []).length >= 2 },
    ],
  },
  {
    id: 'html-03', stage: '网页起步', day: 3, minutes: 20,
    eyebrow: '链接与图片 · HTML', title: '让网页通向别的地方',
    objective: '加入一个可以点击的链接和一张带说明的图片。',
    explanation: [
      '<a href="地址">文字</a> 会创建链接。href 是链接要去的地址。',
      '<img> 不需要闭合标签。src 是图片地址，alt 是图片看不到时的文字说明，也能帮助使用读屏软件的人。',
    ],
    remember: '每张有意义的图片都要有准确的 alt，不能只写“图片”。',
    starter: `<h1>我的收藏</h1>\n<a href="https://developer.mozilla.org/zh-CN/">打开 MDN 学习网站</a>\n<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600" alt="桌面上的笔记本电脑">`,
    hint: '给链接增加 target="_blank"，让它在新页面打开。',
    checks: [
      { label: '链接有真实地址', test: matches(/<a[^>]+href=["']https?:\/\//i) },
      { label: '链接在新页面打开', test: matches(/target=["']_blank["']/i) },
      { label: '图片有内容明确的 alt', test: matches(/<img[^>]+alt=["'][^"']{4,}["']/i) },
    ],
  },
  {
    id: 'html-04', stage: '网页起步', day: 4, minutes: 20,
    eyebrow: '清单 · HTML', title: '把信息变成真正的列表',
    objective: '制作一份有顺序的学习计划。',
    explanation: [
      '<ul> 是没有先后顺序的列表，<ol> 是从 1 开始的有序列表。每一项都放在 <li> 中。',
      '不要手工输入“1、2、3”冒充列表；真正的列表更容易调整，也更利于无障碍阅读。',
    ],
    remember: '有步骤用 ol，只是罗列用 ul。',
    starter: `<h1>今天的学习步骤</h1>\n<ol>\n  <li>打开课程</li>\n  <li>阅读讲解</li>\n</ol>`,
    hint: '在 ol 里面增加第三个 li：完成练习。',
    checks: [
      { label: '使用有序列表', test: includes('<ol>', '</ol>') },
      { label: '至少三个步骤', test: (code) => (code.match(/<li/gi) || []).length >= 3 },
      { label: '包含完成练习', test: includes('完成练习') },
    ],
  },
  {
    id: 'html-05', stage: '网页起步', day: 5, minutes: 20,
    eyebrow: '表单 · HTML', title: '让用户可以输入内容',
    objective: '制作一个带文字框和按钮的小表单。',
    explanation: [
      '<label> 告诉用户输入框要填什么，<input> 接收较短的内容，<button> 触发操作。',
      'label 的 for 要和 input 的 id 相同。这样点击文字也能选中输入框。',
    ],
    remember: '输入框的 placeholder 只是例子，不能替代 label。',
    starter: `<h1>加入学习计划</h1>\n<label for="goal">今天想学什么？</label>\n<input id="goal" type="text" placeholder="例如：学习 HTML">\n<button>保存计划</button>`,
    hint: '再添加一个 label 和 type="number" 的输入框，询问学习分钟数。',
    checks: [
      { label: '有两个 label', test: (code) => (code.match(/<label/gi) || []).length >= 2 },
      { label: '有数字输入框', test: matches(/<input[^>]+type=["']number["']/i) },
      { label: '按钮文字说明动作', test: matches(/<button[^>]*>[^<]{2,}<\/button>/i) },
    ],
  },
  {
    id: 'css-01', stage: '网页起步', day: 6, minutes: 20,
    eyebrow: '第一次上色 · CSS', title: 'CSS 负责网页的样子',
    objective: '改变页面背景、标题颜色和文字大小。',
    explanation: [
      'CSS 的基本句式是“选择谁 { 改什么: 改成什么; }”。例如 h1 { color: blue; }。',
      '选择器 h1 会找到所有 h1。color 改文字颜色，background 改背景，font-size 改字号。',
    ],
    remember: '属性和值之间用冒号，每条规则后面用分号。',
    starter: `<style>\nbody { background: #f3f6fb; }\nh1 { color: #275df5; }\n</style>\n<h1>我的蓝色标题</h1>\n<p>请把这段文字改成 18px。</p>`,
    hint: '在 style 中写 p { font-size: 18px; }。',
    checks: [
      { label: '给段落设置字号', test: matches(/p\s*\{[^}]*font-size\s*:\s*18px/is) },
      { label: '保留页面背景', test: matches(/body\s*\{[^}]*background/is) },
      { label: '保留标题颜色', test: matches(/h1\s*\{[^}]*color/is) },
    ],
  },
  {
    id: 'css-02', stage: '网页起步', day: 7, minutes: 20,
    eyebrow: '精准选择 · CSS', title: '用 class 只修改一部分内容',
    objective: '理解标签选择器和 class 选择器的区别。',
    explanation: [
      'p 会选中所有段落；.important 只选中 class="important" 的元素。class 前面的点不能漏。',
      '同一个 class 可以重复使用，因此适合“重点”“卡片”“按钮”这类共同样式。',
    ],
    remember: 'HTML 写 class="名字"，CSS 写 .名字。',
    starter: `<style>\np { color: #667085; }\n.important { color: #d94c5c; }\n</style>\n<p>普通说明</p>\n<p class="important">今天一定完成练习</p>`,
    hint: '给 important 增加 font-weight: 700，让重点变粗。',
    checks: [
      { label: '使用 important 类', test: includes('class="important"', '.important') },
      { label: '重点文字加粗', test: matches(/\.important\s*\{[^}]*font-weight\s*:\s*(700|bold)/is) },
      { label: '普通段落样式仍在', test: matches(/p\s*\{[^}]*color/is) },
    ],
  },
  {
    id: 'css-03', stage: '网页起步', day: 8, minutes: 20,
    eyebrow: '盒模型 · CSS', title: '给内容留出呼吸空间',
    objective: '用 padding、border 和 margin 做一张卡片。',
    explanation: [
      '网页上的每个元素都像一个盒子：内容外面是 padding，再外面是 border，盒子与盒子之间是 margin。',
      'padding 是卡片内部的空间，margin 是卡片外部的距离。两者最容易混淆。',
    ],
    remember: '先调 padding 让卡片内部舒服，再用 margin 拉开卡片之间的距离。',
    starter: `<style>\n.card {\n  background: white;\n  padding: 16px;\n}\n</style>\n<div class="card">\n  <h2>今日课程</h2>\n  <p>CSS 盒模型</p>\n</div>`,
    hint: '给 card 添加 1px 实线边框、12px 圆角和 16px 外边距。',
    checks: [
      { label: '卡片有边框', test: matches(/\.card\s*\{[^}]*border\s*:/is) },
      { label: '卡片有圆角', test: matches(/\.card\s*\{[^}]*border-radius\s*:\s*12px/is) },
      { label: '卡片有外边距', test: matches(/\.card\s*\{[^}]*margin\s*:\s*16px/is) },
    ],
  },
  {
    id: 'css-04', stage: '网页起步', day: 9, minutes: 20,
    eyebrow: '横向排列 · CSS', title: '第一次使用 Flexbox',
    objective: '让标题和按钮排在同一行，并垂直居中。',
    explanation: [
      'display: flex 会让一个容器里的孩子从上到下改为从左到右排列。',
      'justify-content 控制横向分布，align-items 控制另一方向的对齐。space-between 会把两端内容推开。',
    ],
    remember: 'Flexbox 写在父元素上，改变的是孩子的排列方式。',
    starter: `<style>\n.toolbar {\n  display: flex;\n}\nbutton { padding: 8px 12px; }\n</style>\n<div class="toolbar">\n  <h2>今日任务</h2>\n  <button>添加</button>\n</div>`,
    hint: '在 toolbar 中加入 justify-content: space-between 和 align-items: center。',
    checks: [
      { label: '启用 Flexbox', test: matches(/\.toolbar\s*\{[^}]*display\s*:\s*flex/is) },
      { label: '两端对齐', test: matches(/justify-content\s*:\s*space-between/i) },
      { label: '垂直居中', test: matches(/align-items\s*:\s*center/i) },
    ],
  },
  {
    id: 'css-05', stage: '网页起步', day: 10, minutes: 20,
    eyebrow: '手机适配 · CSS', title: '让卡片自动换列',
    objective: '使用 Grid 和媒体查询做响应式布局。',
    explanation: [
      'CSS Grid 擅长二维布局。grid-template-columns 可以决定一行有几列。',
      '@media 会在满足屏幕条件时应用另一组规则。移动端优先时，先写一列，再在大屏幕改成两列。',
    ],
    remember: '响应式不是把电脑页面缩小，而是根据屏幕重新安排内容。',
    starter: `<style>\n.grid { display: grid; gap: 12px; grid-template-columns: 1fr; }\n.card { padding: 16px; background: #eef3ff; }\n</style>\n<div class="grid">\n  <div class="card">代码学习</div>\n  <div class="card">基金</div>\n  <div class="card">收支</div>\n</div>`,
    hint: '增加 @media (min-width: 700px)，把 grid 改为 repeat(3, 1fr)。',
    checks: [
      { label: '使用媒体查询', test: includes('@media', 'min-width') },
      { label: '大屏显示三列', test: matches(/repeat\(3\s*,\s*1fr\)/i) },
      { label: '保留移动端一列', test: matches(/grid-template-columns\s*:\s*1fr/i) },
    ],
  },
  {
    id: 'project-01', stage: '网页起步', day: 11, minutes: 20,
    eyebrow: '小项目 · 综合练习', title: '做一张个人学习名片',
    objective: '把前十课组合起来，完成第一件可以分享的作品。',
    explanation: [
      '真正学会不是看懂，而是能把多个小知识组合起来。今天不增加新概念，只完成一个小作品。',
      '名片需要清楚的标题、学习目标、三项计划和一个链接，并且在手机上阅读舒服。',
    ],
    remember: '先完成结构，再调整样式；不要同时解决所有问题。',
    starter: `<style>\n.card { max-width: 360px; margin: 24px auto; padding: 20px; }\n</style>\n<main class="card">\n  <h1>我的学习名片</h1>\n  <!-- 在这里补全内容 -->\n</main>`,
    hint: '加入一段自我介绍、包含三个 li 的列表、一个链接，再给卡片加背景和圆角。',
    checks: [
      { label: '有自我介绍段落', test: matches(/<p>.+<\/p>/is) },
      { label: '有三项计划', test: (code) => (code.match(/<li/gi) || []).length >= 3 },
      { label: '有可点击链接', test: matches(/<a[^>]+href=/i) },
      { label: '卡片有背景和圆角', test: (code) => includes('background', 'border-radius')(code) },
    ],
  },
  {
    id: 'js-01', stage: 'JavaScript', day: 12, minutes: 20,
    eyebrow: '程序起步 · JavaScript', title: '让网页记住一个值',
    objective: '创建变量并把结果显示在页面上。',
    explanation: [
      '变量是有名字的数据盒子。const 表示这个盒子的指向不再改变，let 表示之后还会重新赋值。',
      '字符串要放在引号里，数字不用。等号在程序里表示“把右边存到左边”。',
    ],
    remember: '默认先用 const，确定需要重新赋值时再用 let。',
    starter: `<h1 id="result">等待结果</h1>\n<script>\nconst minutes = 20;\nconst topic = "JavaScript";\ndocument.getElementById("result").textContent = topic + "，今天学习 " + minutes + " 分钟";\n</script>`,
    hint: '增加 const days = 5，并把“一周 5 天”显示在结果中。',
    checks: [
      { label: '创建 days 变量', test: matches(/const\s+days\s*=\s*5/) },
      { label: '结果使用 days', test: matches(/textContent[\s\S]*days/) },
      { label: '保留 DOM 更新', test: includes('getElementById', 'textContent') },
    ],
  },
  {
    id: 'js-02', stage: 'JavaScript', day: 13, minutes: 20,
    eyebrow: '数据类型 · JavaScript', title: '文字、数字和真假',
    objective: '认识三种最常见的数据，并完成一次计算。',
    explanation: [
      '"20" 是字符串，20 是数字，两者看起来相似但用途不同。true 和 false 是布尔值，适合表示完成或未完成。',
      '数字可以直接做加减乘除。字符串用 + 会拼接在一起。',
    ],
    remember: '用户在输入框里输入的内容默认是字符串，计算前经常需要 Number()。',
    starter: `<p id="result"></p>\n<script>\nconst dailyMinutes = 20;\nconst days = 5;\nconst completed = true;\nconst total = dailyMinutes * days;\ndocument.getElementById("result").textContent = "本周学习 " + total + " 分钟";\n</script>`,
    hint: '增加 const hours = total / 60，并把小时数也显示出来。',
    checks: [
      { label: '计算小时数', test: matches(/const\s+hours\s*=\s*total\s*\/\s*60/) },
      { label: '页面使用 hours', test: matches(/textContent[\s\S]*hours/) },
      { label: '保留布尔值', test: matches(/completed\s*=\s*true/) },
    ],
  },
  {
    id: 'js-03', stage: 'JavaScript', day: 14, minutes: 20,
    eyebrow: '判断 · JavaScript', title: '如果完成，就给出不同反馈',
    objective: '使用 if / else 根据条件改变文字。',
    explanation: [
      'if 会先检查括号里的条件。条件为 true 时执行第一段，否则执行 else。',
      '=== 用来判断两边是否严格相等，不要把它和赋值用的 = 混淆。',
    ],
    remember: '= 是存进去，=== 是问两边是否相等。',
    starter: `<p id="message"></p>\n<script>\nconst minutes = 12;\nlet message = "";\nif (minutes >= 20) {\n  message = "今日目标已完成";\n} else {\n  message = "还差一点，继续加油";\n}\ndocument.getElementById("message").textContent = message;\n</script>`,
    hint: '把 else 中的文字改成动态显示“还差 8 分钟”，要用 20 - minutes。',
    checks: [
      { label: '保留 if / else', test: (code) => includes('if (', 'else')(code) },
      { label: '计算剩余分钟', test: matches(/20\s*-\s*minutes/) },
      { label: '页面显示计算结果', test: matches(/message\s*=[^;]*(20\s*-\s*minutes|minutes)/s) },
    ],
  },
  {
    id: 'js-04', stage: 'JavaScript', day: 15, minutes: 20,
    eyebrow: '重复工作 · JavaScript', title: '用循环生成学习记录',
    objective: '使用 for 循环生成五条记录。',
    explanation: [
      '循环适合处理重复工作。for 的三部分分别是起点、继续条件和每轮后的变化。',
      'i += 1 表示每一轮让 i 增加 1。循环必须有停止条件，否则网页会卡住。',
    ],
    remember: '循环前先用一句中文说清楚：从几开始，到几结束，每次变多少。',
    starter: `<ul id="days"></ul>\n<script>\nlet html = "";\nfor (let day = 1; day <= 3; day += 1) {\n  html += "<li>第 " + day + " 天</li>";\n}\ndocument.getElementById("days").innerHTML = html;\n</script>`,
    hint: '把循环终点从 3 改为 5，并在每项后加入“学习20分钟”。',
    checks: [
      { label: '循环五次', test: matches(/day\s*<=\s*5/) },
      { label: '每项显示20分钟', test: includes('学习20分钟') },
      { label: '生成 li', test: includes('<li>') },
    ],
  },
  {
    id: 'js-05', stage: 'JavaScript', day: 16, minutes: 20,
    eyebrow: '数据集合 · JavaScript', title: '用数组保存多条数据',
    objective: '创建数组，并把数组中的内容显示成列表。',
    explanation: [
      '数组是一组有顺序的数据，用方括号表示。第一个元素的位置是 0，而不是 1。',
      'forEach 会让数组中的每个元素依次执行一段操作，适合生成列表。',
    ],
    remember: '数组的长度是 length，最后一个元素的位置是 length - 1。',
    starter: `<ul id="topics"></ul>\n<script>\nconst topics = ["HTML", "CSS", "JavaScript"];\nlet html = "";\ntopics.forEach(function(topic) {\n  html += "<li>" + topic + "</li>";\n});\ndocument.getElementById("topics").innerHTML = html;\n</script>`,
    hint: '使用 push 给 topics 增加“React”，再运行查看结果。',
    checks: [
      { label: '使用 push', test: matches(/topics\.push\(/) },
      { label: '加入 React', test: includes('React') },
      { label: '使用 forEach', test: includes('.forEach') },
    ],
  },
  {
    id: 'js-06', stage: 'JavaScript', day: 17, minutes: 20,
    eyebrow: '可复用代码 · JavaScript', title: '把计算装进函数',
    objective: '创建带参数和返回值的函数。',
    explanation: [
      '函数是一台小机器：参数是放进去的原料，return 是机器产出的结果。',
      '把重复计算写成函数后，可以用不同输入反复调用，也更容易单独检查错误。',
    ],
    remember: '一个小函数最好只做一件明确的事。',
    starter: `<p id="result"></p>\n<script>\nfunction weeklyMinutes(daily, days) {\n  return daily * days;\n}\nconst result = weeklyMinutes(20, 5);\ndocument.getElementById("result").textContent = result + " 分钟";\n</script>`,
    hint: '增加 minutesToHours(minutes) 函数，返回 minutes / 60，并显示小时数。',
    checks: [
      { label: '创建 minutesToHours', test: matches(/function\s+minutesToHours\s*\(/) },
      { label: '函数返回除以60', test: matches(/return\s+\w+\s*\/\s*60/) },
      { label: '调用新函数', test: matches(/minutesToHours\s*\([^)]/) },
    ],
  },
  {
    id: 'js-07', stage: 'JavaScript', day: 18, minutes: 20,
    eyebrow: '页面互动 · DOM', title: '点击按钮后改变页面',
    objective: '给按钮绑定点击事件。',
    explanation: [
      'DOM 是浏览器提供的网页对象。getElementById 可以通过 id 找到一个元素。',
      'addEventListener 监听用户动作。点击发生时，函数里的代码才会执行。',
    ],
    remember: '先找到元素，再监听事件，最后改变页面。',
    starter: `<p id="count">0</p>\n<button id="add">完成一次练习</button>\n<script>\nlet count = 0;\nconst button = document.getElementById("add");\nbutton.addEventListener("click", function() {\n  count += 1;\n  document.getElementById("count").textContent = count;\n});\n</script>`,
    hint: '增加一个 id="reset" 的清零按钮，点击后把 count 设为 0。',
    checks: [
      { label: '增加清零按钮', test: matches(/<button[^>]+id=["']reset["']/i) },
      { label: '监听清零点击', test: matches(/getElementById\(["']reset["']\)[\s\S]*addEventListener/s) },
      { label: '把 count 设为0', test: matches(/count\s*=\s*0/) },
    ],
  },
  {
    id: 'js-08', stage: 'JavaScript', day: 19, minutes: 20,
    eyebrow: '读取输入 · DOM', title: '把表单内容显示出来',
    objective: '读取输入框 value，并加入页面列表。',
    explanation: [
      '输入框当前的内容保存在 value 属性里。点击保存时再读取，才能拿到用户刚输入的文字。',
      '使用 trim() 可以去掉首尾空格。空内容应该被拦截，而不是生成一条空记录。',
    ],
    remember: '读取输入用 value，改变普通元素文字用 textContent。',
    starter: `<input id="task" placeholder="输入学习任务">\n<button id="save">保存</button>\n<ul id="list"></ul>\n<script>\ndocument.getElementById("save").addEventListener("click", function() {\n  const value = document.getElementById("task").value.trim();\n  if (value === "") return;\n  document.getElementById("list").innerHTML += "<li>" + value + "</li>";\n});\n</script>`,
    hint: '保存成功后把输入框清空：把它的 value 设为 ""。',
    checks: [
      { label: '读取输入内容', test: includes('.value', '.trim()') },
      { label: '拦截空内容', test: matches(/if\s*\([^)]*===\s*["']["']/) },
      { label: '保存后清空输入框', test: matches(/getElementById\(["']task["']\)\.value\s*=\s*["']["']/) },
    ],
  },
  {
    id: 'project-02', stage: 'JavaScript', day: 20, minutes: 20,
    eyebrow: '小项目 · 综合练习', title: '做一个能用的学习清单',
    objective: '完成添加任务、标记完成和统计数量。',
    explanation: [
      '这次练习会把变量、数组、函数、判断、循环和点击事件串起来。它已经是一个真正的小应用。',
      '先让添加功能工作，再做完成状态，最后显示统计。每次只验证一个小步骤。',
    ],
    remember: '复杂功能不是一次写完的，而是把多个能验证的小步骤连接起来。',
    starter: `<style>\n.done { text-decoration: line-through; color: #778; }\n</style>\n<input id="task" placeholder="输入任务">\n<button id="add">添加</button>\n<p id="summary">共 0 项</p>\n<ul id="list"></ul>\n<script>\nconst tasks = [];\nfunction render() {\n  let html = "";\n  tasks.forEach(function(task, index) {\n    html += "<li data-index='" + index + "'>" + task + "</li>";\n  });\n  document.getElementById("list").innerHTML = html;\n  document.getElementById("summary").textContent = "共 " + tasks.length + " 项";\n}\ndocument.getElementById("add").addEventListener("click", function() {\n  const value = document.getElementById("task").value.trim();\n  if (!value) return;\n  tasks.push(value);\n  render();\n});\n</script>`,
    hint: '给 list 监听点击；如果点到 LI，就用 classList.toggle("done") 切换完成样式。',
    checks: [
      { label: '监听列表点击', test: matches(/getElementById\(["']list["']\)[\s\S]*addEventListener\(["']click["']/s) },
      { label: '确认点击的是 LI', test: matches(/tagName\s*===?\s*["']LI["']/i) },
      { label: '切换 done 样式', test: matches(/classList\.toggle\(["']done["']\)/) },
      { label: '保留任务统计', test: includes('tasks.length') },
    ],
  },
]

export function nextLesson(progress: { lessonId: string; completed: boolean }[]) {
  const completed = new Set(progress.filter((item) => item.completed).map((item) => item.lessonId))
  return LESSONS.find((lesson) => !completed.has(lesson.id)) || LESSONS[LESSONS.length - 1]
}
