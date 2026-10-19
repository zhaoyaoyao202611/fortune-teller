# 墨页 · Moye Reader

一个本地优先的轻量阅读器：上传 EPUB、文字版 PDF、TXT，直接划线，并按书汇总摘录。不包含 AI、账户或服务器同步。

## 开发

需要 Node.js 20.19+ 或 22.12+（当前环境为 Node.js 24）。

```sh
npm ci
npm run dev -- --port 5173
```

```sh
npm run build
npm test
```

浏览器测试默认使用 `/usr/bin/chromium`；其他系统可以通过 `CHROMIUM_PATH` 指向已安装的 Chromium。

## 使用

- 点击上传或拖拽 EPUB、PDF、TXT 到上传卡片；可以批量上传。
- 在书架打开书籍，通过目录切换章节。
- 开启「划线模式」后拖动选中文字，松开即保存；Esc 返回普通阅读。
- 在「划线摘录」查看汇总、返回原文、删除划线，或导出 Markdown。
- 阅读位置、书籍正文和划线保存在当前浏览器的 IndexedDB 中。清除网站数据会删除书库；跨设备、跨浏览器不会同步，请保留原书并定期导出摘录。
- 「阅读示例」是本项目创作的演示文字，不是《如何阅读一本书》的原文。

## 支持范围

EPUB 按 spine 顺序提取文本；PDF 按页提取文本，采用重排版，不保留原版图文布局。扫描版 PDF OCR、DRM 书籍、图片及复杂 EPUB 排版暂不支持。TXT 支持 UTF-8 并尝试 GB18030 回退。整个阅读流程无需外部 API 或密钥。PDF.js 在浏览器中解析文件，书籍不会被上传至服务器。

## 验证

Playwright 测试覆盖 TXT 导入、鼠标拖动划线、持久化、摘录回跳与删除、EPUB 导入与脚本隔离、PDF 文字提取、章节恢复、桌面及移动端无横向溢出。

## 网站部署（GitHub Pages）

代码推送到 `main` 会通过 `.github/workflows/deploy.yml` 自动构建并发布。
首次需要在 GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
如首次构建因 Pages 尚未启用而失败，开启后在 Actions 中重新运行 `Deploy Moye Reader`。
发布成功后使用部署结果中的网址访问，无需运行本地电脑。默认预期地址为 `https://zhaoyaoyao202611.github.io/fortune-teller/`；以 GitHub 实际部署结果为准。

网站上线后所有人都可以打开阅读器，但每位用户的书籍和划线仍仅保存在各自浏览器中。不要清理网站数据，保留原书并定期导出摘录。正式域名改变后，旧域名下的书库不会自动迁移。
