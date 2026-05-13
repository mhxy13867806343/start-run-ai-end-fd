# start-run-ai-end-fd

一个基于原生 `HTML + CSS + JavaScript + jQuery` 的多页面静态作品站。

当前包含这些页面：

- `index.html`：首页
- `about.html`：关于
- `works.html`：作品
- `links.html`：链接
- `navigation.html`：第三方导航
- `contact.html`：联系
- `archive.html`：归档
- `guestbook.html`：留言板
- `github-callback.html`：GitHub OAuth 回调页

## 本地访问

如果你本地已经起了静态服务，默认可以这样访问：

- `http://127.0.0.1:4173/index.html`
- `http://127.0.0.1:4173/guestbook.html`
- `http://127.0.0.1:4173/github-callback.html`

## GitHub Pages 部署

当前仓库地址：

- `https://github.com/mhxy13867806343/start-run-ai-end-fd`

线上站点地址应为：

- `https://mhxy13867806343.github.io/start-run-ai-end-fd/`

如果打开上面的线上地址还是 `404`，通常不是代码路径错了，而是 **GitHub Pages 还没有启用**。

### 开启方式

进入仓库后台：

1. `Settings`
2. `Pages`
3. `Build and deployment`
4. `Source` 选择 `Deploy from a branch`
5. 分支选择 `main`
6. 文件夹选择 `/ (root)`
7. 保存

保存后等 GitHub Pages 发布完成，再访问：

- `https://mhxy13867806343.github.io/start-run-ai-end-fd/`

## GitHub OAuth 配置

留言板使用的是纯前端 `GitHub Authorization Code + PKCE` 方案。

前端配置文件：

- `static/js/github-config.js`

当前已填写：

- `clientId: 0v23lixaPD32110Wqvp9`

### Homepage URL

建议填：

- `https://mhxy13867806343.github.io/start-run-ai-end-fd/`

也可以填：

- `https://mhxy13867806343.github.io/start-run-ai-end-fd/index.html`

### Authorization callback URL

必须填回调页，不要填首页：

- `https://mhxy13867806343.github.io/start-run-ai-end-fd/github-callback.html`

本地调试时对应：

- `http://127.0.0.1:4173/github-callback.html`

## 重要说明

- 不要把 `client_secret` 放到前端代码里
- 当前留言板的留言数据保存在浏览器 `localStorage`
- 如果 GitHub 浏览器端换 token 遇到 `CORS`，需要改成后端中转
