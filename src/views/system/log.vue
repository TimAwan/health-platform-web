<template>
  <div class="page-card">
    <div class="table-toolbar">
      <el-form inline @submit.prevent>
        <el-form-item label="操作人 ID">
          <el-input v-model="operatorId" placeholder="如 1" clearable style="width: 110px" class="num" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="目标类型">
          <el-input v-model="targetType" placeholder="如 DOCTOR" clearable style="width: 120px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table v-loading="loading" :data="rows" stripe>
      <el-table-column prop="createdAt" label="时间" width="170" class="num" />
      <el-table-column prop="operatorName" label="操作人" width="100" />
      <el-table-column prop="operation" label="操作" width="130" />
      <el-table-column prop="targetType" label="目标类型" width="120" />
      <el-table-column prop="targetId" label="目标 ID" width="110" class="num" />
      <el-table-column label="结果" width="80">
        <template #default="{ row }"><StatusTag :status="row.result" /></template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="130" class="num" />
      <el-table-column prop="requestId" label="请求 ID" width="150" class="num" show-overflow-tooltip />
    </el-table>
    <div v-if="!loading && rows.length === 0" class="empty-tip">暂无操作日志</div>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="load"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StatusTag from '@/components/StatusTag.vue'
import { pageOperationLogs, type OperationLog } from '@/api/system'

const loading = ref(false)
const rows = ref<OperationLog[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const operatorId = ref('')
const targetType = ref('')

async function load() {
  loading.value = true
  try {
    const result = await pageOperationLogs({
      page: page.value,
      size: size.value,
      operatorId: operatorId.value || undefined,
      targetType: targetType.value || undefined
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

onMounted(load)
</script>

<style scoped>
.empty-tip {
  text-align: center;
  color: var(--hp-ink-soft);
  padding: 24px 0 8px;
}
</style>
