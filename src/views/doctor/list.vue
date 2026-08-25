<template>
  <div class="page-card">
    <div class="table-toolbar">
      <el-form inline :model="query" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="姓名 / 手机号" clearable style="width: 180px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="query.auditStatus" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="(label, value) in AUDIT_LABELS" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="医院">
          <el-select v-model="query.hospitalId" placeholder="全部" clearable style="width: 170px">
            <el-option v-for="h in hospitals" :key="h.id" :label="h.name" :value="h.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
      <el-button v-permission="'DOCTOR_CREATE'" type="primary" :icon="'Plus'" @click="openCreate">新增医生</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" stripe>
      <el-table-column prop="name" label="姓名" width="90" />
      <el-table-column prop="phone" label="手机号" width="130" class="num" />
      <el-table-column prop="hospitalName" label="医院" min-width="140" show-overflow-tooltip />
      <el-table-column prop="departmentName" label="科室" width="110" show-overflow-tooltip />
      <el-table-column prop="title" label="职称" width="100" />
      <el-table-column label="审核状态" width="100">
        <template #default="{ row }"><StatusTag :status="row.auditStatus" /></template>
      </el-table-column>
      <el-table-column label="上下架" width="80">
        <template #default="{ row }"><StatusTag :status="row.serviceStatus" /></template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button v-if="canEdit(row)" v-permission="'DOCTOR_UPDATE'" link type="primary" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button v-if="row.auditStatus === 'PENDING_REVIEW'" v-permission="'DOCTOR_APPROVE'" link type="success" @click="doAudit(row, 'approve')">
            通过
          </el-button>
          <el-button v-if="row.auditStatus === 'PENDING_REVIEW'" v-permission="'DOCTOR_REJECT'" link type="danger" @click="doAudit(row, 'reject')">
            驳回
          </el-button>
          <el-button v-if="row.auditStatus === 'REJECTED'" v-permission="'DOCTOR_RESUBMIT'" link type="warning" @click="doAudit(row, 'resubmit')">
            重新提交
          </el-button>
          <el-button v-if="row.auditStatus === 'APPROVED'" v-permission="'DOCTOR_SUSPEND'" link type="warning" @click="doAudit(row, 'suspend')">
            暂停
          </el-button>
          <el-button v-if="row.auditStatus === 'APPROVED'" v-permission="'DOCTOR_TERMINATE'" link type="danger" @click="doAudit(row, 'terminate')">
            解约
          </el-button>
          <el-button v-if="row.serviceStatus === 'OFF_SHELF' && row.auditStatus === 'APPROVED'" v-permission="'DOCTOR_ON_SHELF'" link type="success" @click="doShelf(row, true)">
            上架
          </el-button>
          <el-button v-if="row.serviceStatus === 'ON_SHELF'" v-permission="'DOCTOR_OFF_SHELF'" link type="info" @click="doShelf(row, false)">
            下架
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && rows.length === 0" class="empty-tip">暂无医生，点击右上角「新增医生」开始录入</div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="load"
        @size-change="search"
      />
    </div>

    <DoctorFormDialog v-model:visible="formVisible" :doctor-id="editingId" @saved="load" />
    <DoctorDetailDrawer v-model:visible="detailVisible" :doctor-id="detailId" @changed="load" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import DoctorFormDialog from '@/components/DoctorFormDialog.vue'
import DoctorDetailDrawer from '@/components/DoctorDetailDrawer.vue'
import {
  pageDoctors,
  auditDoctor,
  doctorOnShelf,
  doctorOffShelf,
  listHospitals,
  type DoctorVO,
  type AuditAction,
  type Hospital
} from '@/api/doctor'

const AUDIT_LABELS: Record<string, string> = {
  PENDING_REVIEW: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  SUSPENDED: '已暂停',
  TERMINATED: '已解约'
}

const AUDIT_CONFIRM: Record<string, string> = {
  approve: '通过该医生的入驻审核？',
  reject: '驳回该医生的入驻申请？',
  resubmit: '将该医生重新提交审核？',
  suspend: '暂停与该医生的合作？暂停后其全部服务将下架。',
  terminate: '解除与该医生的签约？解约后不可恢复，其全部服务将下架。'
}
const REASON_REQUIRED: AuditAction[] = ['reject', 'suspend', 'terminate']

const loading = ref(false)
const rows = ref<DoctorVO[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const hospitals = ref<Hospital[]>([])
const query = reactive({ keyword: '', auditStatus: '', hospitalId: null as number | null })

const formVisible = ref(false)
const editingId = ref<number | null>(null)
const detailVisible = ref(false)
const detailId = ref<number | null>(null)

function canEdit(row: DoctorVO): boolean {
  return row.auditStatus !== 'TERMINATED'
}

async function load() {
  loading.value = true
  try {
    const result = await pageDoctors({
      page: page.value,
      size: size.value,
      keyword: query.keyword || undefined,
      auditStatus: query.auditStatus || undefined,
      hospitalId: query.hospitalId ?? undefined
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

function openCreate() {
  editingId.value = null
  formVisible.value = true
}

function openEdit(row: DoctorVO) {
  editingId.value = row.id
  formVisible.value = true
}

function openDetail(row: DoctorVO) {
  detailId.value = row.id
  detailVisible.value = true
}

async function doAudit(row: DoctorVO, action: AuditAction) {
  const confirmText = AUDIT_CONFIRM[action]
  let reason = ''
  if (REASON_REQUIRED.includes(action)) {
    const input = await ElMessageBox.prompt(`${confirmText}（需填写原因）`, '操作确认', {
      type: 'warning',
      inputPlaceholder: '请输入原因（必填）',
      inputValidator: (value: string) => (value && value.trim() ? true : '原因不能为空')
    })
    reason = input.value.trim()
  } else {
    await ElMessageBox.confirm(confirmText, '操作确认', { type: 'warning' })
  }
  await auditDoctor(row.id, action, reason)
  ElMessage.success('操作成功')
  load()
}

async function doShelf(row: DoctorVO, onShelf: boolean) {
  await ElMessageBox.confirm(`确定${onShelf ? '上架' : '下架'}医生「${row.name}」吗？`, '操作确认', { type: 'warning' })
  if (onShelf) {
    await doctorOnShelf(row.id)
  } else {
    await doctorOffShelf(row.id)
  }
  ElMessage.success(onShelf ? '医生已上架' : '医生已下架，其服务已同步下架')
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
