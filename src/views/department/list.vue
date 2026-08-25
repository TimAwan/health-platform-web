<template>
  <div class="page-card">
    <div class="table-toolbar">
      <el-form inline @submit.prevent>
        <el-form-item label="医院">
          <el-select v-model="hospitalId" placeholder="全部医院" clearable style="width: 200px" @change="search">
            <el-option v-for="h in hospitals" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="keyword" placeholder="科室名称" clearable style="width: 160px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
      <el-button v-permission="'DEPARTMENT_CREATE'" type="primary" @click="openForm()">新增科室</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe>
      <el-table-column label="医院" min-width="180">
        <template #default="{ row }">{{ hospitalName(row.hospitalId) }}</template>
      </el-table-column>
      <el-table-column prop="name" label="科室名称" min-width="140" />
      <el-table-column prop="code" label="编码" width="130" class="num" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button v-permission="'DEPARTMENT_UPDATE'" link type="primary" @click="openForm(row)">编辑</el-button>
          <el-button
            v-if="row.status === 'ENABLED'"
            v-permission="'DEPARTMENT_UPDATE'"
            link
            type="warning"
            @click="changeStatus(row, false)"
          >
            禁用
          </el-button>
          <el-button v-else v-permission="'DEPARTMENT_UPDATE'" link type="success" @click="changeStatus(row, true)">
            启用
          </el-button>
          <el-button v-permission="'DEPARTMENT_DELETE'" link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && rows.length === 0" class="empty-tip">暂无科室，点击右上角「新增科室」开始维护</div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>

    <el-dialog v-model="formVisible" :title="editing ? '编辑科室' : '新增科室'" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
        <el-form-item label="医院" prop="hospitalId">
          <el-select v-model="form.hospitalId" placeholder="选择医院">
            <el-option v-for="h in hospitals" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如 心血管内科" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="院内唯一，如 D001" class="num" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
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
  pageDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  changeDepartmentStatus,
  listHospitals,
  type Department,
  type Hospital
} from '@/api/doctor'

const loading = ref(false)
const rows = ref<Department[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const keyword = ref('')
const hospitalId = ref<number | null>(null)
const hospitals = ref<Hospital[]>([])

const formVisible = ref(false)
const submitting = ref(false)
const editing = ref<Department | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ hospitalId: null as number | null, name: '', code: '' })

const rules: FormRules = {
  hospitalId: [{ required: true, message: '请选择医院', trigger: 'change' }],
  name: [{ required: true, message: '请输入科室名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }]
}

function hospitalName(id: number): string {
  return hospitals.value.find((h) => h.id === id)?.name ?? '—'
}

async function load() {
  loading.value = true
  try {
    const result = await pageDepartments({
      page: page.value,
      size: size.value,
      hospitalId: hospitalId.value ?? undefined,
      keyword: keyword.value || undefined
    })
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

function openForm(row?: Department) {
  editing.value = row ?? null
  form.hospitalId = row?.hospitalId ?? hospitalId.value
  form.name = row?.name ?? ''
  form.code = row?.code ?? ''
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
      await updateDepartment(editing.value.id, { ...form })
      ElMessage.success('科室已更新')
    } else {
      await createDepartment({ ...form })
      ElMessage.success('科室已创建')
    }
    formVisible.value = false
    load()
  } finally {
    submitting.value = false
  }
}

async function changeStatus(row: Department, enabled: boolean) {
  await ElMessageBox.confirm(`确定${enabled ? '启用' : '禁用'}科室「${row.name}」吗？`, '操作确认', { type: 'warning' })
  await changeDepartmentStatus(row.id, enabled)
  ElMessage.success(enabled ? '已启用' : '已禁用')
  load()
}

async function remove(row: Department) {
  await ElMessageBox.confirm(
    `确定删除科室「${row.name}」吗？已被医生引用的科室无法删除，仅可禁用。`,
    '删除确认',
    { type: 'error' }
  )
  await deleteDepartment(row.id)
  ElMessage.success('科室已删除')
  load()
}

onMounted(async () => {
  load()
  hospitals.value = await listHospitals().catch(() => [])
})
</script>

<style scoped>
.empty-tip {
  text-align: center;
  color: var(--hp-ink-soft);
  padding: 24px 0 8px;
}
</style>
