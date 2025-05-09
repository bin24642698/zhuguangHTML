/**
 * 检查key表和key_guanxi表的结构
 * 
 * 使用方法：
 * node src/scripts/check-key-tables.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 检查表是否存在
async function checkTable(tableName) {
  try {
    console.log(`检查表 ${tableName} 是否存在...`);
    
    // 尝试查询表的一条记录
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.error(`表 ${tableName} 不存在`);
      } else {
        console.error(`查询表 ${tableName} 时出错:`, error);
      }
      return false;
    }
    
    console.log(`表 ${tableName} 存在，获取到 ${data.length} 条记录`);
    if (data.length > 0) {
      console.log(`表 ${tableName} 的结构:`, Object.keys(data[0]));
    }
    
    return true;
  } catch (error) {
    console.error(`检查表 ${tableName} 时出错:`, error);
    return false;
  }
}

// 列出所有表
async function listTables() {
  try {
    console.log('获取数据库中的所有表...');
    
    // 查询pg_tables视图获取所有表
    const { data, error } = await supabase
      .rpc('get_tables');
    
    if (error) {
      console.error('获取表列表失败:', error);
      return;
    }
    
    console.log('数据库中的表:');
    data.forEach(table => {
      console.log(`- ${table}`);
    });
  } catch (error) {
    console.error('获取表列表失败:', error);
  }
}

// 主函数
async function main() {
  try {
    // 列出所有表
    await listTables();
    
    // 检查key表
    const keyTableExists = await checkTable('key');
    
    // 检查key_guanxi表
    const keyGuanxiTableExists = await checkTable('key_guanxi');
    
    // 检查旧的表名
    const apiKeyPoolExists = await checkTable('api_key_pool');
    const userApiKeyAssignmentsExists = await checkTable('user_api_key_assignments');
    
    console.log('\n检查结果:');
    console.log(`key表: ${keyTableExists ? '存在' : '不存在'}`);
    console.log(`key_guanxi表: ${keyGuanxiTableExists ? '存在' : '不存在'}`);
    console.log(`api_key_pool表: ${apiKeyPoolExists ? '存在' : '不存在'}`);
    console.log(`user_api_key_assignments表: ${userApiKeyAssignmentsExists ? '存在' : '不存在'}`);
  } catch (error) {
    console.error('执行检查时出错:', error);
  }
}

// 执行主函数
main();
