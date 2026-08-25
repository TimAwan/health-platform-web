<template>
  <el-tag :class="`status-tag status-${status}`" :type="tagType" effect="light">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const LABELS: Record<string, string> = {
  PENDING_REVIEW: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  SUSPENDED: '已暂停',
  TERMINATED: '已解约',
  ON_SHELF: '上架',
  OFF_SHELF: '下架',
  ACTIVE: '合作中',
  ENABLED: '启用',
  DISABLED: '禁用',
  SUCCESS: '成功',
  FAIL: '失败'
}

const TYPES: Record<string, string> = {
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'info',
  TERMINATED: 'danger',
  ON_SHELF: 'success',
  OFF_SHELF: 'info',
  ACTIVE: 'success',
  ENABLED: 'success',
  DISABLED: 'danger',
  SUCCESS: 'success',
  FAIL: 'danger'
}

const label = computed(() => LABELS[props.status] ?? props.status)
const tagType = computed(() => (TYPES[props.status] ?? 'info') as 'success' | 'warning' | 'danger' | 'info')
</script>
