const fs = require('fs');
const path = require('path');

// 创建必要的目录
const dirs = [
  path.join(__dirname), // sample-videos 目录
  path.join(__dirname, '../sample-images'), // sample-images 目录
  path.join(__dirname, '../../public/videos'), // public/videos 目录
  path.join(__dirname, '../../public/images/video-covers'), // public/images/video-covers 目录
  path.join(__dirname, '../../public/images/defaults') // public/images/defaults 目录
];

// 确保所有必要的目录都存在
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
});

// 创建一个简单的文本文件作为示例视频
const sampleContent = 'This is a sample video file';
const files = [
  'featured.mp4',
  'ev-review.mp4',
  'luxury.mp4'
];

// 创建示例视频文件
files.forEach(file => {
  const filePath = path.join(__dirname, file);
  fs.writeFileSync(filePath, sampleContent);
  console.log(`创建视频文件: ${filePath}`);
});

// 创建示例缩略图
const sampleImage = `
<svg width="300" height="169" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle">示例缩略图</text>
</svg>
`;

const imageFiles = [
  'featured.jpg',
  'ev-review.jpg',
  'luxury.jpg'
];

// 创建示例缩略图文件
imageFiles.forEach(file => {
  const filePath = path.join(__dirname, '../sample-images', file);
  fs.writeFileSync(filePath, sampleImage);
  console.log(`创建缩略图: ${filePath}`);

  // 同时复制到 public 目录
  const publicPath = path.join(__dirname, '../../public/images/video-covers', file);
  fs.writeFileSync(publicPath, sampleImage);
  console.log(`复制缩略图到 public: ${publicPath}`);
});

// 创建默认缩略图
const defaultThumbPath = path.join(__dirname, '../../public/images/defaults/default-video-thumb.svg');
fs.writeFileSync(defaultThumbPath, sampleImage);
console.log(`创建默认缩略图: ${defaultThumbPath}`);

console.log('示例文件创建完成'); 