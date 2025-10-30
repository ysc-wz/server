const express = require('express');
const router = express.Router();
const ZhipuAI = require('../index');
const { ZHIPU_API_KEY } = require('../config');

const zhipu = new ZhipuAI(ZHIPU_API_KEY);

// 存储会话历史
const sessionHistories = new Map();

// 系统提示词
const SYSTEM_PROMPT = `你是一个专业的汽车销售顾问，需要：
1. 熟悉各种汽车品牌和型号的特点
2. 能够根据客户需求推荐合适的车型
3. 回答要简洁专业，态度要亲切
4. 遇到不确定的信息要诚实告知
5. 注意保持对话的连贯性`;

router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    // 获取或初始化会话历史
    if (!sessionHistories.has(sessionId)) {
      sessionHistories.set(sessionId, [
        { role: 'system', content: SYSTEM_PROMPT }
      ]);
    }
    
    const history = sessionHistories.get(sessionId);
    
    // 添加用户消息
    history.push({ role: 'user', content: message });
    
    // 保持历史记录在合理范围内（最近10条）
    if (history.length > 11) { // system提示词 + 10条对话
      history.splice(1, 2); // 保留system提示词，删除最早的一组对话
    }
    
    // 调用API获取回复
    const response = await zhipu.chat(history);
    const reply = response.choices[0].message.content;
    
    // 添加助手回复到历史记录
    history.push({ role: 'assistant', content: reply });
    
    res.json({ message: reply });
  } catch (error) {
    console.error('客服聊天错误:', error);
    res.status(500).json({ 
      message: '抱歉，服务出现了点问题，请稍后再试。',
      error: error.message 
    });
  }
});

module.exports = router; 