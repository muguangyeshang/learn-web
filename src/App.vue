<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MyCard from './components/MyCard.vue'

// ---- 概念：ref 是「会盯数据变的盒子」--------------------------------
// loading：还没拿到数据时显示占位
// error：  请求失败时给一句人话
// services：真实服务列表（来自 fleetkeeper /api/state）
const loading = ref(true)
const error = ref('')
const services = ref([])
const overview = ref(null)
let timer = null

// 把 L0-L4 翻成中文，模板里直接调用
function levelText(l) {
  if (l >= 4) return '正常 L4'
  if (l >= 3) return '部分正常 L3'
  if (l >= 1) return '仅存活 L1-L2'
  return '未通过 L0'
}

// 每张卡片的颜色随等级变（动态 class，Vue 又一个核心概念）
function tone(s) {
  if ((s.level_number || 0) >= 4) return 'ok'
  if ((s.level_number || 0) >= 3) return 'warn'
  return 'bad'
}

// ---- 概念：async/await 请求 ----------------------------------------
// async 函数里可以「等待」网络返回，代码读起来像同步流程。
async function load() {
  try {
    // 走 Vite 代理：浏览器以为在请求自己网站的 /api，
    // 实际被转发到 127.0.0.1:8799（fleetkeeper 面板）
    const r = await fetch('/api/state')
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const data = await r.json()
    services.value = data.services || []
    overview.value = data.overview || null
    error.value = ''
  } catch (e) {
    error.value = '读取失败：' + e.message + '（面板没在跑？）'
  } finally {
    loading.value = false
  }
}

// ---- 概念：生命周期钩子 --------------------------------------------
// onMounted = 组件出现在页面上时执行一次；这里顺便每 8 秒自动刷新
onMounted(() => {
  load()
  timer = setInterval(load, 8000)
})
onUnmounted(() => clearInterval(timer)) // 组件销毁时清理，防止内存泄漏
</script>

<template>
  <h1>Fleet 状态板（Vue 版）</h1>

  <p v-if="loading">正在读取服务…</p>

  <p v-else-if="error" style="color:#c0392b">{{ error }}</p>

  <template v-else>
    <!-- 概念：插值 {{ }} 里也能写表达式 -->
    <p>
      共 {{ overview?.total ?? services.length }} 个服务 ·
      正常 {{ overview?.healthy ?? 0 }} ·
      每 8 秒自动刷新
    </p>

    <!-- 概念：v-for 列表渲染 + :key -->
    <MyCard
      v-for="s in services"
      :key="s.key"
      :title="s.name + ' :' + s.port"
      :body="levelText(s.level_number || 0) + ' · 心跳 ' + (s.heartbeat || '-')"
      :tone="tone(s)"
    />
  </template>
</template>
