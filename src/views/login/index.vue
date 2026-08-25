<template>
  <div class="login-page">
    <aside class="brand-panel">
      <svg class="pulse" viewBox="0 0 120 24" aria-hidden="true">
        <polyline
          points="0,12 22,12 32,5 46,20 58,12 84,12 94,8 104,16 120,12"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        />
      </svg>
      <h1>健康管理平台</h1>
      <p class="tagline">签约医生 · 医院科室 · 权限审计，一站式后台管理</p>
    </aside>

    <main class="form-panel">
      <el-card class="login-card">
        <h2>后台登录</h2>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :disabled="loading" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="请输入密码"
              :disabled="loading"
            />
          </el-form-item>
          <el-form-item label="验证码" prop="captchaCode">
            <div class="captcha-row">
              <el-input v-model="form.captchaCode" placeholder="请输入验证码" :disabled="loading" />
              <img
                v-if="captchaImage"
                :src="captchaImage"
                class="captcha-image"
                alt="验证码"
                title="点击刷新"
                @click="loadCaptcha"
              />
            </div>
          </el-form-item>
          <el-button type="primary" class="submit" :loading="loading" @click="submit">
            {{ loading ? '登录中…' : '登录' }}
          </el-button>
        </el-form>
      </el-card>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { fetchCaptcha } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const captchaImage = ref('')
const form = reactive({
  username: '',
  password: '',
  captchaId: '',
  captchaCode: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

async function loadCaptcha() {
  try {
    const data = await fetchCaptcha()
    form.captchaId = data.captchaId
    captchaImage.value = data.image
  } catch {
    ElMessage.error('验证码加载失败，请点击图片重试')
  }
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  loading.value = true
  try {
    await userStore.login({ ...form })
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    loadCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(loadCaptcha)
</script>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(360px, 44%) 1fr;
  height: 100%;
}

.brand-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  padding: 64px;
  color: #e7f3f1;
  background:
    radial-gradient(circle at 20% 20%, rgba(45, 212, 191, 0.14), transparent 42%),
    linear-gradient(160deg, #0b2a27 0%, #0f766e 130%);
}

.brand-panel h1 {
  margin: 0;
  font-size: 34px;
  letter-spacing: 4px;
  font-weight: 600;
}

.pulse {
  width: 120px;
  color: #2dd4bf;
}

.tagline {
  margin: 0;
  color: #b9d8d4;
  font-size: 14px;
  letter-spacing: 1px;
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hp-bg);
}

.login-card {
  width: 380px;
  border: none;
}

.login-card h2 {
  margin: 4px 0 20px;
  color: var(--hp-ink);
}

.captcha-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.captcha-image {
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #d8e0df;
}

.submit {
  width: 100%;
}

@media (max-width: 768px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .brand-panel {
    display: none;
  }
}
</style>
