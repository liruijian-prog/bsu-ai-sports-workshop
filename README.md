# AI+体育 Vibe Coding 训练营暨创新黑客松

这是一个独立静态项目，用于展示拟以“北京体育大学继续教育学院”名义开展的 `AI+体育 Vibe Coding 训练营暨创新黑客松` 项目方案，并同步提供内部执行文档，方便项目组按阶段推进审批、招募、训练营交付、竞赛运营与 Demo Day 路演。

## 文件结构

- `index.html`：页面结构与完整项目方案文案
- `styles.css`：视觉设计、响应式布局与打印样式
- `app.js`：移动端导航、滚动高亮与入场动画
- `DESIGN.md`：页面设计方向与内容策略说明
- `docs/project-playbook.md`：训练营 + 竞赛一体化项目总控手册
- `docs/info-intake.md`：正式发布前需要补齐的信息采集清单
- `docs/staff-raci.md`：角色分工建议与任务责任矩阵
- `docs/workstation-checklist.md`：AI 工作台与会前技术准备清单
- `docs/model-validation.md`：用不同大模型交叉验证文案与执行方案的方法
- `docs/task-board-template.csv`：可直接导入表格工具的任务台账模板

## 本地预览

直接双击 `index.html` 即可浏览。

如果需要本地服务方式预览，可在项目目录执行：

```bash
python3 -m http.server 4323
```

然后访问 `http://localhost:4323`。

## 当前已预留的占位信息

以下字段暂未提供，页面中已明确留出后补位置：

- 正式审批口径 / 标准落款
- 训练营时间、竞赛时间线与 Demo Day 形式
- 举办地点
- 报名联系人 / 表单链接 / 缴费路径
- 奖项机制、评审名单与合作方权益
- 三位导师 / 评审的正式姓名、照片、职务与简介

## 当前版本的内容边界

- 已升级为“2 天训练营 + 7 天冲刺赛 + Demo Day”一体化方案
- 已补全 20 个可同时用于培训与竞赛的体育命题
- 已补充提交要求、评分标准、组队机制与奖项建议
- 已补充项目推进路线、内部总控、执行保障与 FAQ
- 已写明“借鉴 Google Gemini Vibe Coding Hackathon 机制，但不是 Google 官方赛事”
- 已写明国际工具合规边界、国产替代路径与数据脱敏要求
- 已保留内部执行文档，便于项目组分工推进

## 建议使用顺序

1. 先查看 `docs/info-intake.md`，把审批、赛制、奖项和报名关键信息补齐。
2. 再根据 `docs/project-playbook.md` 确定时间表、训练营节点和竞赛运营节点。
3. 用 `docs/staff-raci.md` 和 `docs/task-board-template.csv` 把任务落实到人。
4. 开营前按 `docs/workstation-checklist.md` 做工作台和现场演练。
5. 对外公开前，用 `docs/model-validation.md` 交叉验证项目口径与执行方案。
