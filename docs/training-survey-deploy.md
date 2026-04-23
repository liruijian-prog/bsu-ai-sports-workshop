# 体育+AI训练营报名页上线说明

## 目标

- 公开报名页：`https://liruijian.com/training/survey/`
- 后台查看页：`https://liruijian.com/training/survey-admin/`
- 后端 API：`https://survey-api.liruijian.com`

## 已准备好的文件

- 公开报名页目录：`training/survey/`
- 后台查看页目录：`training/survey-admin/`
- 前端 API 配置文件：
  - `training/survey/config.js`
  - `training/survey-admin/config.js`
- 后端目录：`/Users/work-0110/projects/workshop-survey/backend`

## 前端上线

前端是静态文件，直接放在当前 GitHub Pages 主站仓库。

需要推送的目录：

- `training/survey/`
- `training/survey-admin/`
- `docs/training-survey-deploy.md`

推送后，GitHub Pages 会自动发布到：

- `/training/survey/`
- `/training/survey-admin/`

## Railway 后端上线

### 新建项目

1. 登录 Railway
2. 点击 `New Project`
3. 选择 `Deploy from GitHub repo`
4. 选择当前主站仓库：

- `liruijian-prog/bsu-ai-sports-workshop`

### Railway 配置

Root Directory:

- `training/survey-api`

启动命令：

- `uvicorn main:app --host 0.0.0.0 --port $PORT`

Health Check Path:

- `/api/health`

### 环境变量

在 Railway 项目中设置：

- `WORKSHOP_SURVEY_ADMIN_PASSWORD=你自己的后台密码`
- `WORKSHOP_SURVEY_ALLOWED_ORIGINS=https://liruijian.com`

### 持久化存储

建议添加 Railway Volume。

用途：

- 保存 SQLite 数据库文件

数据库文件会自动写入：

- `/data/workshop_survey.db`

## GoDaddy 域名配置

后端需要一个子域名：

- `survey-api.liruijian.com`

在 Railway 中先生成自定义域名绑定目标，再去 GoDaddy 添加：

- 类型：`CNAME`
- 主机：`survey-api`
- 值：Railway 提供的目标地址

## 改 API 地址

如果后端域名以后变化，只需要修改两处：

- `training/survey/config.js`
- `training/survey-admin/config.js`

把 `apiBase` 改成新的 API 地址即可。

## 后端代码位置

后端代码已放在当前主站仓库目录：

- `training/survey-api/`

包含文件：

- `training/survey-api/main.py`
- `training/survey-api/database.py`
- `training/survey-api/models.py`
- `training/survey-api/schemas.py`
- `training/survey-api/requirements.txt`
- `training/survey-api/railway.json`

## 上线后检查

### 公开页

打开：

- `https://liruijian.com/training/survey/`

检查：

- 页面能正常打开
- 提交表单后显示成功提示

### 后台页

打开：

- `https://liruijian.com/training/survey-admin/`

检查：

- 输入后台密码后能进入
- 能看到新提交记录
- 能导出 CSV
