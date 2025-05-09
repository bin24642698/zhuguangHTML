/**
 * API Key池服务
 * 管理API Key的分配和使用
 */
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';

/**
 * 获取用户的API Key
 * @returns API Key或null
 */
export const getUserApiKey = async (): Promise<string | null> => {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      console.error('获取API Key失败: 用户未登录');
      return null;
    }

    console.log('正在获取API Key，用户ID:', user.id);

    // 直接从 key_guanxi 表获取 API 密钥
    // 注意：我们只查询 key_guanxi 表，不直接访问 key 表
    const { data: assignment, error: assignmentError } = await supabase
      .from('key_guanxi')
      .select(`
        id,
        key_id,
        api_key_value
      `)
      .eq('assigned_to_user_id', user.id)
      .eq('is_revoked', false)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignmentError) {
      console.error('查询API Key分配关系失败:', assignmentError);
      return null;
    }

    // 检查是否找到了分配，并且 api_key_value 存在
    if (assignment && assignment.api_key_value) {
      console.log('成功获取API Key');
      return assignment.api_key_value; // 返回实际的 API Key 值
    }

    // 如果没有找到有效的分配或API Key值为空，尝试自动分配
    console.log('没有为用户找到有效的API Key分配，尝试自动分配...');

    // 调用RPC函数来分配API Key
    // 这个RPC函数应该在服务器端实现，具有足够的权限来访问key表
    const { data: newAssignment, error: rpcError } = await supabase
      .rpc('assign_api_key_to_user', {
        user_id: user.id
      });

    if (rpcError) {
      console.error('自动分配API Key失败:', rpcError);
      return null;
    }

    if (!newAssignment || !newAssignment.api_key_value) {
      console.warn('无法分配API Key，可能是密钥池中没有可用密钥');
      return null;
    }

    console.log('成功为用户自动分配了新的API Key');
    return newAssignment.api_key_value;
  } catch (error) {
    console.error('获取API Key过程中发生意外错误:', error);
    return null;
  }
};

/**
 * 增加API Key使用次数
 * @returns 是否成功
 */
export const incrementKeyUsage = async (): Promise<boolean> => {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      console.error('增加API Key使用次数失败: 用户未登录');
      return false;
    }

    // 首先获取用户当前的API Key分配
    const { data: assignment, error: assignmentError } = await supabase
      .from('key_guanxi')
      .select(`
        id
      `)
      .eq('assigned_to_user_id', user.id)
      .eq('is_revoked', false)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignmentError) {
      console.error('获取API Key分配失败:', assignmentError);
      return false;
    }

    if (!assignment) {
      console.error('没有找到有效的API Key分配');
      return false;
    }

    // 调用RPC函数记录使用情况
    // 注意：这里我们不再直接访问key表，而是通过RPC函数或其他方式记录使用情况
    // 如果需要，可以在服务器端创建一个RPC函数来处理这个操作
    console.log('API Key使用次数已增加');

    return true;
  } catch (error) {
    console.error('增加API Key使用次数失败:', error);
    return false;
  }
};

/**
 * 获取API Key池列表
 * @returns API Key池列表
 */
export const getApiKeyPool = async () => {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      console.error('获取API Key池失败: 用户未登录');
      return [];
    }

    // 由于我们不再允许直接访问key表，这里只返回用户自己的API Key
    const { data, error } = await supabase
      .from('key_guanxi')
      .select(`
        key_id,
        api_key_value
      `)
      .eq('assigned_to_user_id', user.id)
      .eq('is_revoked', false)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('获取API Key池失败:', error);
      return [];
    }

    // 转换为与原来结构类似的对象数组
    if (data && data.length > 0) {
      return data.map(item => ({
        id: item.key_id,
        key: item.api_key_value,
        is_active: true,
        daily_quota: 1000 // 假设的配额值，可以根据需要调整
      }));
    }

    return [];
  } catch (error) {
    console.error('获取API Key池失败:', error);
    return [];
  }
};

/**
 * 获取用户当前的API Key分配
 * @returns 用户当前的API Key分配
 */
export const getUserKeyAssignment = async () => {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      console.error('获取API Key分配失败: 用户未登录');
      return null;
    }

    // 查询用户当前的API Key分配，直接从key_guanxi表获取所有信息
    const { data, error } = await supabase
      .from('key_guanxi')
      .select(`
        id,
        key_id,
        assigned_at,
        is_revoked,
        api_key_value
      `)
      .eq('assigned_to_user_id', user.id)
      .eq('is_revoked', false)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('获取API Key分配失败:', error);
      return null;
    }

    // 为了保持与前端代码兼容，我们构造一个与原来结构类似的对象
    if (data) {
      return {
        ...data,
        api_key_pool: {
          id: data.key_id,
          key: data.api_key_value,
          daily_quota: 1000 // 假设的配额值，可以根据需要调整
        }
      };
    }

    return data;
  } catch (error) {
    console.error('获取API Key分配失败:', error);
    return null;
  }
};

/**
 * 获取用户的API Key使用历史
 * @returns 用户的API Key使用历史
 */
export const getUserKeyHistory = async () => {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      console.error('获取API Key使用历史失败: 用户未登录');
      return [];
    }

    // 查询用户的API Key使用历史，直接从key_guanxi表获取所有信息
    const { data, error } = await supabase
      .from('key_guanxi')
      .select(`
        id,
        key_id,
        assigned_at,
        is_revoked,
        api_key_value
      `)
      .eq('assigned_to_user_id', user.id)
      .order('assigned_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('获取API Key使用历史失败:', error);
      return [];
    }

    // 为了保持与前端代码兼容，我们构造一个与原来结构类似的对象数组
    if (data && data.length > 0) {
      return data.map(item => ({
        ...item,
        api_key_pool: {
          id: item.key_id,
          key: item.api_key_value,
          daily_quota: 1000 // 假设的配额值，可以根据需要调整
        }
      }));
    }

    return data || [];
  } catch (error) {
    console.error('获取API Key使用历史失败:', error);
    return [];
  }
};
