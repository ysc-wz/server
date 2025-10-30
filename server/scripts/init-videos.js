const pool = require('../db');
const path = require('path');
const fs = require('fs');

async function copyDefaultFiles() {
  const defaultFiles = {
    videos: [
      { src: path.join(__dirname, '../data/sample-videos/featured.mp4'), 
        dest: path.join(__dirname, '../../public/videos/featured.mp4') },
      { src: path.join(__dirname, '../data/sample-videos/ev-review.mp4'), 
        dest: path.join(__dirname, '../../public/videos/ev-review.mp4') },
      { src: path.join(__dirname, '../data/sample-videos/luxury.mp4'), 
        dest: path.join(__dirname, '../../public/videos/luxury.mp4') }
    ],
    thumbnails: [
      { src: path.join(__dirname, '../data/sample-images/featured.jpg'), 
        dest: path.join(__dirname, '../../public/images/video-covers/featured.jpg') },
      { src: path.join(__dirname, '../data/sample-images/ev-review.jpg'), 
        dest: path.join(__dirname, '../../public/images/video-covers/ev-review.jpg') },
      { src: path.join(__dirname, '../data/sample-images/luxury.jpg'), 
        dest: path.join(__dirname, '../../public/images/video-covers/luxury.jpg') }
    ]
  };

  // 确保目录存在
  const dirs = [
    path.join(__dirname, '../../public/videos'),
    path.join(__dirname, '../../public/images/video-covers')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 复制文件
  [...defaultFiles.videos, ...defaultFiles.thumbnails].forEach(file => {
    if (fs.existsSync(file.src)) {
      fs.copyFileSync(file.src, file.dest);
    }
  });
}

async function initVideos() {
  await copyDefaultFiles();
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 清空现有数据
    await connection.query('TRUNCATE TABLE videos');

    // 插入示例数据
    const sampleVideos = require('../data/sample-videos');
    for (const video of sampleVideos) {
      await connection.query(`
        INSERT INTO videos (
          title, description, url, thumbnail, duration,
          views, likes, category, status, is_featured, is_hot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        video.title, video.description, video.url, video.thumbnail,
        video.duration, video.views, video.likes, video.category,
        video.status, video.is_featured, video.is_hot
      ]);
    }

    await connection.commit();
    console.log('视频数据初始化成功');
  } catch (error) {
    await connection.rollback();
    console.error('初始化视频数据失败:', error);
  } finally {
    connection.release();
  }
}

initVideos().catch(console.error); 