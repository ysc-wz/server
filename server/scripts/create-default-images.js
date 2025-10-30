const fs = require('fs');
const path = require('path');

// 创建默认缩略图
const defaultThumb = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="169" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f0f0f0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle" dy=".3em">暂无缩略图</text>
</svg>`;

// 确保目录存在
const defaultsDir = path.join(__dirname, '../../public/images/defaults');
if (!fs.existsSync(defaultsDir)) {
  fs.mkdirSync(defaultsDir, { recursive: true });
}

// 写入默认缩略图
fs.writeFileSync(
  path.join(defaultsDir, 'default-video-thumb.svg'),
  defaultThumb
);

// 创建示例缩略图
const sampleThumb = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="169" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#e0e0e0"/>
  <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#666" text-anchor="middle" dy=".3em">示例视频缩略图</text>
</svg>`;

const videoCoversDir = path.join(__dirname, '../../public/images/video-covers');
if (!fs.existsSync(videoCoversDir)) {
  fs.mkdirSync(videoCoversDir, { recursive: true });
}

// 创建示例缩略图
['featured.jpg', 'ev-review.jpg', 'luxury.jpg'].forEach(filename => {
  fs.writeFileSync(
    path.join(videoCoversDir, filename),
    sampleThumb
  );
});

console.log('默认图片和示例缩略图创建完成'); 