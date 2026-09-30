# 月球探险家

2D / 3D 月球科考、月球车、全月漫游、月球殖民及弹珠台。2026-09-30 已接入知乎 App ID 849 的账号登录和云存档，回调为 `https://moon.chipai.cc/zhihu-callback`。

- 游客：沿用当前浏览器原有本地存档，离线文件仍可游玩。
- 登录：启动游戏前读取账号云存档；游戏保存先写入账号本机缓存，再自动上传。换设备登录同一账号即可续玩。
- 游客存档不会自动覆盖账号存档，可在「账号与云存档」中逐项导入。
- 同时在多设备游玩时使用版本检查，冲突需选择云端或本机版本，不静默覆盖。
- App Key 仅存储在 Cloudflare 运行时 Secret；源码包不包含真实密钥。

## Cloudflare 部署

与 3Dschool 一样，根配置支持 Workers Static Assets + D1，通过 GitHub Workers Builds 发布。构建命令 `npm run build`，部署命令 `npm run deploy`，Node 24。

**`moonexplorer-saves` D1 已创建，UUID `59612008-51c8-4e5b-94e0-b3ace2bd36b5` 已填入两份 Wrangler 配置，无需重复创建。首次部署仍需执行 `server/schema.sql`，并为对应 Worker 添加运行时 Secret `ZHIHU_APP_KEY`。** 默认 Worker 名称 moonexplorer，需与控制台实际项目一致。

完整步骤见 [server/README.md](server/README.md)。若保留现有 Pages 静态托管，文档也提供仅将 API 路由接入 Worker 的备选方式。两种部署方式二选一。

## 构建与验证

```sh
npm ci
npm run build
npm run test:account
```

`public-site` 只包含游戏运行资源，后端源文件和凭证不会被公开。纯静态托管可以游客游玩，但无法独立提供登录与云存档。

`npm run test:account:browser` 使用本机 Chrome/Playwright 验证前端。另可分别在两个终端运行以下命令，以临时本地 workerd/D1 验证两个浏览器上下文跨设备续玩：

```sh
node tools/account-runtime-fixture.mjs --serve
python -X utf8 tools/test-account-e2e.py
```

自动验证使用模拟知乎响应和测试账号，不调用真实授权或修改线上数据库。App 849 的真实登录仍需正式部署后由用户授权验收。
