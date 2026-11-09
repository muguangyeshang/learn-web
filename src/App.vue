<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MyCard from './components/MyCard.vue'

// ---- 数据源：Spring 云端（经 Vite 同源代理）--------------------------
// 与 UniApp 小程序是同一张表：各端 fleetkeeper 上报，云端汇聚。
// 字段来自 com.muguang.fleet.model.ServiceEntity。
const loading = ref(true)
const error = ref('')
const services = ref([])
const token = ref('')
const refreshing = ref(false)
let timer = null

// 教学版固定账号；真实项目换成登录表单页，把凭据交给用户填写
const DEMO_USER = { username: 'admin', password: 'admin123' }

// 汇总：总数、健康数、上报机器列表
const overview = computed(() => ({
  total: services.value.length,
  healthy: services.value.filter(s => (s.level || 0) >= 4).length,
  reporters: [...new Set(services.value.map(s => s.note).filter(Boolean))],
}))

function levelText(l) {
  if (l >= 4) return '正常 L4'
  if (l >= 3) return '部分正常 L3'
  if (l >= 1) return '仅存活 L1-L2'
  return '未通过 L0'
}

function tone(s) {
  if ((s.level || 0) >= 4) return 'ok'
  if ((s.level || 0) >= 3) return 'warn'
  return 'bad'
}

// ---- JWT：登录 -> 存 token -> 每个请求带 Bearer -----------------------
// token 只放在内存里（刷新页面重新登录），不写 localStorage：
// 学习项目避免 XSS 直接读到长期凭据，这是最小代价的取舍。
async function login() {
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(DEMO_USER),
  })
  if (!r.ok) throw new Error('登录失败 HTTP ' + r.status)
  const data = await r.json()
  if (!data.token) throw new Error('登录响应缺少 token')
  token.value = data.token
}

// 单一请求出口：统一附带 Bearer，401 时重登一次再重试
async function api(path, retried = false) {
  const r = await fetch(path, {
    headers: token.value ? { Authorization: 'Bearer ' + token.value } : {},
  })
  if (r.status === 401 && !retried) {
    await login()
    return api(path, true)
  }
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

async function load() {
  try {
    if (!token.value) await login()
    const rows = await api('/api/services')
    services.value = Array.isArray(rows) ? rows : []
    error.value = ''
  } catch (e) {
    error.value = '读取失败：' + e.message + '（云端 8090 没在跑？）'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

async function reload() {
  refreshing.value = true
  await load()
}

onMounted(() => {
  load()
  timer = setInterval(load, 8000) // 8 秒轮询，与小程序下拉刷新互为对照
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <h1>Fleet 状态板（Vue · 云端版）</h1>

  <p v-if="loading">正在登录并读取云端服务…</p>

  <p v-else-if="error" style="color:#c0392b">
    {{ error }}
    <button @click="reload">重试</button>
  </p>

  <template v-else>
    <p>
      共 {{ overview.total }} 个服务 ·
      正常 {{ overview.healthy }} ·
      来自 {{ overview.reporters.join(' / ') || '暂无上报' }} ·
      每 8 秒自动刷新
      <button :disabled="refreshing" @click="reload">{{ refreshing ? '刷新中…' : '立即刷新' }}</button>
    </p>

    <!-- v-for 列表渲染 + :key；每张卡带来源机器，对应多机汇聚 -->
    <MyCard
      v-for="s in services"
      :key="s.id"
      :title="s.name + ' :' + s.port"
      :body="levelText(s.level || 0) + ' · 心跳 ' + (s.heartbeat || '-') + ' · 来自 ' + (s.note || '未知')"
      :tone="tone(s)"
    />

    <p v-if="!services.length">云端还没有数据，先跑一台 fleetkeeper 的 -mode report。</p>
  </template>
</template>
