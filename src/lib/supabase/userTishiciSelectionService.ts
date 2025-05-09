/**
 * Supabase 用户提示词选择服务 (tishici版本)
 * 提供与 Supabase user_tishici_selections表的交互功能
 */
import { supabase } from '../supabase';
import { UserPromptSelection } from '@/data/database/types/userPromptSelection';
import { getCurrentUser } from '../supabase';

// Supabase用户提示词选择类型
interface SupabaseUserTishiciSelection {
  id: string;
  user_id: string;
  tishici_id: string;
  created_at: string;
}

/**
 * 将Supabase用户提示词选择转换为本地用户提示词选择
 * @param supabaseSelection Supabase用户提示词选择
 * @returns 本地用户提示词选择
 */
const convertToLocalSelection = (supabaseSelection: SupabaseUserTishiciSelection): UserPromptSelection => {
  return {
    id: supabaseSelection.id, // 使用UUID作为ID
    userId: supabaseSelection.user_id,
    promptId: supabaseSelection.tishici_id, // 使用tishici_id作为promptId
    createdAt: new Date(supabaseSelection.created_at)
  };
};

/**
 * 获取用户选择的提示词ID列表
 * @returns 提示词ID数组
 */
export const getUserTishiciSelectionsFromSupabase = async (): Promise<string[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');
    
    const { data, error } = await supabase
      .from('user_tishici_selections')
      .select('tishici_id')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return (data as { tishici_id: string }[]).map(item => item.tishici_id);
  } catch (error) {
    console.error('获取用户提示词选择失败:', error);
    throw error;
  }
};

/**
 * 添加提示词到用户选择
 * @param tishiciId 提示词ID
 * @returns 添加的用户提示词选择
 */
export const addUserTishiciSelectionToSupabase = async (tishiciId: string): Promise<UserPromptSelection> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');
    
    // 检查是否已经添加过
    const { data: existingData, error: existingError } = await supabase
      .from('user_tishici_selections')
      .select('*')
      .eq('user_id', user.id)
      .eq('tishici_id', tishiciId)
      .maybeSingle();
    
    if (existingError) throw existingError;
    
    // 如果已经添加过，直接返回
    if (existingData) {
      return convertToLocalSelection(existingData as SupabaseUserTishiciSelection);
    }
    
    // 添加新的选择
    const { data, error } = await supabase
      .from('user_tishici_selections')
      .insert([{
        user_id: user.id,
        tishici_id: tishiciId
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return convertToLocalSelection(data as SupabaseUserTishiciSelection);
  } catch (error) {
    console.error('添加用户提示词选择失败:', error);
    throw error;
  }
};

/**
 * 从用户选择中移除提示词
 * @param tishiciId 提示词ID
 */
export const removeUserTishiciSelectionFromSupabase = async (tishiciId: string): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');
    
    const { error } = await supabase
      .from('user_tishici_selections')
      .delete()
      .eq('user_id', user.id)
      .eq('tishici_id', tishiciId);
    
    if (error) throw error;
  } catch (error) {
    console.error('移除用户提示词选择失败:', error);
    throw error;
  }
};

/**
 * 检查提示词是否已被用户选择
 * @param tishiciId 提示词ID
 * @returns 是否已被选择
 */
export const isTishiciSelectedByUserInSupabase = async (tishiciId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');
    
    const { data, error } = await supabase
      .from('user_tishici_selections')
      .select('*')
      .eq('user_id', user.id)
      .eq('tishici_id', tishiciId)
      .maybeSingle();
    
    if (error) throw error;
    
    return !!data;
  } catch (error) {
    console.error('检查提示词是否已被选择失败:', error);
    throw error;
  }
};
