const ZhipuAI = require('./index');
const { ZHIPU_API_KEY } = require('./config');

async function testZhipuAI() {
  const zhipu = new ZhipuAI(ZHIPU_API_KEY);

  const messages = [
    { role: 'user', content: '你是谁？' },
    { role: 'assistant', content: '我是智谱AI助手，可以帮助你解决各种问题。' },
    { role: 'user', content: '你好啊！' }
  ];

  try {
    console.log('发送请求中...');
    console.log('问题内容:', messages[0].content);
    const response = await zhipu.chat(messages);
    console.log('\n模型回答:');
    console.log(response.choices[0].message.content);
    
    console.log('\nToken使用情况:', response.usage);
  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testZhipuAI();
}

module.exports = testZhipuAI;  // 导出测试函数以便其他模块使用 