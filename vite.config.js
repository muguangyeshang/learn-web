import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 浏览器只请求同源的 /api，由 Vite 开发服务器转发到
      // fleetkeeper 面板——跨站防护和 CORS 都不会触发。
      // 生产环境的等价物是 Nginx 反向代理，概念相同。
      '/api': {
        target: 'http://127.0.0.1:8799',
        changeOrigin: true,
      },
    },
  },
})
