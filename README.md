# 健康管理平台（PC 管理端）

Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + Axios。

## 页面

- 登录（账号密码 + 图形验证码）
- 医生管理：列表 / 新增编辑（含资质附件上传）/ 详情（审核记录、服务项目、附件）
- 医生审核：待审核 / 已拒绝 / 全部，通过、驳回（原因必填）、重新提交
- 基础数据：医院管理、科室管理（被引用仅可禁用）
- 系统管理：用户、角色（权限/菜单分配）、菜单、操作日志

## 开发

```bash
npm install
npm run dev     # http://localhost:5173，/api 代理到网关 9000
npm run build   # 产物在 dist/
```

需要后端网关（localhost:9000）与依赖（MySQL/Redis/Nacos）已启动，见后端仓库 health-platform/README.md。

## 约定

- 所有请求统一走 `src/api/`，禁止在页面直接写 Axios（说明书第 33 章）
- 按钮级权限用 `v-permission="'DOCTOR_APPROVE'"` 指令
- 每个页面具备 loading / 空数据 / 错误提示 / 操作成败反馈 / 危险操作确认
