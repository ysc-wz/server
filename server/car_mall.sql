/*
 Navicat Premium Data Transfer

 Source Server         : 123456
 Source Server Type    : MySQL
 Source Server Version : 50726
 Source Host           : localhost:3306
 Source Schema         : car_mall

 Target Server Type    : MySQL
 Target Server Version : 50726
 File Encoding         : 65001

 Date: 10/12/2024 15:42:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for banners
-- ----------------------------
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `sort_order` int(11) NULL DEFAULT 0,
  `is_active` tinyint(1) NULL DEFAULT 1,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of banners
-- ----------------------------
INSERT INTO `banners` VALUES (1, '/images/banners/banner1.jpg', '/category/suv', '豪华SUV专场', '尊享品质生活', 1, 1, '2024-12-02 18:49:53', '2024-12-02 18:49:53');
INSERT INTO `banners` VALUES (2, '/images/banners/banner2.jpg', '/category/electric', '新能源汽车', '驾驭未来科技', 2, 1, '2024-12-02 18:49:53', '2024-12-02 18:49:53');
INSERT INTO `banners` VALUES (3, '/images/banners/banner3.jpg', '/category/sports', '跑车系列', '激情与速度的完美邂逅', 3, 1, '2024-12-02 18:49:53', '2024-12-02 18:49:53');

-- ----------------------------
-- Table structure for brands
-- ----------------------------
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `description_long` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 16 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of brands
-- ----------------------------
INSERT INTO `brands` VALUES (1, '奔驰', '/images/logos/benz.png', '德国豪华汽车品牌', '梅赛德斯-奔驰是全球历史最悠久的汽车制造商，以其卓越的品质、创新的技术和优雅的设计闻名于世。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (2, '宝马', '/images/logos/bmw.png', '德国运动豪华品牌', '宝马以其卓越的驾驶乐趣和运动性能著称，是全球领先的豪华汽车品牌之一。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (3, '奥迪', '/images/logos/audi.png', '德国科技豪华品牌', '奥迪以其先进的科技、quattro四驱系统和现代设计语言而闻名。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (4, '保时捷', '/images/logos/porsche.png', '德国顶级跑车品牌', '保时捷是跑车领域的标杆，代表着极致的性能和精准的工程技术。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (5, '法拉利', '/images/logos/ferrari.png', '意大利超级跑车品牌', '法拉利是世界上最著名的超级跑车制造商，象征着速度与激情。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (6, '兰博基尼', '/images/logos/lamborghini.png', '意大利奢华跑车品牌', '兰博基尼以其夸张的设计和极致的性能著称。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (7, '特斯拉', '/images/logos/tesla.png', '美国电动车领导者', '特斯拉引领着电动汽车革命，以其创新科技和卓越性能重新定义了汽车行业。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (8, '丰田', '/images/logos/toyota.png', '日本可靠性标杆', '丰田是全球最大的汽车制造商，以其可靠性和混合动力技术闻名。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (9, '本田', '/images/logos/honda.png', '日本科技创新者', '本田以其创新的工程技术和高品质产品而著名。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (10, '日产', '/images/logos/nissan.png', '日本运动科技品牌', '日产以其GT-R超跑和电动车技术闻名于世。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (11, '雷克萨斯', '/images/logos/lexus.png', '日本豪华品牌', '雷克萨斯代表着日本的豪华与工艺，以其卓越的品质和舒适性著称。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (12, '沃尔沃', '/images/logos/volvo.png', '瑞典安全科技品牌', '沃尔沃是全球汽车安全技术的领导者，以其创新的安全系统闻名。', '2024-12-02 18:49:53');
INSERT INTO `brands` VALUES (13, '小米', '/images/logos/xiaomi.png', '国产新能源汽车', '小米是全球最大消费类IoT物联网平台，连接超过8.614亿台智能设备，进入全球100多个国家和地区。 [4] [250]全球智能手机和平板产品月活用户达6.858亿。 [1045] 小米系投资的公司超500家，覆盖智能硬件、生活消费用品、教育、游戏、社交网络、文化娱乐、医疗健康、汽车交通、金融等领域。', '2024-12-09 16:16:30');
INSERT INTO `brands` VALUES (14, '理想', '/images/logos/lixiang.png', '国产新能源汽车', '2018年10月，首款产品智能电动中大型SUV—理想ONE正式发布，并于2019年4月面市；12月，交付用户 [29]。2020年7月30日，在美国纳斯达克证券市场挂牌上市 [4]。2021年7月，理想汽车第100家直营零售中心正式开业 [159]；8月12日，在香港联交所主板挂牌上市 [28]。2022年6月，发布家庭智能旗舰SUV理想L9 [43]。2023年2月，发布家庭五座旗舰SUV理想L7 [104]。2024年3月1日，理想汽车首款5C高压纯电车型理想MEGA上市 [128]；4月，发布家庭五座豪华SUV全新理想L6 [147]。截至2023年12月31日，在全国已有467家零售中心，覆盖140个城市；售后维修中心及授权钣喷中心360家，覆盖209个城市', '2024-12-09 16:17:56');
INSERT INTO `brands` VALUES (15, '吉利', '/images/logos/geely.png', '国产新能源汽车', '吉利控股集团旗下拥有吉利汽车、领克汽车、几何汽车、极氪汽车、沃尔沃汽车、Polestar、宝腾汽车、路特斯汽车、伦敦电动汽车、远程新能源商用车、太力飞行汽车、曹操专车、荷马、盛宝银行、铭泰等众多国际知名品牌。', '2024-12-09 16:18:52');

-- ----------------------------
-- Table structure for car_categories
-- ----------------------------
DROP TABLE IF EXISTS `car_categories`;
CREATE TABLE `car_categories`  (
  `car_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`car_id`, `category_id`) USING BTREE,
  INDEX `category_id`(`category_id`) USING BTREE,
  CONSTRAINT `car_categories_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `car_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of car_categories
-- ----------------------------
INSERT INTO `car_categories` VALUES (1, 1, '2024-12-10 09:15:51');
INSERT INTO `car_categories` VALUES (1, 2, '2024-12-10 09:15:51');
INSERT INTO `car_categories` VALUES (2, 1, '2024-12-09 17:12:20');
INSERT INTO `car_categories` VALUES (2, 2, '2024-12-09 17:12:20');
INSERT INTO `car_categories` VALUES (3, 3, '2024-12-10 09:15:57');
INSERT INTO `car_categories` VALUES (3, 8, '2024-12-10 09:15:57');
INSERT INTO `car_categories` VALUES (3, 9, '2024-12-10 09:15:57');
INSERT INTO `car_categories` VALUES (4, 2, '2024-12-10 09:16:19');
INSERT INTO `car_categories` VALUES (4, 3, '2024-12-10 09:16:19');
INSERT INTO `car_categories` VALUES (4, 4, '2024-12-10 09:16:19');
INSERT INTO `car_categories` VALUES (5, 1, '2024-12-10 09:16:06');
INSERT INTO `car_categories` VALUES (5, 2, '2024-12-10 09:16:06');
INSERT INTO `car_categories` VALUES (6, 2, '2024-12-09 17:12:47');
INSERT INTO `car_categories` VALUES (6, 10, '2024-12-09 17:12:47');
INSERT INTO `car_categories` VALUES (8, 8, '2024-12-09 17:12:35');
INSERT INTO `car_categories` VALUES (8, 9, '2024-12-09 17:12:35');
INSERT INTO `car_categories` VALUES (10, 3, '2024-12-10 09:15:44');
INSERT INTO `car_categories` VALUES (10, 8, '2024-12-10 09:15:44');
INSERT INTO `car_categories` VALUES (10, 9, '2024-12-10 09:15:44');
INSERT INTO `car_categories` VALUES (12, 1, '2024-12-09 17:24:13');
INSERT INTO `car_categories` VALUES (12, 3, '2024-12-09 17:24:13');
INSERT INTO `car_categories` VALUES (12, 8, '2024-12-09 17:24:13');
INSERT INTO `car_categories` VALUES (13, 1, '2024-12-09 16:52:47');
INSERT INTO `car_categories` VALUES (13, 2, '2024-12-09 16:52:47');
INSERT INTO `car_categories` VALUES (13, 4, '2024-12-09 16:52:47');
INSERT INTO `car_categories` VALUES (14, 1, '2024-12-10 08:39:47');
INSERT INTO `car_categories` VALUES (14, 3, '2024-12-10 08:39:47');
INSERT INTO `car_categories` VALUES (14, 4, '2024-12-10 08:39:47');
INSERT INTO `car_categories` VALUES (15, 1, '2024-12-10 10:32:59');
INSERT INTO `car_categories` VALUES (15, 3, '2024-12-10 10:32:59');
INSERT INTO `car_categories` VALUES (15, 8, '2024-12-10 10:32:59');
INSERT INTO `car_categories` VALUES (15, 9, '2024-12-10 10:32:59');
INSERT INTO `car_categories` VALUES (16, 2, '2024-12-10 09:28:43');
INSERT INTO `car_categories` VALUES (16, 9, '2024-12-10 09:28:43');
INSERT INTO `car_categories` VALUES (17, 3, '2024-12-10 09:42:07');
INSERT INTO `car_categories` VALUES (17, 9, '2024-12-10 09:42:07');
INSERT INTO `car_categories` VALUES (22, 2, '2024-12-10 10:08:04');
INSERT INTO `car_categories` VALUES (22, 4, '2024-12-10 10:08:04');
INSERT INTO `car_categories` VALUES (23, 2, '2024-12-10 10:32:49');
INSERT INTO `car_categories` VALUES (24, 1, '2024-12-10 10:15:18');
INSERT INTO `car_categories` VALUES (24, 4, '2024-12-10 10:15:18');
INSERT INTO `car_categories` VALUES (25, 2, '2024-12-10 10:25:52');
INSERT INTO `car_categories` VALUES (25, 9, '2024-12-10 10:25:52');
INSERT INTO `car_categories` VALUES (26, 1, '2024-12-10 10:31:48');
INSERT INTO `car_categories` VALUES (26, 3, '2024-12-10 10:31:48');
INSERT INTO `car_categories` VALUES (26, 8, '2024-12-10 10:31:48');
INSERT INTO `car_categories` VALUES (27, 1, '2024-12-10 10:29:28');

-- ----------------------------
-- Table structure for cars
-- ----------------------------
DROP TABLE IF EXISTS `cars`;
CREATE TABLE `cars`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `brand_id` int(11) NOT NULL,
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12, 2) NOT NULL,
  `year` int(11) NOT NULL,
  `color` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `mileage` int(11) NULL DEFAULT 0,
  `body_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `specs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `features` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `engine_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `displacement` float NULL DEFAULT NULL,
  `power` int(11) NULL DEFAULT NULL,
  `torque` int(11) NULL DEFAULT NULL,
  `transmission` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `drive_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `seats` int(11) NULL DEFAULT NULL,
  `fuel_type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `images` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `status` enum('available','low_stock','out_of_stock','discontinued') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'available',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `brand_id`(`brand_id`) USING BTREE,
  CONSTRAINT `cars_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 28 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cars
-- ----------------------------
INSERT INTO `cars` VALUES (1, 1, 'S500', 1580000.00, 2024, '曜岩黑', 0, NULL, 10, '全新一代奔驰S500采用最新设计语言，搭载3.0T直列六缸发动机，配备全新MBUX智能系统。', NULL, NULL, '3.0T V6', NULL, NULL, NULL, '8速自动', NULL, NULL, '汽油', '/images/cars/benz/s500-1.jpg,/images/cars/benz/s500-2.jpg,/images/cars/benz/s500-3.jpg', 'available', '2024-12-02 18:49:53', '2024-12-10 09:15:52');
INSERT INTO `cars` VALUES (2, 2, 'X7', 1198000.00, 2024, '矿石白', 0, NULL, 10, '宝马X7是品牌旗舰级SUV，采用最新设计语言，搭载3.0T直列六缸发动机。', NULL, NULL, '3.0T V8', NULL, NULL, NULL, '8速自动', NULL, NULL, '汽油', '/images/cars/bmw/x7-1.jpg,/images/cars/bmw/x7-2.jpg,/images/cars/bmw/x7-3.jpg', 'available', '2024-12-02 18:49:53', '2024-12-09 17:12:21');
INSERT INTO `cars` VALUES (3, 4, '911', 1580000.00, 2024, '竞速黄', 0, NULL, 11, '保时捷911是跑车界的标杆，搭载3.0T水平对置六缸发动机。', NULL, NULL, '3.0T H6', NULL, NULL, NULL, '8速自动', NULL, NULL, '汽油', '/images/cars/porsche/911-1.jpg,/images/cars/porsche/911-2.jpg,/images/cars/porsche/911-3.jpg', 'available', '2024-12-02 18:49:53', '2024-12-10 09:15:58');
INSERT INTO `cars` VALUES (4, 7, 'Model Y', 266900.00, 2024, '珠白', 0, NULL, 8, '特斯拉Model Y是一款纯电动SUV，续航里程可达550公里。', NULL, NULL, '3.0T', NULL, NULL, NULL, '1速固定', NULL, NULL, '电动', '/images/cars/tesla/model-y-1.jpg,/images/cars/tesla/model-y-2.jpg,/images/cars/tesla/model-y-3.jpg', 'available', '2024-12-02 18:49:53', '2024-12-10 09:16:19');
INSERT INTO `cars` VALUES (5, 1, 'E300L', 498000.00, 2024, '极地白', 0, NULL, 6, '全新奔驰E300L豪华轿车，搭载2.0T涡轮增压发动机，配备智能驾驶辅助系统。', NULL, NULL, '2.0T L4', NULL, NULL, NULL, '9速自动', NULL, NULL, '汽油', '/images/cars/benz/e300-1.jpg,/images/cars/benz/e300-2.jpg', 'available', '2024-12-02 18:49:53', '2024-12-10 09:16:07');
INSERT INTO `cars` VALUES (6, 1, 'GLC300', 578000.00, 2024, '曜岩黑', 0, NULL, 10, '奔驰GLC300豪华SUV，完美诠释运动与优雅的结合。', NULL, NULL, '2.0T L4', NULL, NULL, NULL, '9速自动', NULL, NULL, '汽油', '/images/cars/benz/glc-1.jpg,/images/cars/benz/glc-2.jpg', 'available', '2024-12-02 18:49:53', '2024-12-09 17:12:48');
INSERT INTO `cars` VALUES (8, 5, 'F8 Tributo', 3380000.00, 2024, '法拉利红', 0, '双门跑车', 8, '法拉利F8 Tributo搭载3.9L V8双涡轮增压发动机，最大功率720PS，百公里加速2.9秒。', NULL, NULL, '3.9L V8 Twin-Turbo', 3.9, 530, 770, '7速双离合', '后驱', 2, '汽油', '/images/cars/car-1733735240138-139563400.jpg', 'available', '2024-12-02 18:49:53', '2024-12-09 17:12:35');
INSERT INTO `cars` VALUES (10, 6, '鸡你太美', 2.50, 2024, '灰，黄，红，黑', 0, NULL, 8, '鸡你太美，哦哦，bayby', NULL, NULL, '篮球', NULL, NULL, NULL, 'manual', NULL, NULL, 'hybrid', '/images/cars/car-1733200133545-394607012.jpg', 'available', '2024-12-03 12:09:15', '2024-12-10 10:11:59');
INSERT INTO `cars` VALUES (12, 4, '911-gt3', 10000.00, 2025, '白', 1, NULL, 10, '1111', NULL, NULL, '', NULL, NULL, NULL, 'cvt', NULL, NULL, 'hybrid', '/images/cars/car-1733736251460-589468606.jpg', 'available', '2024-12-03 14:25:26', '2024-12-09 17:24:13');
INSERT INTO `cars` VALUES (13, 13, '小米su7', 214900.00, 2024, '海湾蓝', 0, NULL, 10, 'XIAOMI SU7采用流畅曲线车身设计，车身尺寸为4997mm/1963mm/1440mm，轴距3000mm，提供"海湾蓝""雅灰""橄榄绿"三种配色。汽车搭载小米超级电机V6s及碳化硅高压系统，采用小米智能底盘，内置智能耦合制动系统、Xiaomi Pilot智能驾驶系统，以及基于Xiaomi HyperOS的智能座舱系统', NULL, NULL, '小米超级电机', NULL, NULL, NULL, 'auto', NULL, NULL, 'electric', '/images/cars/car-1733734365345-210825069.jpg', 'available', '2024-12-09 16:45:53', '2024-12-09 16:52:47');
INSERT INTO `cars` VALUES (14, 13, 'su7 Ultra', 814900.00, 2024, '黄黑', 0, NULL, 10, '小米SU7 Ultra量产车的长宽高分别为5115/1970/1465mm，轴距为3000mm。外观方面，小米SU7 Ultra量产车延续家族设计的同时，新增整套空气动力学套件，号称"可街可赛"；采用低趴设计，车长加长到5.1m，配有 U 形风刀、大前铲、气坝，尾部主动扩散器、碳纤维固定大尾翼 。在车身结构方面，小米SU7 Ultra量产车大量运用碳纤维材料，整车运用17处碳纤维，更为轻量化。 性能方面，小米SU7 Ultra量产车零百加速1.98秒，设计最高时速可达到350公里每小时，整车最大下压力可以达到285KG。补能方面，该车最大充电倍率可以达到5.2C，电量从10%充至80%仅需12分钟。', NULL, NULL, '小米超级电机s8', NULL, NULL, NULL, 'auto', NULL, NULL, 'electric', '/images/cars/car-1733735455913-646818624.jpg', 'available', '2024-12-09 17:11:13', '2024-12-10 08:39:47');
INSERT INTO `cars` VALUES (15, 4, '保时捷718', 600000.00, 2024, '红', 0, NULL, 10, '718 Boxster Style Edition 和 718 Cayman Style Edition 让城市生活更加缤纷多彩，外观和内饰都具有高度鲜明的设计亮点。这是创造力与运动感的碰撞——您的718 Style Edition 爱车 将使街道变成您的个人运动场。', NULL, NULL, '涡轮增压水平对置', NULL, NULL, NULL, 'auto', NULL, NULL, 'gasoline', '/images/cars/car-1733793649219-878615747.png', 'available', '2024-12-10 09:21:09', '2024-12-10 10:33:00');
INSERT INTO `cars` VALUES (16, 6, 'urus', 3000000.00, 2024, '黄', 0, NULL, 10, '超级跑车的灵魂和SUV的功能:Lamborghini Urus是世界首款超级SUV。Urus具有极端的比例、令人惊叹的设计、非凡的驾驶动力和令人震撼的性能,在其典型状态下展现自由。', NULL, NULL, '2.0TV8', NULL, NULL, NULL, 'dct', NULL, NULL, 'gasoline', '/images/cars/car-1733794118918-117839376.png', 'available', '2024-12-10 09:27:49', '2024-12-10 09:28:44');
INSERT INTO `cars` VALUES (17, 2, '宝马z4 m40i', 640000.00, 2024, '亮银', 0, NULL, 10, '经典的运动化跑车，驾控出彩，动力强劲', NULL, NULL, '3.0T V8', NULL, NULL, NULL, 'cvt', NULL, NULL, 'gasoline', '/images/cars/car-1733794918981-488489184.jpg', 'available', '2024-12-10 09:37:22', '2024-12-10 09:42:07');
INSERT INTO `cars` VALUES (22, 14, '理想L9', 500000.00, 2024, '黑色', 0, NULL, 10, '理想l9是一款创造移动的家，创造幸福的家，拥有旗舰级座椅、五屏三维全新屏幕、NVIDIA DRIVE Orin-X算力等智能驾驶配置，以及SPA级十六点按摩', NULL, NULL, '增程446马力', NULL, NULL, NULL, 'cvt', NULL, NULL, 'electric', '/images/cars/car-1733796280812-361767259.jpg', 'available', '2024-12-10 10:07:43', '2024-12-10 10:08:05');
INSERT INTO `cars` VALUES (23, 15, '星越', 200000.00, 2024, '银色', 0, '', 10, '有时白云起，天际自舒卷。8AT高性能动力，\n创造可游可居的生活空间。闲逸时畅快游览，\n出行时豪迈不羁，从容欣赏天地间云卷云舒', NULL, NULL, '2.0TD', NULL, NULL, NULL, 'cvt', '', NULL, 'gasoline', '/images/cars/car-1733796573731-888905149.jpg', 'available', '2024-12-10 10:10:21', '2024-12-10 10:32:49');
INSERT INTO `cars` VALUES (24, 7, 'model 3', 250000.00, 2024, '红色', 0, '', 10, '动感造型兼具效率，优化空气动力学表现，实现更长的续航里程，单次充电最高可达 713 公里（CLTC）', NULL, NULL, '增程电机', NULL, NULL, NULL, 'cvt', '', NULL, 'electric', '/images/cars/car-1733796848917-777297888.png', 'available', '2024-12-10 10:14:33', '2024-12-10 10:15:18');
INSERT INTO `cars` VALUES (25, 12, 'xc90', 900000.00, 2024, '银色', 0, '', 10, '此时，此刻 时尚、宽敞、不止一点，坐享北欧豪华旗舰型SUV，畅享舒适体验。', NULL, NULL, '2.0T 增程电机', NULL, NULL, NULL, 'cvt', '', NULL, 'hybrid', '/images/cars/car-1733797010523-106922954.png', 'available', '2024-12-10 10:18:54', '2024-12-10 10:25:53');
INSERT INTO `cars` VALUES (26, 10, 'GTR', 1000000.00, 2024, '银色', 0, '', 9, '日产GTR是一款高性能跑车，搭载3.8T发动机，拥有强劲的动力和优秀的操控性能。', NULL, NULL, '3.8TV6', NULL, NULL, NULL, 'manual', '', NULL, 'gasoline', '/images/cars/car-1733797497285-416216578.png', 'available', '2024-12-10 10:25:41', '2024-12-10 10:53:33');
INSERT INTO `cars` VALUES (27, 9, '雅阁', 25.00, 2024, '蓝色', 0, NULL, 10, '广汽本田全新雅阁是一款豪华中型轿车，拥有优雅的外观设计，灵动的双电机混合动力系统，智能的人机互联功能，以及全球首载的Honda SENSING 360+安全辅助系统。', NULL, NULL, '2.0T', NULL, NULL, NULL, 'cvt', NULL, NULL, 'gasoline', '/images/cars/car-1733797718893-816918589.png', 'available', '2024-12-10 10:29:19', '2024-12-10 10:29:29');

-- ----------------------------
-- Table structure for cart_items
-- ----------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `quantity` int(11) NULL DEFAULT 1,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id`) USING BTREE,
  INDEX `car_id`(`car_id`) USING BTREE,
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 55 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of cart_items
-- ----------------------------
INSERT INTO `cart_items` VALUES (54, 79, 1, 1, '2024-12-10 10:53:57', '2024-12-10 10:53:57');

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, 'sedan', '轿车', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (2, 'suv', 'SUV', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (3, 'sports', '跑车', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (4, 'electric', '纯电动', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (5, 'hybrid', '混合动力', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (6, 'mpv', 'MPV', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (7, 'pickup', '皮卡', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (8, 'supercar', '超跑', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (9, 'luxury', '豪华车', NULL, '2024-12-09 16:04:05');
INSERT INTO `categories` VALUES (10, 'offroad', '越野车', NULL, '2024-12-09 16:04:05');

-- ----------------------------
-- Table structure for comment_likes
-- ----------------------------
DROP TABLE IF EXISTS `comment_likes`;
CREATE TABLE `comment_likes`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_like`(`user_id`, `comment_id`) USING BTREE,
  INDEX `comment_id`(`comment_id`) USING BTREE,
  CONSTRAINT `comment_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `comment_likes_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comment_likes
-- ----------------------------
INSERT INTO `comment_likes` VALUES (7, 154, 6, '2024-12-05 10:34:11');
INSERT INTO `comment_likes` VALUES (8, 156, 6, '2024-12-05 10:38:36');
INSERT INTO `comment_likes` VALUES (9, 156, 7, '2024-12-05 10:38:38');
INSERT INTO `comment_likes` VALUES (10, 79, 6, '2024-12-05 10:45:02');
INSERT INTO `comment_likes` VALUES (13, 79, 7, '2024-12-06 16:07:52');
INSERT INTO `comment_likes` VALUES (14, 79, 15, '2024-12-06 16:07:52');
INSERT INTO `comment_likes` VALUES (17, 158, 39, '2024-12-07 17:51:12');
INSERT INTO `comment_likes` VALUES (19, 158, 15, '2024-12-07 17:51:15');
INSERT INTO `comment_likes` VALUES (20, 158, 7, '2024-12-07 17:51:17');
INSERT INTO `comment_likes` VALUES (21, 158, 6, '2024-12-07 17:51:19');
INSERT INTO `comment_likes` VALUES (23, 79, 48, '2024-12-10 10:51:20');
INSERT INTO `comment_likes` VALUES (24, 79, 49, '2024-12-10 10:51:31');

-- ----------------------------
-- Table structure for comment_replies
-- ----------------------------
DROP TABLE IF EXISTS `comment_replies`;
CREATE TABLE `comment_replies`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id`) USING BTREE,
  INDEX `comment_id`(`comment_id`) USING BTREE,
  CONSTRAINT `comment_replies_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `comment_replies_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 32 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comment_replies
-- ----------------------------
INSERT INTO `comment_replies` VALUES (4, 79, 7, 'sb', '2024-12-05 10:45:25');
INSERT INTO `comment_replies` VALUES (5, 158, 6, '楼主，你真的我哭死😭😭😭', '2024-12-06 15:58:27');
INSERT INTO `comment_replies` VALUES (6, 79, 7, '楼上的评论真对😋', '2024-12-06 16:00:11');
INSERT INTO `comment_replies` VALUES (7, 158, 6, '❤️❤️', '2024-12-06 16:03:04');
INSERT INTO `comment_replies` VALUES (8, 79, 15, '小黑子，漏出鸡脚了吧？😅😅😅🐔🐔🐔🐓🐓🐓', '2024-12-06 16:05:49');
INSERT INTO `comment_replies` VALUES (11, 79, 6, '🐧', '2024-12-06 17:34:08');
INSERT INTO `comment_replies` VALUES (18, 79, 39, '[emoji:害羞]', '2024-12-07 17:46:24');
INSERT INTO `comment_replies` VALUES (19, 158, 39, '[emoji:比心]', '2024-12-07 17:46:40');
INSERT INTO `comment_replies` VALUES (20, 79, 39, '[emoji:大笑]', '2024-12-07 17:58:37');
INSERT INTO `comment_replies` VALUES (21, 79, 40, '[emoji:泪水狗-2]', '2024-12-07 18:06:27');
INSERT INTO `comment_replies` VALUES (22, 79, 40, '[emoji:泪水狗-3]', '2024-12-07 18:06:34');
INSERT INTO `comment_replies` VALUES (23, 79, 41, '[emoji:坤坤-5]', '2024-12-07 18:21:23');
INSERT INTO `comment_replies` VALUES (24, 158, 41, '[emoji:坤坤-1]', '2024-12-07 18:22:19');
INSERT INTO `comment_replies` VALUES (25, 158, 43, '[emoji:good-15]', '2024-12-07 19:13:47');
INSERT INTO `comment_replies` VALUES (26, 79, 44, '[emoji:龙图-5]', '2024-12-07 21:03:37');
INSERT INTO `comment_replies` VALUES (27, 79, 44, '[emoji:龙图-4]', '2024-12-07 21:03:45');
INSERT INTO `comment_replies` VALUES (29, 79, 42, '[emoji:ggbond-10]', '2024-12-07 22:11:52');
INSERT INTO `comment_replies` VALUES (30, 79, 45, '[emoji:龙图-3]', '2024-12-09 17:13:31');
INSERT INTO `comment_replies` VALUES (31, 79, 46, 'good💕', '2024-12-10 10:10:40');

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  `content_type` enum('text','emoji','image') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'text',
  `media_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id`) USING BTREE,
  INDEX `car_id`(`car_id`) USING BTREE,
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 50 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES (6, 79, 10, '谁说这车不行啊，这车太棒了', '2024-12-05 10:33:51', 'text', NULL);
INSERT INTO `comments` VALUES (7, 154, 10, '现在安排你为核爆近距离观察员', '2024-12-05 10:35:40', 'text', NULL);
INSERT INTO `comments` VALUES (15, 158, 10, '这车简直太棒了，感觉再多看一眼就会爆炸🤩😍🤓', '2024-12-06 16:04:46', 'text', NULL);
INSERT INTO `comments` VALUES (39, 79, 10, '表情包功能测试🫰🫰🫰', '2024-12-07 17:45:03', 'text', NULL);
INSERT INTO `comments` VALUES (40, 158, 10, '[emoji:泪水狗-1]', '2024-12-07 17:53:07', 'text', NULL);
INSERT INTO `comments` VALUES (41, 79, 10, '[emoji:坤坤-3]', '2024-12-07 18:20:47', 'text', NULL);
INSERT INTO `comments` VALUES (42, 79, 10, '[emoji:ggbond-5]', '2024-12-07 19:03:17', 'text', NULL);
INSERT INTO `comments` VALUES (43, 158, 10, '[emoji:good-1]', '2024-12-07 19:13:12', 'text', NULL);
INSERT INTO `comments` VALUES (44, 79, 10, '[emoji:龙图-3]', '2024-12-07 21:03:23', 'text', NULL);
INSERT INTO `comments` VALUES (45, 79, 10, '[emoji:龙图-10]', '2024-12-07 22:08:25', 'text', NULL);
INSERT INTO `comments` VALUES (46, 79, 10, '[emoji:good-16]', '2024-12-10 09:43:09', 'text', NULL);
INSERT INTO `comments` VALUES (47, 79, 26, '[emoji:ggbond-9]', '2024-12-10 10:51:06', 'text', NULL);
INSERT INTO `comments` VALUES (48, 79, 26, '[emoji:good-1]', '2024-12-10 10:51:17', 'text', NULL);
INSERT INTO `comments` VALUES (49, 79, 26, '[emoji:good-19]', '2024-12-10 10:51:29', 'text', NULL);

-- ----------------------------
-- Table structure for favorites
-- ----------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites`  (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `id`(`id`) USING BTREE,
  UNIQUE INDEX `user_id`(`user_id`, `car_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of favorites
-- ----------------------------
INSERT INTO `favorites` VALUES (3, 5, 2, '2024-12-03 00:02:29');
INSERT INTO `favorites` VALUES (4, 5, 10, '2024-12-03 14:09:45');
INSERT INTO `favorites` VALUES (5, 79, 10, '2024-12-05 10:38:20');
INSERT INTO `favorites` VALUES (6, 158, 10, '2024-12-06 16:03:23');
INSERT INTO `favorites` VALUES (7, 79, 14, '2024-12-10 10:12:42');

-- ----------------------------
-- Table structure for order_items
-- ----------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `car_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `car_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(12, 2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `order_id`(`order_id`) USING BTREE,
  INDEX `car_id`(`car_id`) USING BTREE,
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 48 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of order_items
-- ----------------------------
INSERT INTO `order_items` VALUES (37, 35, 10, '鸡你太美', '/images/cars/car-1733200133545-394607012.jpg', 2.50, 5, '2024-12-04 19:20:18');
INSERT INTO `order_items` VALUES (38, 36, 10, '鸡你太美', '/images/cars/car-1733200133545-394607012.jpg', 2.50, 1, '2024-12-04 19:21:00');
INSERT INTO `order_items` VALUES (39, 37, 5, 'E300L', '/images/cars/benz/e300-1.jpg', 498000.00, 1, '2024-12-05 10:42:05');
INSERT INTO `order_items` VALUES (41, 38, 3, '911', '/images/cars/porsche/911-1.jpg', 1580000.00, 1, '2024-12-05 10:42:22');
INSERT INTO `order_items` VALUES (42, 39, 10, '鸡你太美', '/images/cars/car-1733200133545-394607012.jpg', 2.50, 1, '2024-12-06 15:50:52');
INSERT INTO `order_items` VALUES (43, 40, 10, '鸡你太美', '/images/cars/car-1733200133545-394607012.jpg', 2.50, 1, '2024-12-06 16:11:39');
INSERT INTO `order_items` VALUES (44, 41, 12, '911-gt3', '/images/cars/car-1733207123130-643681492.jpg', 10000.00, 10, '2024-12-06 16:12:28');
INSERT INTO `order_items` VALUES (45, 42, 10, '鸡你太美', '/images/cars/car-1733200133545-394607012.jpg', 2.50, 1, '2024-12-10 09:42:12');
INSERT INTO `order_items` VALUES (46, 43, 10, '鸡你太美', '/images/cars/car-1733200133545-394607012.jpg', 2.50, 1, '2024-12-10 10:11:59');
INSERT INTO `order_items` VALUES (47, 44, 26, 'GTR', '/images/cars/car-1733797497285-416216578.png', 1000000.00, 1, '2024-12-10 10:53:33');

-- ----------------------------
-- Table structure for orders
-- ----------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(12, 2) NOT NULL,
  `status` enum('pending','paid','shipped','delivered','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'pending',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `order_no`(`order_no`) USING BTREE,
  INDEX `user_id`(`user_id`) USING BTREE,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 45 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of orders
-- ----------------------------
INSERT INTO `orders` VALUES (35, 'ORD1733311218641577', 79, 12.50, 'paid', '2024-12-04 19:20:18', '2024-12-04 19:20:18');
INSERT INTO `orders` VALUES (36, 'ORD1733311260427478', 79, 2.50, 'paid', '2024-12-04 19:21:00', '2024-12-04 19:21:00');
INSERT INTO `orders` VALUES (37, 'ORD1733366525063941', 154, 2778000.00, 'shipped', '2024-12-05 10:42:05', '2024-12-05 10:42:43');
INSERT INTO `orders` VALUES (38, 'ORD1733366542679914', 156, 1580000.00, 'shipped', '2024-12-05 10:42:22', '2024-12-05 10:42:39');
INSERT INTO `orders` VALUES (39, 'ORD1733471452734428', 79, 2.50, 'paid', '2024-12-06 15:50:52', '2024-12-06 15:50:52');
INSERT INTO `orders` VALUES (40, 'ORD173347269983777', 79, 2.50, 'paid', '2024-12-06 16:11:39', '2024-12-06 16:11:39');
INSERT INTO `orders` VALUES (41, 'ORD1733472748297593', 79, 100000.00, 'paid', '2024-12-06 16:12:28', '2024-12-06 16:12:28');
INSERT INTO `orders` VALUES (42, 'ORD1733794932023244', 79, 2.50, 'paid', '2024-12-10 09:42:12', '2024-12-10 09:42:12');
INSERT INTO `orders` VALUES (43, 'ORD1733796719193383', 79, 2.50, 'paid', '2024-12-10 10:11:59', '2024-12-10 10:11:59');
INSERT INTO `orders` VALUES (44, 'ORD1733799213794114', 79, 1000000.00, 'paid', '2024-12-10 10:53:33', '2024-12-10 10:53:33');

-- ----------------------------
-- Table structure for user_notifications
-- ----------------------------
DROP TABLE IF EXISTS `user_notifications`;
CREATE TABLE `user_notifications`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `from_user_id` int(11) NOT NULL,
  `type` enum('like','reply') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `comment_id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `is_read` tinyint(1) NULL DEFAULT 0,
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id`) USING BTREE,
  INDEX `from_user_id`(`from_user_id`) USING BTREE,
  INDEX `comment_id`(`comment_id`) USING BTREE,
  INDEX `car_id`(`car_id`) USING BTREE,
  CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_notifications_ibfk_2` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_notifications_ibfk_3` FOREIGN KEY (`comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `user_notifications_ibfk_4` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_notifications
-- ----------------------------
INSERT INTO `user_notifications` VALUES (3, 79, 154, 'like', NULL, 6, 10, 0, '2024-12-05 10:34:11');
INSERT INTO `user_notifications` VALUES (4, 79, 156, 'like', NULL, 6, 10, 0, '2024-12-05 10:38:36');
INSERT INTO `user_notifications` VALUES (5, 154, 156, 'like', NULL, 7, 10, 0, '2024-12-05 10:38:38');
INSERT INTO `user_notifications` VALUES (7, 154, 79, 'reply', 'sb', 7, 10, 0, '2024-12-05 10:45:25');
INSERT INTO `user_notifications` VALUES (8, 79, 158, 'reply', '楼主，你真的我哭死😭😭😭', 6, 10, 0, '2024-12-06 15:58:27');
INSERT INTO `user_notifications` VALUES (9, 154, 79, 'reply', '楼上的评论真对😋', 7, 10, 0, '2024-12-06 16:00:11');
INSERT INTO `user_notifications` VALUES (11, 79, 158, 'reply', '❤️❤️', 6, 10, 0, '2024-12-06 16:03:04');
INSERT INTO `user_notifications` VALUES (12, 158, 79, 'reply', '小黑子，漏出鸡脚了吧？😅😅😅🐔🐔🐔🐓🐓🐓', 15, 10, 0, '2024-12-06 16:05:49');
INSERT INTO `user_notifications` VALUES (13, 154, 79, 'like', NULL, 7, 10, 0, '2024-12-06 16:07:52');
INSERT INTO `user_notifications` VALUES (14, 158, 79, 'like', NULL, 15, 10, 0, '2024-12-06 16:07:52');
INSERT INTO `user_notifications` VALUES (17, 79, 158, 'reply', '[emoji:比心]', 39, 10, 0, '2024-12-07 17:46:40');
INSERT INTO `user_notifications` VALUES (20, 79, 158, 'like', NULL, 39, 10, 0, '2024-12-07 17:51:12');
INSERT INTO `user_notifications` VALUES (22, 154, 158, 'like', NULL, 7, 10, 0, '2024-12-07 17:51:17');
INSERT INTO `user_notifications` VALUES (23, 79, 158, 'like', NULL, 6, 10, 0, '2024-12-07 17:51:19');
INSERT INTO `user_notifications` VALUES (24, 158, 79, 'reply', '[emoji:泪水狗-2]', 40, 10, 0, '2024-12-07 18:06:27');
INSERT INTO `user_notifications` VALUES (25, 158, 79, 'reply', '[emoji:泪水狗-3]', 40, 10, 0, '2024-12-07 18:06:34');
INSERT INTO `user_notifications` VALUES (26, 79, 158, 'reply', '[emoji:坤坤-1]', 41, 10, 0, '2024-12-07 18:22:19');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `role` enum('user','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'user',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username`) USING BTREE,
  UNIQUE INDEX `email`(`email`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 167 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (79, 'admin', '$2a$10$vr2nxYzFqs5xHEBvJOjBEuWv/JSImDR8MRzuSumQsFWw/IU/qgug2', 'admin@qq.com', '15520812898', '/uploads/avatars/avatar-1733307085888-245609857.png', 'admin', '2024-12-04 18:11:25', '2024-12-04 18:14:11');
INSERT INTO `users` VALUES (154, 'Kin Jong-un', '$2a$10$yfx5qBhOMl.icNQSVgFO5Oo5/.doGlj8Yghx8Bu1GcHFYIpS9siKS', 'linxyz2003@gmail.com', '1008611', '/uploads/avatars/avatar-1733365891379-116216308.webp', 'user', '2024-12-05 10:30:44', '2024-12-05 10:31:31');
INSERT INTO `users` VALUES (155, '小文', '$2a$10$S8kV/jhdmjGizn29ebxmyOVslI2SD.i63Fb7L94Wb4JOihOg2CH2O', '3248083220@qq.com', '18722915421', '/uploads/avatars/avatar-1733365916307-611282532.jpg', 'admin', '2024-12-05 10:31:56', '2024-12-05 10:33:08');
INSERT INTO `users` VALUES (156, 'mingzi123', '$2a$10$wiKo/c.2DAV5nTkng9QtIOE5w38siTZrWKZ/7Q0OLxiqKc447zedS', '2219692157@qq.com', NULL, '/uploads/avatars/avatar-1733366292776-364939843.png', 'user', '2024-12-05 10:38:12', '2024-12-05 10:38:12');
INSERT INTO `users` VALUES (158, 'user', '$2a$10$hLwpwm3MLGgxR9pm0SOvmuQXwkmxVP.m/DIiVcLn1ap/EQYMT7WJ6', 'user@qq.com', '15520812898', '/uploads/avatars/avatar-1733471351244-988121965.png', 'user', '2024-12-06 15:49:12', '2024-12-06 16:14:03');
INSERT INTO `users` VALUES (166, '白洲梓小姐', '$2a$10$Hj6mn/60dvz7uEZv0H6n5OqF.8G6Lwdmf6rVsd1.cLAA7nLX9vfla', '1614870044@QQ.COM', '15308114866', '/uploads/avatars/avatar-1733792921645-986994771.jpg', 'admin', '2024-12-10 09:08:44', '2024-12-10 09:10:03');

-- ----------------------------
-- Table structure for videos
-- ----------------------------
DROP TABLE IF EXISTS `videos`;
CREATE TABLE `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT '视频标题',
  `description` text COMMENT '视频描述',
  `url` varchar(255) NOT NULL COMMENT '视频URL',
  `thumbnail` varchar(255) COMMENT '缩略图URL',
  `duration` varchar(10) COMMENT '视频时长',
  `views` int(11) DEFAULT 0 COMMENT '观看次数',
  `likes` int(11) DEFAULT 0 COMMENT '点赞数',
  `category` enum('car_review','news','event','tutorial') DEFAULT 'car_review' COMMENT '视频分类',
  `status` enum('draft','published','private') DEFAULT 'published' COMMENT '视频状态',
  `is_featured` tinyint(1) DEFAULT 0 COMMENT '是否推荐',
  `is_hot` tinyint(1) DEFAULT 0 COMMENT '是否热门',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Records of videos
-- ----------------------------
INSERT INTO `videos` VALUES (1, '2024新车预览', '探索即将上市的新款车型', '/videos/featured.mp4', '/images/video-covers/featured.jpg', '3:45', 125000, 3200, 'news', 'published', 1, 1, '2024-01-15 10:00:00', '2024-01-15 10:00:00');
INSERT INTO `videos` VALUES (2, '新能源汽车测评', '最新电动车性能对比', '/videos/ev-review.mp4', '/images/video-covers/ev-review.jpg', '5:20', 82000, 2100, 'car_review', 'published', 1, 1, '2024-01-10 14:30:00', '2024-01-10 14:30:00');
INSERT INTO `videos` VALUES (3, '豪华车品鉴', '近距离感受顶级豪华车的尊崇品质', '/videos/luxury.mp4', '/images/video-covers/luxury.jpg', '4:15', 68000, 1800, 'car_review', 'published', 0, 0, '2024-01-05 16:45:00', '2024-01-05 16:45:00');

-- ----------------------------
-- Table structure for video_likes
-- ----------------------------
DROP TABLE IF EXISTS `video_likes`;
CREATE TABLE `video_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_video_unique` (`user_id`,`video_id`),
  KEY `video_id` (`video_id`),
  CONSTRAINT `video_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `video_likes_ibfk_2` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for video_comments
-- ----------------------------
DROP TABLE IF EXISTS `video_comments`;
CREATE TABLE `video_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `likes` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `video_id` (`video_id`),
  CONSTRAINT `video_comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `video_comments_ibfk_2` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for video_views
-- ----------------------------
DROP TABLE IF EXISTS `video_views`;
CREATE TABLE `video_views` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `video_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `video_id` (`video_id`),
  CONSTRAINT `video_views_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `video_views_ibfk_2` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for video_comment_likes
-- ----------------------------
DROP TABLE IF EXISTS `video_comment_likes`;
CREATE TABLE `video_comment_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_comment_unique` (`user_id`,`comment_id`),
  KEY `comment_id` (`comment_id`),
  CONSTRAINT `video_comment_likes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `video_comment_likes_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `video_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for video_comment_replies
-- ----------------------------
DROP TABLE IF EXISTS `video_comment_replies`;
CREATE TABLE `video_comment_replies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `comment_id` (`comment_id`),
  CONSTRAINT `video_comment_replies_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `video_comment_replies_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `video_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
