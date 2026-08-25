<template>
  <el-dialog
    :model-value="visible"
    :title="doctorId ? '编辑医生' : '新增医生'"
    width="640px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" v-loading="loading">
      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="医生姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio value="MALE">男</el-radio>
              <el-radio value="FEMALE">女</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" placeholder="11 位手机号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职称" prop="title">
            <el-input v-model="form.title" placeholder="如 主任医师" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="医院" prop="hospitalId">
            <el-select v-model="form.hospitalId" placeholder="选择医院" @change="onHospitalChange">
              <el-option v-for="h in hospitals" :key="h.id" :label="h.name" :value="h.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="科室" prop="departmentId">
            <el-select v-model="form.departmentId" placeholder="先选择医院" :disabled="!form.hospitalId">
              <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="擅长领域" prop="specialty">
        <el-input v-model="form.specialty" placeholder="如 心血管疾病、慢病管理" />
      </el-form-item>
      <el-form-item label="个人简介" prop="intro">
        <el-input v-model="form.intro" type="textarea" :rows="3" placeholder="展示给客户看的简介" />
      </el-form-item>
      <el-form-item label="资质附件">
        <el-upload
          :file-list="fileList"
          :http-request="doUpload"
          :before-upload="beforeUpload"
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
          :limit="6"
        >
          <el-button :icon="'Plus'">选择文件</el-button>
          <template #tip>
            <div class="upload-tip">执业证 / 资格证书，jpg、png、pdf，单个不超过 10MB</div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  getDoctor,
  createDoctor,
  updateDoctor,
  listHospitals,
  listDepartmentsByHospital,
  type DoctorForm,
  type Hospital,
  type Department
} from '@/api/doctor'
import { uploadFile } from '@/api/file'
import { useUserStore } from '@/stores/user'

const props = defineProps<{ visible: boolean; doctorId?: number | null }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'saved'): void }>()

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const hospitals = ref<Hospital[]>([])
const departments = ref<Department[]>([])

const form = reactive<DoctorForm>({
  name: '',
  gender: 'MALE',
  phone: '',
  avatarFileId: null,
  hospitalId: null,
  departmentId: null,
  title: '',
  specialty: '',
  intro: '',
  attachments: []
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  hospitalId: [{ required: true, message: '请选择医院', trigger: 'change' }],
  departmentId: [{ required: true, message: '请选择科室', trigger: 'change' }]
}

const fileList = computed(() =>
  (form.attachments ?? []).map((a, index) => ({ name: `附件${index + 1}（${a.fileType}）`, fileId: a.fileId }))
)

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return
    }
    hospitals.value = await listHospitals()
    if (props.doctorId) {
      loading.value = true
      try {
        const doctor = await getDoctor(props.doctorId)
        Object.assign(form, {
          name: doctor.name,
          gender: doctor.gender,
          phone: doctor.phone,
          avatarFileId: doctor.avatarFileId,
          hospitalId: doctor.hospitalId,
          departmentId: doctor.departmentId,
          title: doctor.title,
          specialty: doctor.specialty,
          intro: doctor.intro,
          attachments: doctor.attachments ?? []
        })
        if (form.hospitalId) {
          departments.value = await listDepartmentsByHospital(form.hospitalId)
        }
      } finally {
        loading.value = false
      }
    } else {
      Object.assign(form, {
        name: '',
        gender: 'MALE',
        phone: '',
        avatarFileId: null,
        hospitalId: null,
        departmentId: null,
        title: '',
        specialty: '',
        intro: '',
        attachments: []
      })
      departments.value = []
    }
  }
)

async function onHospitalChange(hospitalId: number) {
  form.departmentId = null
  departments.value = await listDepartmentsByHospital(hospitalId)
}

function beforeUpload(file: File): boolean {
  const allowed = ['jpg', 'jpeg', 'png', 'pdf']
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!allowed.includes(extension)) {
    ElMessage.error('仅支持 jpg、png、pdf 文件')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件不能超过 10MB')
    return false
  }
  return true
}

async function doUpload(options: UploadRequestOptions) {
  const file = options.file as File
  const fileType = file.name.includes('执业') ? 'PRACTICE_LICENSE' : 'QUALIFICATION'
  try {
    const uploaded = await uploadFile(file, 'DOCTOR_ATTACHMENT')
    form.attachments = [...(form.attachments ?? []), { fileId: Number(uploaded.fileId), fileType }]
    ElMessage.success('附件已上传，保存后生效')
  } catch {
    ElMessage.error('附件上传失败')
  }
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  submitting.value = true
  try {
    if (props.doctorId) {
      if (!userStore.has('DOCTOR_UPDATE')) {
        ElMessage.error('无编辑医生权限')
        return
      }
      await updateDoctor(props.doctorId, { ...form })
      ElMessage.success('医生信息已更新')
    } else {
      if (!userStore.has('DOCTOR_CREATE')) {
        ElMessage.error('无新增医生权限')
        return
      }
      await createDoctor({ ...form })
      ElMessage.success('医生已创建，进入待审核')
    }
    emit('update:visible', false)
    emit('saved')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.upload-tip {
  font-size: 12px;
  color: var(--hp-ink-soft);
}
</style>
