# 工作台 UI 开源项目调研

> 调研快照：2026-08-09。星标、版本和活跃度会变化，下面只用于本次产品决策。

## 结论先说

这套工作台不应该照搬任何一个项目。最合适的组合是：

1. 用 [Actual Budget](https://github.com/actualbudget/actual) 的“数据状态清楚、离线也能用”思路组织基金和收支；
2. 用 [freeCodeCamp](https://github.com/freeCodeCamp/freeCodeCamp) 的“讲解 → 动手 → 自动检查 → 完成”闭环组织代码学习；
3. 用 [Homepage](https://github.com/gethomepage/homepage) 的统一模块契约和紧凑信息层级组织首页；
4. 只参考 [Maybe Finance](https://github.com/maybe-finance/maybe) 的减法和数字层级，不复用其代码与依赖。

## 筛选结果

| 项目 | 架构与主要依赖 | 活跃度快照 | 值得复用 | 主要坑点 | 本项目决策 |
| --- | --- | --- | --- | --- | --- |
| Actual Budget | TypeScript/Yarn 工作区；浏览器、服务端、桌面端与移动端多目标；React、Electron、SQLite、本地优先同步；测试含 Vitest、Playwright、Storybook/VRT。详见[根 package.json](https://github.com/actualbudget/actual/blob/master/package.json)。 | 约 26.7k stars；2026-05 仍有版本发布；维护活跃。 | 本地先写、联网再同步；明确“已同步/等待联网”；金额和来源状态比装饰更重要。 | monorepo、SQLite、原生依赖、Electron 和自建同步服务对本工作台过重。 | 复用信息架构与状态表达，不引入其同步栈。 |
| freeCodeCamp | TypeScript/pnpm/Turborepo；课程、客户端、API 分包；Playwright 与完整挑战编辑工具。详见[根 package.json](https://github.com/freeCodeCamp/freeCodeCamp/blob/main/package.json)。 | 超过 45 万 stars；2026-08 仍持续提交；超大型社区。 | 每课都必须有解释、可编辑练习、即时预览、自动检查和明确完成状态。 | 体量巨大；课程内容与平台机制不能直接复制；一次展示太多路线会压垮零基础用户。 | 只复用教学流程，每天固定 20 分钟、一次只学一课。 |
| Homepage | Next.js/React；YAML 驱动的小组件；SWR、Recharts、Tailwind；大量服务集成。详见[根 package.json](https://github.com/gethomepage/homepage/blob/dev/package.json)。 | 约 30.4k stars；2026-05 仍有版本发布；维护活跃。 | 模块采用相同入口结构：图标、标题、关键值、状态；首页快速扫读。 | 默认没有认证层；大量代理接口和 Docker/自托管依赖不适合 GitHub Pages。 | 复用统一模块外观，不复制服务端代理与集成依赖。 |
| Maybe Finance | Rails/PostgreSQL/Redis；Turbo/Stimulus、ViewComponent、Tailwind、Sidekiq、Plaid、Stripe。详见[Gemfile](https://github.com/maybe-finance/maybe/blob/main/Gemfile)。 | 约 54k stars，但项目于 2025-07-27 归档；不再活跃。 | 首页先回答“有多少钱、收支是否平衡、钱花在哪”，减少无用图表。 | 已归档；AGPL；商标限制；Rails 与银行聚合链路过重，且维护者明确提到第三方银行数据不稳定、缓存一致性困难。 | 只取视觉减法，不复制代码、品牌或技术方案。 |

## 这次落地的设计规则

- 手机首屏只保留一个主动作：继续今天的 20 分钟代码课。
- 代码、基金、收支用同一组“关键值入口”，不再各自套一张厚重卡片。
- 任务、复盘、备忘、英语、AI 新闻、数据全部保留一级可见入口，使用六宫格，不用横向滚动隐藏。
- 金额统一使用等宽数字；真实基金数据继续显示来源和更新时间。
- 代码练习在手机上切换“写代码 / 看结果”，避免两个 280px 高面板连续堆叠。
- 不新增 UI 框架、图表库和远程字体，保持 PWA 体积与离线可用性。

## 设计边界

- GitHub Pages 只承载静态前端；认证和个人数据继续交给 Supabase。
- 真实基金与 AI 新闻仍通过现有数据接口获取，UI 优化不伪造示例数据。
- 不把第三方开源项目的课程文本、品牌资产或受限代码复制到本项目。
