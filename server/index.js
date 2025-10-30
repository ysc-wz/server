const axios = require('axios');

class ZhipuAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    this.timeout = 30000; // 30秒
  }

  async chat(messages) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'glm-4',
          messages: messages
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('API 错误:', error.response.data);
        throw new Error(error.response.data.message || '智谱AI服务错误');
      } else if (error.request) {
        console.error('请求错误:', error.message);
        throw new Error('无法连接到智谱AI服务');
      } else {
        console.error('其他错误:', error.message);
        throw error;
      }
    }
  }

  async createAsyncTask(messages) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/async`,
        {
          model: 'glm-4',
          messages: messages
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data.request_id;
    } catch (error) {
      console.error('创建异步任务失败:', error.message);
      throw error;
    }
  }

  async queryTaskStatus(requestId) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/async/${requestId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('查询任务状态失败:', error.message);
      throw error;
    }
  }
}

module.exports = ZhipuAI; 