import { std } from "wow/wotlk"; // 导入TSWoW标准库

// /​**​
//  * 创建商店商品表（如果不存在）
//  * 
//  * 该表用于存储商店中可购买的商品信息
//  */
std.SQL.Databases.world_dest.writeEarly(`
    CREATE TABLE IF NOT EXISTS \`store_items\` (
    id INT NOT NULL AUTO_INCREMENT,             -- 商品ID（自增主键）
    flags INT(10) UNSIGNED NOT NULL DEFAULT '0', -- 商品标志位（用于特殊标记）
    cost INT NOT NULL,                          -- 商品价格（所需点数）
    name VARCHAR(100) NOT NULL,                 -- 商品名称（最大100字符）
    description VARCHAR(255) NOT NULL,          -- 商品描述（最大255字符）
    category INT NOT NULL,                      -- 商品分类ID
    purchase_id INT(10) UNSIGNED NOT NULL DEFAULT '0', -- 购买后获得的物品/服务ID
    extra_id INT(10) UNSIGNED NOT NULL DEFAULT '0',   -- 额外关联ID（如法术ID、坐骑ID等）
    PRIMARY KEY (id)                            -- 设置id为主键
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; -- 使用InnoDB引擎和UTF8MB4字符集
`);

// /​**​
//  * 检查账户表中是否已存在'donation_points'列
//  * 
//  * 如果不存在，则添加该列用于存储玩家的捐赠点数
//  */
const d = std.SQL.Databases.auth.read(
  `SELECT COLUMN_NAME 
   FROM information_schema.COLUMNS 
   WHERE TABLE_NAME='account' 
     AND TABLE_SCHEMA=DATABASE() 
     AND COLUMN_NAME='donation_points'`
);

// 如果查询结果为空，说明列不存在
if (d.length === 0) {
  // 向account表添加donation_points列（如果不存在）
  std.SQL.Databases.auth.writeEarly(
    `ALTER TABLE \`account\` 
     ADD COLUMN IF NOT EXISTS donation_points INT DEFAULT 0;` // 默认值为0
  );
}

// /​**​
//  * 创建商店审计表（如果不存在）
//  * 
//  * 该表用于记录所有购买交易，便于追踪和审计
//  */
std.SQL.Databases.world_dest.writeEarly(`
CREATE TABLE IF NOT EXISTS \`store_audit\` (
    transaction_id INT NOT NULL AUTO_INCREMENT, -- 交易ID（自增主键）
    cost INT NOT NULL,                           -- 交易金额（消耗点数）
    name VARCHAR(100) NOT NULL,                  -- 商品名称
    description VARCHAR(255) NOT NULL,            -- 商品描述
    account_id INT UNSIGNED NOT NULL,             -- 购买者账户ID
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 购买时间（默认当前时间）
    PRIMARY KEY (transaction_id)                 -- 设置transaction_id为主键
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; -- 使用InnoDB引擎和UTF8MB4字符集
`);