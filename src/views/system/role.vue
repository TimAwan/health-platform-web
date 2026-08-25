<template>
  <div class="page-card">
    <div class="table-toolbar">
      <span class="dim">角色决定权限与菜单。修改角色的权限后，相关用户下次请求即生效。</span>
      <el-button v-permission="'ROLE_CREATE'" type="primary" @click="openForm()">新增角色</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe>
      <el-table-column prop="code" label="编码" width="150" class="num" />
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button v-permission="'ROLE_UPDATE'" link type="primary" @click="openForm(row)">编辑</el-button>
          <el-button v-permission="'ROLE_ASSIGN'" link type="primary" @click="openPermissions(row)">分配权限</el-button>
          <el-button v-permission="'ROLE_ASSIGN'" link type="primary" @click="openMenus(row)">分配菜单</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && rows.length === 0" class="empty-tip">暂无角色</div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>

    <el-dialog v-model="formVisible" :title="editing ? '编辑角色' : '新增角色'" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" :disabled="!!editing" placeholder="如 FINANCE_ADMIN" class="num" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如 财务" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionsVisible" :title="`分配权限：${editing?.name ?? ''}`" width="560px">
      <el-checkbox-group v-model="selectedPermissionIds" v-loading="assignLoading">
        <div class="permission-grid">
          <el-checkbox v-for="p in allPermissions" :key="p.id" :value="p.id">{{ p.name }}（{{ p.code }}）</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="permissionsVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitPermissions">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="menusVisible" :title="`分配菜单：${editing?.name ?? ''}`" width="420px">
      <el-tree
        ref="menuTreeRef"
        :data="menuTree"
        node-key="id"
        show-checkbox
        default-expand-all
        :props="{ label: 'name', children: 'children' }"
        v-loading="assignLoading"
      />
      <template #footer>
        <el-button @click="menusVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitMenus">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ElTree } from 'element-plus'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import {
  pageRoles,
  createRole,
  updateRole,
  listAllPermissions,
  getRolePermissionIds,
  assignRolePermissions,
  getRoleMenuIds,
  assignRoleMenus,
  fetchMenuTree,
  type SysRole,
  type SysPermission
} from '@/api/system'
import type { MenuNode } from '@/api/auth'

const loading = ref(false)
const rows = ref<SysRole[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)

const formVisible = ref(false)
const submitting = ref(false)
const editing = ref<SysRole | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ code: '', name: '', remark: '' })

const rules: FormRules = {
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

const permissionsVisible = ref(false)
const menusVisible = ref(false)
const assignLoading = ref(false)
const allPermissions = ref<SysPermission[]>([])
const selectedPermissionIds = ref<number[]>([])
const menuTree = ref<MenuNode[]>([])
const menuTreeRef = ref<InstanceType<typeof ElTree>>()

async function load() {
  loading.value = true
  try {
    const result = await pageRoles({ page: page.value, size: size.value })
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function openForm(row?: SysRole) {
  editing.value = row ?? null
  form.code = row?.code ?? ''
  form.name = row?.name ?? ''
  form.remark = row?.remark ?? ''
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
      await updateRole(editing.value.id, { ...form })
      ElMessage.success('角色已更新')
    } else {
      await createRole({ ...form })
      ElMessage.success('角色已创建')
    }
    formVisible.value = false
    load()
  } finally {
    submitting.value = false
  }
}

async function openPermissions(row: SysRole) {
  editing.value = row
  permissionsVisible.value = true
  assignLoading.value = true
  try {
    const [permissions, selected] = await Promise.all([listAllPermissions(), getRolePermissionIds(row.id)])
    allPermissions.value = permissions
    selectedPermissionIds.value = selected
  } finally {
    assignLoading.value = false
  }
}

async function submitPermissions() {
  if (!editing.value) {
    return
  }
  submitting.value = true
  try {
    await assignRolePermissions(editing.value.id, selectedPermissionIds.value)
    ElMessage.success('权限已更新，相关用户即时生效')
    permissionsVisible.value = false
  } finally {
    submitting.value = false
  }
}

async function openMenus(row: SysRole) {
  editing.value = row
  menusVisible.value = true
  assignLoading.value = true
  try {
    const [tree, selected] = await Promise.all([fetchMenuTree(), getRoleMenuIds(row.id)])
    menuTree.value = tree
    await nextTick()
    menuTreeRef.value?.setCheckedKeys(selected.filter((id) => !hasChild(tree, id)))
  } finally {
    assignLoading.value = false
  }
}

function hasChild(tree: MenuNode[], id: number): boolean {
  return tree.some((node) => node.id === id && (node.children?.length ?? 0) > 0)
}

async function submitMenus() {
  if (!editing.value) {
    return
  }
  submitting.value = true
  try {
    const checked = menuTreeRef.value?.getCheckedKeys(false) as number[]
    const halfChecked = menuTreeRef.value?.getHalfCheckedKeys() as number[]
    await assignRoleMenus(editing.value.id, [...checked, ...halfChecked])
    ElMessage.success('菜单已更新，相关用户重新登录后生效')
    menusVisible.value = false
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.dim {
  color: var(--hp-ink-soft);
  font-size: 13px;
}

.empty-tip {
  text-align: center;
  color: var(--hp-ink-soft);
  padding: 24px 0 8px;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 12px;
  max-height: 360px;
  overflow-y: auto;
}
</style>
