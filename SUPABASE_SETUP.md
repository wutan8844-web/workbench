# Supabase 免费版连接说明

这个项目只把可公开的 `VITE_SUPABASE_URL` 和 Publishable Key 放进前端。Secret Key / Service Role Key 不能提交到 GitHub。

## 1. 创建项目和数据表

1. 在 Supabase 新建免费项目。
2. 打开 SQL Editor。
3. 运行 `supabase/migrations/202608090001_initial.sql` 的全部内容。
4. 确认七张个人数据表都显示 RLS 已启用。

## 2. 配置邮箱验证码

在 Authentication → Email Templates → Magic Link 中使用 `{{ .Token }}` 显示 6 位验证码。示例正文：

```html
<h2>进度本登录验证码</h2>
<p>你的验证码是：</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px">{{ .Token }}</p>
<p>验证码仅用于本次登录，请勿转发。</p>
```

在 Authentication → URL Configuration 中：

- Site URL 填最终的 GitHub Pages 地址。
- Redirect URLs 同时加入本地 `http://localhost:5173/**` 和 GitHub Pages 地址。

登录会话默认持久保存并自动续期，正常使用不需要每天重新登录。

## 3. 部署真实数据函数

用 Supabase CLI 登录并连接项目后运行：

```bash
supabase functions deploy market-data --no-verify-jwt
supabase functions deploy news-feed --no-verify-jwt
```

基金函数读取天天基金公开的最新正式净值与单日涨跌；页面不使用已经失效的旧盘中估算接口。新闻函数聚合 OpenAI、Google DeepMind、Hugging Face 和 arXiv 的公开 RSS/Atom 内容。

## 4. 本地连接

复制 `.env.example` 为 `.env.local`，填写：

```text
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## 5. GitHub Pages 连接

进入仓库 Settings → Secrets and variables → Actions → Variables，添加：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

再到 Settings → Pages，把 Source 设为 GitHub Actions。推送到 `main` 后会自动构建公开地址。
