<template>
  <div class="page-card">
    <el-alert
      v-if="pendingCount > 0"
      :title="`有 ${pendingCount} 位医生等待审核`"
      type="warning"
      :closable="false"
      class="banner"
    />
    <el-alert v-else title="当前没有待审核的医生" type="success" :closable="false" class="banner" />

    <el-tabs v-model="activeTab" @tab-change="search">
      <el-tab-pane label="待审核" name="PENDING_REVIEW" />
      <el-tab-pane label="已拒绝" name="REJECTED" />
      <el-tab-pane label="全部" name="ALL" />
    </el-tabs>

    <el-table v-loading="loading" :data="rows" stripe>
      <el-table-column prop="name" label="姓名" width="90" />
      <el-table-column prop="phone" label="手机号" width="130" class="num" />
      <el-table-column prop="hospitalName" label="医院" min-width="140" show-overflow-tooltip />
      <el-table-column prop="departmentName" label="科室" width="110" show-overflow-tooltip />
      <el-table-column prop="title" label="职称" width="100" />
      <el-table-column label="审核状态" width="100">
        <template #default="{ row }"><StatusTag :status="row.auditStatus" /></template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="detailId = row.id; detailVisible = true">详情</el-button>
          <el-button v-if="row.auditStatus === 'PENDING_REVIEW'" v-permission="'DOCTOR_APPROVE'" link type="success" @click="audit(row, 'approve')">
            通过
          </el-button>
          <el-button v-if="row.auditStatus === 'PENDING_REVIEW'" v-permission="'DOCTOR_REJECT'" link type="danger" @click="audit(row, 'reject')">
            驳回
          </el-button>
          <el-button v-if="row.auditStatus === 'REJECTED'" v-permission="'DOCTOR_RESUBMIT'" link type="warning" @click="audit(row, 'resubmit')">
            重新提交
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!loading && rows.length === 0" class="empty-tip">该状态下暂无医生</div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>

    <DoctorDetailDrawer v-model:visible="detailVisible" :doctor-id="detailId" @changed="load" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import DoctorDetailDrawer from '@/components/DoctorDetailDrawer.vue'
import { pageDoctors, auditDoctor, type DoctorVO, type AuditAction } from '@/api/doctor'

const activeTab = ref('PENDING_REVIEW')
const loading = ref(false)
const rows = ref<DoctorVO[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const pendingCount = ref(0)
const detailVisible = ref(false)
const detailId = ref<number | null>(null)

async function load() {
  loading.value = true
  try {
    const result = await pageDoctors({
      page: page.value,
      size: size.value,
      auditStatus: activeTab.value === 'ALL' ? undefined : activeTab.value
    })
    rows.value = result.list
    total.value = result.total
    if (activeTab.value === 'PENDING_REVIEW') {
      pendingCount.value = result.total
    }
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

async function audit(row: DoctorVO, action: AuditAction) {
  let reason = ''
  if (action === 'reject') {
    const input = await ElMessageBox.prompt('驳回该医生的入驻申请？（需填写原因）', '操作确认', {
      type: 'warning',
      inputPlaceholder: '请输入驳回原因（必填）',
      inputValidator: (value: string) => (value && value.trim() ? true : '原因不能为空')
    })
    reason = input.value.trim()
  } else if (action === 'approve') {
    await ElMessageBox.confirm('通过该医生的入驻审核？', '操作确认', { type: 'warning' })
  } else {
    await ElMessageBox.confirm('将该医生重新提交审核？', '操作确认', { type: 'warning' })
  }
  await auditDoctor(row.id, action, reason)
  ElMessage.success('操作成功')
  load()
}

onMounted(load)
</script>

<style scoped>
.banner {
  margin-bottom: 12px;
}

.empty-tip {
  text-align: center;
  color: var(--hp-ink-soft);
  padding: 24px 0 8px;
}
</style>
