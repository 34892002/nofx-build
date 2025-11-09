# NOFX 镜像构建与发布

NOFX 是通用架构的 AI交易操作系统（Agentic Trading OS）。我们已在加密市场打通"多智能体决策 → 统一风控 → 低延迟执行 → 真实/纸面账户复盘"的闭环，正按同一技术栈扩展到股票、期货、期权、外汇等所有市场。 官方仓库：[NoFxAiOS/nofx](https://github.com/NoFxAiOS/nofx)

本仓库支持：
- 手动或自动构建上游 `NoFxAiOS/nofx` 的 `backend` 与 `frontend` 镜像；
- 作为“可复用工作流”在其他仓库中调用，构建并推送到 [GHCR](https://github.com/users/34892002/packages?repo_name=nofx-build)。

## Docker 构建

每 2 小时检查一次官方main分支自动构建镜像 `NoFxAiOS/nofx@main`；
不定时手动构建 dev 分支镜像 `NoFxAiOS/nofx@dev`。

## 构建环境与架构

- 运行器：`ubuntu-22.04`
- 架构：`linux/amd64`（仅构建x86架构， 不支持`arm64`）。

## 运行时要求（加密与端口）

- 必需环境变量：
  - `DATA_ENCRYPTION_KEY`：32 字节随机值的 Base64（AES-256-GCM）。
  - `JWT_SECRET`：建议 64 字节随机值的 Base64（JWT 认证密钥）。
- 可选环境变量：
  - `NOFX_TIMEZONE`（默认 `Asia/Shanghai`），`AI_MAX_TOKENS` 等。
- 端口：
  - 后端默认映射 `${NOFX_BACKEND_PORT:-8080}:8080`；
  - 前端默认映射 `${NOFX_FRONTEND_PORT:-3000}:80`。
- 密钥与挂载：
  - 挂载目录 `./secrets:/app/secrets:ro`，包含 `rsa_key` 与 `rsa_key.pub`；
  - 生成密钥（Linux/macOS）：
    - 执行 `./scripts/setup_encryption.sh` 生成 `rsa_key` 与 `rsa_key.pub`；
    - 官方文档 https://github.com/NoFxAiOS/nofx/blob/dev/scripts/ENCRYPTION_README.md

## Compose 启动示例

必须先准备好下列目录与文件：

```yml
# 必要文件,参考 https://github.com/NoFxAiOS/nofx/blob/dev/config.json.example
- ./config.json
# 数据库，新安装时手动创建一个空文件
- ./config.db
# 邀请码，随便填写，例子: atxcp9
- ./beta_codes.txt
# 新安装时手动创建一个目录
- ./decision_logs
# 使用官方的 https://github.com/NoFxAiOS/nofx/tree/dev/prompts
- ./prompts
# 参考上面 ## 运行时要求（加密与端口） 生成 RSA 密钥的说明
- ./secrets
```

使用本仓库的 `compose.yml` 启动main分支镜像：
```bash
# 从本仓库拉取最新的 compose.yml（与仓库文件名一致）
curl -o compose.yml https://raw.githubusercontent.com/34892002/nofx-build/main/compose.yml
# 启动服务
docker compose up -d
```


## 标签策略

- 发布位置：
  - `ghcr.io/<你的账户或组织>/<本仓库名>/nofx-backend`
  - `ghcr.io/<你的账户或组织>/<本仓库名>/nofx-frontend`
- 仅保留分支别名两类：
- `main`：上游 `main` 自动构建的最新版本；
- `dev`：上游 `dev` 手动/指定构建的最新版本。
- 不再创建全局 `latest` 或其它派生标签（如 `main-amd64`、`main-<sha>-amd64`）。

使用本仓库的 `compose_dev.yml` 启动dev分支镜像：
```bash
# 从本仓库拉取最新的 compose_dev.yml（与仓库文件名一致）
curl -o compose_dev.yml https://raw.githubusercontent.com/34892002/nofx-build/main/compose_dev.yml
# 启动服务
docker compose -f compose_dev.yml up -d
```

## 常见问题

不定时更新脚本，有问题请提 [issue](https://github.com/34892002/nofx-build/issues)。