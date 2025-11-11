# NOFX 镜像构建与发布

NOFX 是通用架构的 AI交易操作系统（Agentic Trading OS）。我们已在加密市场打通"多智能体决策 → 统一风控 → 低延迟执行 → 真实/纸面账户复盘"的闭环，正按同一技术栈扩展到股票、期货、期权、外汇等所有市场。 官方仓库：[NoFxAiOS/nofx](https://github.com/NoFxAiOS/nofx)

本仓库支持：
- 手动或自动构建上游 `NoFxAiOS/nofx` 的 `backend` 与 `frontend` 镜像；
- 作为“可复用工作流”在其他仓库中调用，构建并推送到 [GHCR](https://github.com/users/34892002/packages?repo_name=nofx-build)。
- 新增z佬的z-dev-v2分支编译，官方转帖，贴文表示主力分支将使用z-dev-v2开发[x帖文](https://x.com/the_dev_z/status/1988142704803672110)，[分支仓库](https://github.com/the-dev-z/nofx/commits/z-dev-v2/)

## Docker 构建

每 2 小时检查一次官方 `main` 分支自动构建镜像 `NoFxAiOS/nofx@main`；
不定时手动构建 `dev` 分支镜像 `NoFxAiOS/nofx@dev`。

## 构建环境与架构

- 运行器：`ubuntu-22.04`
- 架构：`linux/amd64`（仅构建 `x86` 架构，不支持 `arm64`）。

## Compose 部署启动示例

1. 先准备好下列目录与文件：

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
# 参考本仓库 ## compose必要环境配置（Linux） 密钥与挂载 部分
- ./secrets
```

2. 选择你要部署的分支（main 或 dev）

使用本仓库的 `compose.yml` 启动main分支镜像：
```bash
# 从本仓库拉取最新的 compose.yml（与仓库文件名一致）
curl -o compose.yml https://raw.githubusercontent.com/34892002/nofx-build/main/compose.yml
# 修改compose.yml中的环境变量配置，参考 compose必要环境配置（Linux）
# 最后启动服务
docker compose up -d
```


使用本仓库的 `compose_dev.yml` 启动dev分支镜像：
```bash
# 从本仓库拉取最新的 compose_dev.yml（与仓库文件名一致）
curl -o compose_dev.yml https://raw.githubusercontent.com/34892002/nofx-build/main/compose_dev.yml
# 修改compose_dev.yml中的环境变量配置，参考 compose必要环境配置（Linux）
# 最后启动服务
docker compose -f compose_dev.yml up -d
```

## compose必要环境配置（Linux）
> 提示：请勿将 `./secrets` 目录提交到仓库，建议通过 `.gitignore` 忽略。
- `必填配置`：
  - 密钥：
    - 加密密钥生成脚本[官方文档](https://github.com/NoFxAiOS/nofx/blob/dev/scripts/ENCRYPTION_README.md)
    - 执行 `./scripts/setup_encryption.sh` 生成secrets目录，里面包含 `rsa_key` 与 `rsa_key.pub`；
  - 挂载密钥目录 `./secrets:/app/secrets:ro`，包含 `rsa_key` 与 `rsa_key.pub`；
  - 数据库加密串 `DATA_ENCRYPTION_KEY`：32 字节随机 Base64。
    - 运行命令生成：`openssl rand -base64 32`
  - JWT 认证密钥 `JWT_SECRET`：64 字节随机 Base64。
    - 运行命令生成：`openssl rand -base64 64`

- 端口：
  - 后端默认映射 `${NOFX_BACKEND_PORT:-8080}:8080`；
  - 前端默认映射 `${NOFX_FRONTEND_PORT:-3000}:80`。

- 其他：
  - `NOFX_TIMEZONE`（默认 `Asia/Shanghai`）
  - `AI_MAX_TOKENS`（默认 `4000`）


## 标签策略
> 不推荐直接pull 镜像使用，建议通过compose部署。
分支别名两类：
- `main`：上游 `main` 自动构建的最新版本；
``` bash
docker pull ghcr.io/34892002/nofx-build/nofx-backend:main
docker pull ghcr.io/34892002/nofx-build/nofx-frontend:main
```
- `dev`：上游 `dev` 手动/指定构建的最新版本。
``` bash
docker pull ghcr.io/34892002/nofx-build/nofx-backend:dev
docker pull ghcr.io/34892002/nofx-build/nofx-frontend:dev
```

## z-dev-v2分支部署问题
> 镜像更新时间：2025-11-11

## dev分支部署问题
> 镜像更新时间：2025-11-11
1. 注册账号密码问题
  - 多输入几次，直到成功注册。
2. 启用WAL模式失败: database disk image is malformed (11)
  - 解决方法：备份原 `./config.db` 数据库文件。
  - 使用本仓库的`create_config_db.ts`得到一个empty.db改名为config.db，上传即可。
  - （不建议）懒人直接用本仓库的`config.db`文件替换即可。



## 常见问题

不定时更新脚本，有问题请提 [issue](https://github.com/34892002/nofx-build/issues)。
