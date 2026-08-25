<template>
  <div class="not-found">
    <svg class="pulse" viewBox="0 0 120 24" aria-hidden="true">
      <polyline
        points="0,12 22,12 32,5 46,20 58,12 84,12 94,8 104,16 120,12"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />
    </svg>
    <h1>404</h1>
    <p>页面不存在，或你没有访问该页面的权限。</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<style scoped>
.not-found {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--hp-ink-soft);
}

.pulse {
  width: 120px;
  color: var(--hp-primary);
}

h1 {
  margin: 0;
  color: var(--hp-ink);
  font-size: 40px;
}
</style>
