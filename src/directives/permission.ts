import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

/**
 * v-permission="'DOCTOR_APPROVE'"：无权限时移除该元素（按钮级权限，说明书第 11 章）
 */
export const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const required = Array.isArray(binding.value) ? binding.value : [binding.value]
    const allowed = required.some((permission) => userStore.permissions.has(permission))
    if (!allowed) {
      el.parentNode?.removeChild(el)
    }
  }
}
