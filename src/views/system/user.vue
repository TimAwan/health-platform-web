<template>
  <div class="page-card">
    <div class="table-toolbar">
      <el-form inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="用户名 / 姓名" clearable style="width: 180px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
      <el-button v-permission="'USER_CREATE'" type="primary" @click="openForm()">新增用户</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe>
      <el-table-column prop="username" label="用户名" width="130" />
      <el-table-column prop="realName" label="姓名" width="110" />
      <el-table-column prop="phone" label="手机号" width="130" class="num" />
      <el-table-column label="角色" min-width="150">
        <template #default="{ row }">{{ row.roleNames?.join('、') || '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column prop="lastLoginAt" label="最近登录" width="170" class="num" />
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button v-permission="'USER_UPDATE'" link type="primary" @click="openForm(row)">编辑</el-button>
          <el-button v-permission="'USER_ASSIGN_ROLE'" link type="primary" @click="openRoles(row)">分配角色</el-button>
          <el-button v-permission="'USER_RESET_PASSWORD'" link type="warning" @click="resetPassword(row)">重置密码</el-button>
          <el-button
            v-if="row.status === 'ENABLED'"
            v-permission="'USER_DISABLE'"
            link
            type="danger"
            @click="changeStatus(row, false)"
          >
            停用
          </el-button>
          <el-button v-else v-permission="'USER_DISABLE'" link type="success" @click="changeStatus(row, true)">
            启用
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && rows.length === 0" class="empty-tip">暂无用户</div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>

    <el-dialog v-model="formVisible" :title="editing ? '编辑用户' : '新增用户'" width="440px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!editing" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item v-if="!editing" label="初始密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="至少 8 位" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rolesVisible" :title="`分配角色：${editing?.username ?? ''}`" width="420px">
      <el-checkbox-group v-model="selectedRoleIds">
        <el-checkbox v-for="role in allRoles" :key="role.id" :value="role.id">{{ role.name }}（{{ role.code }}）</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="rolesVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRoles">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import {
  pageUsers,
  createUser,
  updateUser,
  changeUserStatus,
  resetUserPassword,
  assignUserRoles,
  listRoles,
  type SysUser,
  type SysRole
} from '@/api/system'

const loading = ref(false)
const rows = ref<SysUser[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')

const formVisible = ref(false)
const submitting = ref(false)
const editing = ref<SysUser | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ username: '', password: '', realName: '', phone: '' })

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入初始密码', trigger: 'blur' },
    { min: 8, message: '密码至少 8 位', trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const rolesVisible = ref(false)
const allRoles = ref<SysRole[]>([])
const selectedRoleIds = ref<number[]>([])

async function load() {
  loading.value = true
  try {
    const result = await pageUsers({ page: page.value, size: size.value, keyword: keyword.value || undefined })
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function openForm(row?: SysUser) {
  editing.value = row ?? null
  form.username = row?.username ?? ''
  form.password = ''
  form.realName = row?.realName ?? ''
  form.phone = row?.phone ?? ''
  formVisible.value = true
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  submitting.value = true
  try {
    if (editing.value) {
      await updateUser(editing.value.id, { realName: form.realName, phone: form.phone })
      ElMessage.success('用户已更新')
    } else {
      await createUser({ ...form })
      ElMessage.success('用户已创建')
    }
    formVisible.value = false
    load()
  } finally {
    submitting.value = false
  }
}

async function openRoles(row: SysUser) {
  editing.value = row
  allRoles.value = await listRoles()
  selectedRoleIds.value = row.roleIds ?? []
  rolesVisible.value = true
}

async function submitRoles() {
  if (!editing.value) {
    return
  }
  submitting.value = true
  try {
    await assignUserRoles(editing.value.id, selectedRoleIds.value)
    ElMessage.success('角色已更新，权限即时生效')
    rolesVisible.value = false
    load()
  } finally {
    submitting.value = false
  }
}

async function resetPassword(row: SysUser) {
  const input = await ElMessageBox.prompt(`重置用户「${row.username}」的密码：`, '重置密码', {
    inputPlaceholder: '新密码（至少 8 位）',
    inputValidator: (value: string) => (value && value.length >= 8 ? true : '密码至少 8 位')
  })
  await resetUserPassword(row.id, input.value)
  ElMessage.success('密码已重置')
}

async function changeStatus(row: SysUser, enabled: boolean) {
  await ElMessageBox.confirm(
    `确定${enabled ? '启用' : '停用'}用户「${row.username}」吗？${enabled ? '' : '停用后该账号立即无法登录。'}`,
    '操作确认',
    { type: 'warning' }
  )
  await changeUserStatus(row.id, enabled)
  ElMessage.success(enabled ? '已启用' : '已停用')
  load()
}

onMounted(load)
</script>

<style scoped>
.empty-tip {
  text-align: center;
  color: var(--hp-ink-soft);
  padding: 24px 0 8px;
}
</style>
