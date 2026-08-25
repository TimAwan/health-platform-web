<template>
  <div class="page-card">
    <div class="table-toolbar">
      <span class="dim">菜单供后台侧边栏与角色分配使用。目录类型不填组件路径。</span>
      <el-button v-permission="'MENU_UPDATE'" type="primary" @click="openForm()">新增菜单</el-button>
    </div>

    <el-table v-loading="loading" :data="tree" row-key="id" default-expand-all stripe>
      <el-table-column prop="name" label="名称" width="180" />
      <el-table-column prop="path" label="路径" width="170" class="num" />
      <el-table-column prop="component" label="组件" min-width="160" class="num" />
      <el-table-column prop="sort" label="排序" width="70" class="num" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button v-permission="'MENU_UPDATE'" link type="primary" @click="openForm(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="formVisible" :title="editing ? '编辑菜单' : '新增菜单'" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="父菜单" prop="parentId">
          <el-select v-model="form.parentId" placeholder="根目录" clearable>
            <el-option label="根目录" :value="0" />
            <el-option v-for="m in directoryOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="菜单名称" />
        </el-form-item>
        <el-form-item label="路径" prop="path">
          <el-input v-model="form.path" placeholder="如 /doctor/list" class="num" />
        </el-form-item>
        <el-form-item label="组件" prop="component">
          <el-input v-model="form.component" placeholder="如 doctor/list，目录留空" class="num" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
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
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'
import { fetchMenuTree, createMenu, updateMenu } from '@/api/system'
import type { MenuNode } from '@/api/auth'

const loading = ref(false)
const tree = ref<MenuNode[]>([])

const formVisible = ref(false)
const submitting = ref(false)
const editing = ref<MenuNode | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ parentId: 0, name: '', path: '', component: '', sort: 0 })

const rules: FormRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路径', trigger: 'blur' }]
}

const directoryOptions = computed(() => tree.value.filter((m) => !m.component || (m.children?.length ?? 0) > 0))

async function load() {
  loading.value = true
  try {
    tree.value = await fetchMenuTree()
  } finally {
    loading.value = false
  }
}

function openForm(row?: MenuNode) {
  editing.value = row ?? null
  form.parentId = row?.parentId ?? 0
  form.name = row?.name ?? ''
  form.path = row?.path ?? ''
  form.component = row?.component ?? ''
  form.sort = row?.sort ?? 0
  formVisible.value = true
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  submitting.value = true
  try {
    const payload = {
      parentId: form.parentId || 0,
      name: form.name,
      path: form.path,
      component: form.component || null,
      sort: form.sort
    }
    if (editing.value) {
      await updateMenu(editing.value.id, payload)
      ElMessage.success('菜单已更新')
    } else {
      await createMenu(payload)
      ElMessage.success('菜单已创建')
    }
    formVisible.value = false
    load()
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
</style>
