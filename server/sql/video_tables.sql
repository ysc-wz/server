-- 视频表
CREATE TABLE IF NOT EXISTS videos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(255),
  category VARCHAR(50),
  status ENUM('draft', 'published', 'private') DEFAULT 'published',
  is_featured BOOLEAN DEFAULT FALSE,
  is_hot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 视频评论表
CREATE TABLE IF NOT EXISTS video_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  video_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  parent_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES video_comments(id) ON DELETE CASCADE
);

-- 视频点赞表
CREATE TABLE IF NOT EXISTS video_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  video_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_video_like (video_id, user_id)
);

-- 视频播放记录表
CREATE TABLE IF NOT EXISTS video_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  video_id INT NOT NULL,
  user_id INT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 插入测试数据
INSERT INTO videos (title, description, url, thumbnail, category, status)
VALUES 
('测试视频1', '这是一个测试视频', '/videos/test1.mp4', '/images/video-covers/test1.jpg', '测试', 'published'),
('测试视频2', '这是另一个测试视频', '/videos/test2.mp4', '/images/video-covers/test2.jpg', '测试', 'published'); 