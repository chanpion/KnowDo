import axios from 'axios';
import type { ApiResponse } from './types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 响应拦截器：统一处理 {code, data, message}
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse;
    if (body.code !== 0) {
      const error = new Error(body.message || '请求失败') as Error & { code: number };
      (error as Error & { code: number }).code = body.code;
      return Promise.reject(error);
    }
    // 直接返回 data 字段
    return body.data as any;
  },
  (error) => {
    if (error.response) {
      const msg = error.response.data?.message || error.response.statusText || '服务器错误';
      return Promise.reject(new Error(msg));
    }
    if (error.request) {
      return Promise.reject(new Error('网络连接失败，请检查网络'));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
