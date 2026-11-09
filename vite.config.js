import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 浏览器只请求同源的 /api，由 Vite 开发服务器转发到云端 Spring。
      // 从 8799（fleetkeeper 本机面板）切到 8090（Spring 云端）后，
      // 代理层不变，只换 target —— 前端代码无需知道后端在哪。
      // 生产环境的等价物是 Nginx 反向代理，概念相同。
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
      },
    },
  },
})
