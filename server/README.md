# 月球探险家：知乎登录与账号云存档

更新于 2026-09-30。本版采用 3Dschool 已跑通的知乎 OAuth 接口契约，App ID **849**，回调 **https://moon.chipai.cc/zhihu-callback**。本地修改和测试已完成，尚未发布到生产环境。

授权入口 `https://openapi.zhihu.com/authorize`，令牌交换使用 `/access_token`（表单 code），用户信息使用 `/user`（Bearer）。支持业务成功码 20000；hash_id / uid 作为稳定身份，长数字 uid 无损解析；昵称来自 fullname。服务器始终校验 state 和浏览器 Cookie，缺少或不匹配就拒绝登录；取消或失败返回账号页面。沿用已经验证的协议，不再需要旧配置 OAUTH_CONTRACT_CONFIRMED、ZHIHU_USER_URL 或用户字段路径。

## 推荐：像 3Dschool 一样用 Workers Builds 部署整个项目

根目录 `wrangler.jsonc` 包含 Worker 入口和静态资源绑定。`server/wrangler.jsonc` 是已有 Pages 站点外挂 API 的备选配置，二选一；不要同时部署两套路由。

### 1. 初始化已有 D1

**moonexplorer-saves** 已创建，UUID 为 `59612008-51c8-4e5b-94e0-b3ace2bd36b5`，根目录和 server 目录的两份 Wrangler 配置均已填写。无需重复创建。绑定名固定为 **DB**，不使用或修改 3Dschool 的数据库。

在该数据库 Console 粘贴并执行 [schema.sql](schema.sql) 的全部内容，创建 `oauth_pending`、`sessions`、`saves`、`login_limits` 四张表。SQL 可重复执行。

也可以在项目根目录用命令行执行：

```powershell
npx wrangler login
# 初始化已有数据库：
npx wrangler d1 execute moonexplorer-saves --remote --file server/schema.sql
```

### 2. 更新 GitHub 与 Cloudflare 构建

将源码包解压后的内容提交到仓库根目录，包括 package.json、package-lock.json、wrangler.jsonc、server、tools 和游戏资源。不要只上传 ZIP。Worker 名称默认 moonexplorer，若控制台名称不同，修改根配置 name 为实际名称。

Workers Builds 配置：

- Build command：`npm run build`
- Deploy command：`npx wrangler deploy`
- Root directory：源码所在目录，仓库根目录则留空
- Node：24（根目录 .node-version 已设置）

构建只把游戏运行资源复制到 public-site；后端源文件、数据库和密钥不会作为静态资源发布。Worker 的 main 指向 server/worker.mjs，不能改成仅上传静态目录。

### 3. 配置运行时 Secret 和域名

先完成一次带 Worker 后端入口的发布，再进入该 Worker → Settings → Runtime variables and secrets，添加 **Secret**：

- 名称：`ZHIHU_APP_KEY`
- 值：用户邮件中 **App ID 849 对应的 App Key**

不要填成 3Dschool 的密钥，不要放到 Builds 构建变量，也不要写入前端或 GitHub。密钥没有打进交付包。CLI 也可执行 `npx wrangler secret put ZHIHU_APP_KEY`，在交互输入框填写。

根配置已提供普通变量 PUBLIC_ORIGIN=https://moon.chipai.cc、ZHIHU_APP_ID=849、ZHIHU_REDIRECT_URI=https://moon.chipai.cc/zhihu-callback。在 Domains & Routes 中让正式域名 moon.chipai.cc 指向该 Worker。如果该域名仍属于旧 Pages 站点，请安排切换到新 Worker，或使用下文的外挂 API 方式保留原托管。

### 4. 上线验收

打开 `https://moon.chipai.cc/api/moon/session`，游客应看到 configured=true、user=null。登录后账号页显示昵称；在一个设备保存游戏，再在另一设备登录同一知乎账号，确认可以接着玩。

D1 未初始化或未绑定会提示服务不可用；密钥未配置时登录按钮不可用，游客存档不受影响。缺少 state 的回调会被拒绝，不要为联调关闭此校验。真实授权需要用户在知乎完成，本地自动测试不会代替用户同意授权。

## 可选：保留原 Pages 静态站点，仅部署 API Worker

如果 moon.chipai.cc 仍由现有 Pages 托管，可以只更新 Pages 前端，再使用 server/wrangler.jsonc 让 API Worker 接管 `/api/moon/*` 与 `/zhihu-callback*`。正式域名需位于同一 Cloudflare 账户的 chipai.cc 区域且开启代理。根目录的整站 Worker 不再另行部署。

1. server/wrangler.jsonc 已填好同一个 D1 UUID，确认 API Worker 与该数据库属于同一 Cloudflare 账户。
2. Pages Build command 为 `npm run build`，输出目录 `public-site`。
3. 数据库初始化：`npx wrangler d1 execute moonexplorer-saves --remote --config server/wrangler.jsonc --file server/schema.sql`。
4. API Worker 首次发布：`npx wrangler deploy --config server/wrangler.jsonc`。
5. 给该 API Worker 添加 Secret：`npx wrangler secret put ZHIHU_APP_KEY --config server/wrangler.jsonc`。

原有路由若已匹配这些路径，需要合并或替换相应 API 路由，避免指向旧 Worker。静态文件放 public-site，切勿把 server 目录作为 Pages 静态资源上传。

## 存档行为

| 内容 | 存档范围 |
| --- | --- |
| 2D 像素 / 3D 体素探险 | 沿用现有共享主线进度 |
| 月球殖民 | 完整现有殖民地状态 |
| 全月漫游 | 位置、朝向、到访记录等现有进度 |
| 月球车 / 漫游图鉴 | 各自解锁记录 |
| 弹珠台 | 最高分 |

未登录：保留原有 localStorage 键和游戏机制。登录：使用验证后的知乎唯一用户 ID 派生账号命名空间，自动从云端读取；游戏脚本等待初始化完成，防止默认新档抢先覆盖云端。登录不会自动迁移游客进度，可在账号页逐项导入，导入已有云档会要求明确确认。

每次游戏保存先写入账号的本机缓存，再节流上传。云端使用用户 ID 和模式双主键以及原子版本比较；遇到另一设备的新版本返回 409，暂停该存档上传，账号页提供恢复云端或保留本机的选择。替换前的本机版本最多保留 5 份在 `moon-backup-v1:<用户ID>:<模式>` 键中，操作前也可导出文件备份。关闭网页时网络请求不能保证完成，以“云存档已同步”为准；未同步内容保存在本机缓存，登录后再次同步。

每个模式存档最大 512 KiB，同一账号最多使用表中六个固定模式槽位。无网络或会话过期时保留账号本机缓存并提示重新验证；这时不代表云端已保存。登录后再次读取并比较云端版本，不将旧账号进度写入新账号。

会话使用 HttpOnly、Secure、SameSite=Lax Cookie；修改请求校验 Origin、CSRF 和当前账号。授权令牌仅用于一次获取用户身份，不落库、不发送给前端；不保存邮箱、手机号和公开内容。会话最长 1 小时，失效后需重新登录；失效期间进度仍保存在原账号的本机缓存，不能冒用新账号上传。

多个标签页同时更改同一存档时提示刷新，防止旧页面误覆盖；不同模式可各自保存。退出会话后恢复游客模式，旧账号缓存保留。共享设备使用后可通过浏览器清理站点数据删除本机缓存，云档不受影响。

AI Works 内嵌场景受第三方 Cookie 和跨站存储限制，本次不做跨域 token 转发。账号页提供正式域名独立窗口入口；AI Works 站点原本地存档不自动跨域迁移。邮件仅登记了正式域名的回调，因此需在 moon.chipai.cc 完成登录。

## 验证与本地查看

```powershell
npm run test:account
node tools/test-account-browser.cjs
node tools/build-static.mjs
python -m http.server 8080 --directory public-site
```

本地访问 `http://localhost:8080/account.html`。没有 Worker 时显示登录尚未启用，游客游戏和本地存档正常。接口测试包含 Node 24 SQLite 与真实 workerd/D1 本地环境，知乎响应使用模拟数据。独立浏览器上下文验证跨设备与实际殖民地状态恢复；这些测试不代表 App 849 的真实 OAuth 和云端部署已经通过。

上线联调必须检查：授权同意和取消；真实 state 回传；同一知乎账号重复登录得到同一用户标识；两账号隔离；手机和另一设备续玩；本地/云端冲突；退出和过期；原游客存档仍可继续。不要用旧的 CloudBase ZIP 发布账号功能，旧包不包含本次前端和 Worker。
