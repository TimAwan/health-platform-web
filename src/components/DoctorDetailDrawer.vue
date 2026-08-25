<template>
  <el-drawer
    :model-value="visible"
    title="医生详情"
    size="560px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading">
      <template v-if="doctor">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ doctor.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ doctor.gender === 'MALE' ? '男' : '女' }}</el-descriptions-item>
          <el-descriptions-item label="手机号" class="num">{{ doctor.phone }}</el-descriptions-item>
          <el-descriptions-item label="职称">{{ doctor.title || '—' }}</el-descriptions-item>
          <el-descriptions-item label="医院">{{ doctor.hospitalName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="科室">{{ doctor.departmentName || '—' }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <StatusTag :status="doctor.auditStatus" />
          </el-descriptions-item>
          <el-descriptions-item label="合作状态">
            <StatusTag :status="doctor.cooperationStatus" />
          </el-descriptions-item>
          <el-descriptions-item label="上下架">
            <StatusTag :status="doctor.serviceStatus" />
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" class="num">{{ doctor.createdAt || '—' }}</el-descriptions-item>
          <el-descriptions-item label="擅长领域" :span="2">{{ doctor.specialty || '—' }}</el-descriptions-item>
          <el-descriptions-item label="个人简介" :span="2">{{ doctor.intro || '—' }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs class="tabs">
          <el-tab-pane label="审核记录">
            <el-empty v-if="auditRecords.length === 0" description="暂无审核记录" :image-size="60" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="record in auditRecords"
                :key="record.id"
                :timestamp="record.createdAt"
                placement="top"
              >
                <div>
                  <b>{{ ACTION_LABELS[record.action] ?? record.action }}</b>
                  <span class="num dim">（{{ record.fromStatus }} → {{ record.toStatus }}）</span>
                </div>
                <div v-if="record.reason" class="dim">原因：{{ record.reason }}</div>
                <div class="dim">操作人：{{ record.operatorName }}</div>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>

          <el-tab-pane label="服务项目">
            <el-empty v-if="services.length === 0" description="暂无服务项目" :image-size="60" />
            <el-table v-else :data="services" size="small">
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="type" label="类型" width="90" />
              <el-table-column prop="price" label="价格(元)" width="90" class="num" />
              <el-table-column label="状态" width="80">
                <template #default="{ row }"><StatusTag :status="row.status" /></template>
              </el-table-column>
              <el-table-column label="操作" width="130">
                <template #default="{ row }">
                  <el-button
                    v-if="row.status === 'OFF_SHELF'"
                    v-permission="'DOCTOR_SERVICE_ON_SHELF'"
                    link
                    type="primary"
                    size="small"
                    @click="shelf(row, true)"
                  >
                    上架
                  </el-button>
                  <el-button
                    v-else
                    v-permission="'DOCTOR_SERVICE_OFF_SHELF'"
                    link
                    type="warning"
                    size="small"
                    @click="shelf(row, false)"
                  >
                    下架
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button
              v-permission="'DOCTOR_SERVICE_CREATE'"
              class="add-service"
              size="small"
              @click="serviceFormVisible = true"
            >
              新增服务
            </el-button>
          </el-tab-pane>

          <el-tab-pane label="资质附件">
            <el-empty v-if="attachments.length === 0" description="暂无资质附件" :image-size="60" />
            <ul v-else class="attachment-list">
              <li v-for="item in attachments" :key="item.fileId" class="num">
                <el-icon><Document /></el-icon>
                <span>{{ ATTACHMENT_LABELS[item.fileType] ?? item.fileType }} · {{ item.fileId }}</span>
                <el-button link type="primary" @click="preview(item.fileId)">查看</el-button>
              </li>
            </ul>
          </el-tab-pane>
        </el-tabs>
      </template>
      <el-empty v-else-if="!loading" description="医生信息加载失败" />
    </div>

    <el-dialog v-model="serviceFormVisible" title="新增服务" width="420px" append-to-body>
      <el-form :model="serviceForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="serviceForm.name" placeholder="如 图文咨询" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="serviceForm.type" placeholder="如 咨询 / 解读" />
        </el-form-item>
        <el-form-item label="价格(元)" required>
          <el-input-number v-model="serviceForm.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="serviceForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="serviceSubmitting" @click="submitService">保存</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import {
  getDoctor,
  fetchAuditHistory,
  listDoctorServices,
  createDoctorService,
  doctorServiceOnShelf,
  doctorServiceOffShelf,
  type DoctorVO,
  type DoctorAuditRecord,
  type DoctorServiceItem
} from '@/api/doctor'
import { fetchFileUrl } from '@/api/file'

const props = defineProps<{ visible: boolean; doctorId?: number | null }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'changed'): void }>()

const ACTION_LABELS: Record<string, string> = {
  APPROVE: '审核通过',
  REJECT: '审核拒绝',
  SUSPEND: '暂停合作',
  TERMINATE: '解除签约',
  RESUBMIT: '重新提交'
}
const ATTACHMENT_LABELS: Record<string, string> = {
  PRACTICE_LICENSE: '执业证',
  QUALIFICATION: '资格证',
  OTHER: '其他'
}

const loading = ref(false)
const doctor = ref<DoctorVO | null>(null)
const auditRecords = ref<DoctorAuditRecord[]>([])
const services = ref<DoctorServiceItem[]>([])
const serviceFormVisible = ref(false)
const serviceSubmitting = ref(false)
const serviceForm = reactive({ name: '', type: '', price: 0, description: '' })

watch(
  () => props.visible,
  (visible) => {
    if (visible && props.doctorId) {
      load()
    }
  }
)

async function load() {
  loading.value = true
  try {
    const id = props.doctorId as number
    doctor.value = await getDoctor(id)
    auditRecords.value = await fetchAuditHistory(id)
    services.value = await listDoctorServices(id)
  } catch {
    doctor.value = null
  } finally {
    loading.value = false
  }
}

async function shelf(row: DoctorServiceItem, onShelf: boolean) {
  const id = props.doctorId as number
  await ElMessageBox.confirm(`确定${onShelf ? '上架' : '下架'}服务「${row.name}」吗？`, '操作确认', {
    type: 'warning'
  })
  if (onShelf) {
    await doctorServiceOnShelf(id, row.id)
  } else {
    await doctorServiceOffShelf(id, row.id)
  }
  ElMessage.success(onShelf ? '服务已上架' : '服务已下架')
  services.value = await listDoctorServices(id)
  emit('changed')
}

async function submitService() {
  if (!serviceForm.name) {
    ElMessage.error('请填写服务名称')
    return
  }
  serviceSubmitting.value = true
  try {
    await createDoctorService(props.doctorId as number, { ...serviceForm })
    ElMessage.success('服务已创建（默认下架）')
    serviceFormVisible.value = false
    Object.assign(serviceForm, { name: '', type: '', price: 0, description: '' })
    services.value = await listDoctorServices(props.doctorId as number)
  } finally {
    serviceSubmitting.value = false
  }
}

async function preview(fileId: number) {
  try {
    const url = await fetchFileUrl(fileId)
    window.open(url, '_blank')
  } catch {
    ElMessage.error('附件加载失败')
  }
}

const attachments = ref<{ fileId: number; fileType: string }[]>([])
watch(
  () => doctor.value,
  (value) => {
    attachments.value = value?.attachments ?? []
  }
)
</script>

<style scoped>
.tabs {
  margin-top: 16px;
}

.dim {
  color: var(--hp-ink-soft);
  font-size: 12px;
}

.add-service {
  margin-top: 8px;
}

.attachment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.attachment-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed #e5eae9;
}
</style>
