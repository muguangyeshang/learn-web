<script setup>
// props：父组件传进来的「参数」。defineProps 声明后模板里直接用。
defineProps({
  title: String,
  body: String,
  tone: { type: String, default: 'ok' }, // ok | warn | bad
})
</script>

<template>
  <!-- :class 绑定动态样式：tone 值决定左边框颜色 -->
  <div class="card" :class="tone">
    <h3>{{ title }}</h3>
    <p>{{ body }}</p>
  </div>
</template>

<style scoped>
/* scoped = 样式只作用于本组件，不会污染别的组件（CSS 隔离） */
.card {
  border: 1px solid #ddd;
  border-left-width: 4px;
  border-radius: 10px;
  padding: 14px;
  margin: 8px 0;
}
.card.ok   { border-left-color: #27ae60; }
.card.warn { border-left-color: #f39c12; }
.card.bad  { border-left-color: #c0392b; }
.card h3 { margin: 0 0 4px; font-size: 15px; }
.card p  { margin: 0; color: #555; font-size: 13px; }
</style>
