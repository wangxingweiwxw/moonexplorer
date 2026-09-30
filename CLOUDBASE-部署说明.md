# 月球探索游戏 · CloudBase 部署

更新于2026-09-28。包含当前2D、3D、弹珠台、月球车、24站漫游和月球殖民。月球殖民包含最新电能炮塔模型、武器特效、共边管网连接、居住舱容量提示、资源安全线及兵工厂装配菜单置顶。

## 直接部署到腾讯云静态网站托管（推荐）

使用项目根目录的 `moonexplorer-static.zip`。这是完整静态资源包，ZIP内直接是index.html，不含额外父目录。

1. 将ZIP解压到一个新文件夹；也可直接使用本机已准备好的 `D:/moonexplorer/_tmp/cloudbase-20260928/static-site`。
2. 登录 [CloudBase控制台](https://tcb.cloud.tencent.com/)，选择或创建环境，进入“静态网站托管”；按控制台提示开通服务。
3. 选择“文件管理”→“上传文件夹”，选择包含index.html的那一层文件夹，上传到网站根目录 `/`，覆盖同名文件。不要把ZIP当作普通文件上传。
4. 上传后确认网站根目录直接存在index.html、colony.html、roam.html、assets和vendor，默认索引文档设为index.html。
5. 打开控制台提供的默认域名。首页为 `/`，全月漫游为 `/roam.html`，月球殖民为 `/colony.html`。依次检查2D、3D、弹珠台、月球车、漫游和月球殖民入口。

本项目为原生HTML/CSS/JavaScript与WebGL，无需npm安装或游戏构建，也不需要云函数。当前源码根目录才是完整版本，原有dist是早期2D输出，不用于此次上线。

若采用“应用部署”上传静态ZIP：框架选择“其他”，根目录选择ZIP解压后含index.html的目录，安装和构建命令留空，产物目录填 `.`，部署路径 `/`。如果界面强制要求构建命令，改用上述文件管理方式。

[官方静态托管快速开始](https://docs.cloudbase.net/hosting/quick-start) · [纯静态项目部署](https://docs.cloudbase.net/hosting/web-hosting-static)

## 延续知乎 AI Works 上传流程

使用项目根目录更新后的 `moonexplorer.zip`（`AIWorks部署包/moonexplorer.zip`为同一文件副本）。请勿在AI Works上传`moonexplorer-static.zip`，否则会出现“_tmp必须至少包含frontend.deploy.json或backend.deploy.json”。将整个ZIP上传至原AI Works作品更新/部署入口，让平台读取描述符。ZIP唯一根目录为moonexplorer，内含 `_tmp/frontend.deploy.json` 和校验计划。

Skill生成配置：Framework=other，NodeVersion=20，InstallCmd为空，BuildCmd=`npm run build:track`，BuildPath=`./moonexplorer`。build:track仅处理平台统计ticket，不编译游戏。平台所需首页统计桥和辅助package仅写入隔离交付副本，游戏源码目录没有这些修改。统计ticket由平台提供，不在本地填写。

## 更新后仍看到旧内容

先确认选对环境及上传目录；检查线上colony-art.js、colony-war.js、colony.html是否更新；当前月球殖民页面资源版本为20260928-turret-model。浏览器强制刷新（电脑Ctrl+F5，手机关闭旧页面后重开）；如仍旧，检查控制台缓存/CDN刷新设置。正式域名可在静态托管域名管理中添加并按提示设置DNS与HTTPS。

## 打包说明

纯静态包不含本地测试、旧ZIP、dist、技能、凭证或部署辅助脚本。排除了当前页面不引用的旧Godot引擎导出和WAV文件，游戏音效仍由现有Web Audio代码生成；第三方许可与图片来源记录在交付副本中以HTML保存。原项目文件未因此删除。旧根目录ZIP备份在 `_tmp/cloudbase-20260928/previous-moonexplorer.zip` 与 `previous-moonexplorer-static.zip`。

两个新包均通过CRC及源码一致性检查；CloudBase技能计划、描述符校验通过，无后端输入。尚未登录或修改任何云资源。

本次校验：部署计划和描述符通过；两个ZIP完整性和运行代码一致性通过；隔离浏览器检查首页、2D、3D、弹珠台、月球车、全月漫游与月球殖民入口，未发现页面运行错误和本地资源404。校验记录位于 `_tmp/cloudbase-20260928/packages.json` 和 `verification/report.json`。

部署助手自动升级遇到Windows路径错误，本次使用完整的本地1.1.3工具生成并校验；未执行云端部署。
