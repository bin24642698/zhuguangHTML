/**
 * Supabase 提示词服务 (tishici表)
 * 提供与 Supabase tishici表的交互功能
 */
import { supabase } from '../supabase';
import { Prompt } from '@/data/database/types/prompt';
import { getCurrentUser } from '../supabase';
import { encryptText, decryptText, generateEncryptionKey } from '../utils/encryption';

// Supabase提示词类型 (tishici表)
interface SupabaseTishici {
  id: string;                      // UUID
  user_id: string;                 // UUID
  title: string;                   // 标题
  content: string;                 // 内容
  type: string;                    // 类型
  description: string | null;      // 描述
  examples: any[] | null;          // 示例 (JSONB类型)
  is_public: boolean;              // 是否公开
  public_changed_at: string;       // 公开状态修改时间
  created_at: string;              // 创建时间
  updated_at: string;              // 更新时间
}

// 转换Supabase提示词到本地提示词格式
const convertToLocalPrompt = async (tishici: SupabaseTishici, keepDecrypted: boolean = false): Promise<Prompt> => {
  const user = await getCurrentUser();
  if (!user) throw new Error('用户未登录');

  let content = tishici.content;
  const key = generateEncryptionKey(user.id);

  // 默认情况下，接收到的内容是解密状态，需要加密
  if (!keepDecrypted && !content.startsWith('U2F')) {
    try {
      content = encryptText(content, key);
    } catch (error) {
      console.error('加密提示词内容失败:', error);
      // 加密失败时保持原样
    }
  } else if (keepDecrypted && content.startsWith('U2F')) {
    // 如果需要解密内容
    try {
      content = decryptText(content, key);

      // 检查是否存在嵌套加密
      let decryptAttempts = 0;
      while (content.startsWith('U2F') && decryptAttempts < 3) {
        console.log(`检测到嵌套加密，尝试再次解密 (尝试 ${decryptAttempts + 1}/3)`);
        content = decryptText(content, key);
        decryptAttempts++;
      }

      // 如果解密后仍然是加密格式，记录错误
      if (content.startsWith('U2F')) {
        console.warn('提示词可能存在多层嵌套加密，无法完全解密');
      }
    } catch (error) {
      console.error('解密提示词内容失败:', error);
      // 解密失败时保持原样
    }
  }

  return {
    id: tishici.id, // 使用UUID作为ID
    title: tishici.title,
    type: tishici.type as Prompt['type'],
    content: content,
    description: tishici.description || undefined,
    examples: tishici.examples || undefined,
    isPublic: tishici.is_public,
    userId: tishici.user_id,
    publicChangedAt: new Date(tishici.public_changed_at),
    createdAt: new Date(tishici.created_at),
    updatedAt: new Date(tishici.updated_at)
  };
};

// 转换本地提示词到Supabase提示词格式
const convertToSupabaseTishici = async (prompt: Omit<Prompt, 'id'>, sendDecrypted: boolean = true): Promise<Omit<SupabaseTishici, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'public_changed_at'>> => {
  let content = prompt.content;

  // 获取用户
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('用户未登录');
  }

  const key = generateEncryptionKey(user.id);

  // 如果需要发送解密内容到Supabase
  if (sendDecrypted) {
    // 检查内容是否已加密
    if (content.startsWith('U2F')) {
      try {
        // 尝试解密
        content = decryptText(content, key);

        // 检查是否存在嵌套加密
        let decryptAttempts = 0;
        while (content.startsWith('U2F') && decryptAttempts < 3) {
          console.log(`检测到嵌套加密，尝试再次解密 (尝试 ${decryptAttempts + 1}/3)`);
          content = decryptText(content, key);
          decryptAttempts++;
        }

        // 如果解密后仍然是加密格式，记录错误
        if (content.startsWith('U2F')) {
          console.warn('提示词可能存在多层嵌套加密，无法完全解密');
        }
      } catch (error) {
        console.error('解密提示词内容失败:', error);
        // 解密失败时保持原样
      }
    }
  } else {
    // 如果需要加密内容（保留原有逻辑，但默认不执行）
    if (!content.startsWith('U2F')) {
      content = encryptText(content, key);
    }
  }

  return {
    title: prompt.title,
    type: prompt.type,
    content: content,
    description: prompt.description || null,
    examples: prompt.examples || null,
    is_public: prompt.isPublic || false
  };
};

/**
 * 获取所有提示词
 * @param keepDecrypted 是否保持解密状态
 * @param onlyUserPrompts 是否只获取当前用户的提示词
 * @returns 提示词数组
 */
export const getAllPromptsFromTishici = async (keepDecrypted: boolean = false, onlyUserPrompts: boolean = false): Promise<Prompt[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    let query = supabase
      .from('tishici')
      .select('*')
      .order('updated_at', { ascending: false });

    // 如果只获取当前用户的提示词
    if (onlyUserPrompts) {
      query = query.eq('user_id', user.id);
    } else {
      // 获取用户自己的提示词和公开的提示词
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 使用Promise.all处理异步的convertToLocalPrompt
    return Promise.all((data as SupabaseTishici[]).map(tishici => convertToLocalPrompt(tishici, keepDecrypted)));
  } catch (error) {
    console.error('获取提示词失败:', error);
    throw error;
  }
};

/**
 * 根据类型获取提示词
 * @param type 提示词类型
 * @param keepDecrypted 是否保持解密状态
 * @param onlyUserPrompts 是否只获取当前用户的提示词
 * @returns 提示词数组
 */
export const getPromptsByTypeFromTishici = async (type: Prompt['type'], keepDecrypted: boolean = false, onlyUserPrompts: boolean = false): Promise<Prompt[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    let query = supabase
      .from('tishici')
      .select('*')
      .eq('type', type)
      .order('updated_at', { ascending: false });

    // 如果只获取当前用户的提示词
    if (onlyUserPrompts) {
      query = query.eq('user_id', user.id);
    } else {
      // 获取用户自己的提示词和公开的提示词
      query = query.or(`user_id.eq.${user.id},is_public.eq.true`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 使用Promise.all处理异步的convertToLocalPrompt
    return Promise.all((data as SupabaseTishici[]).map(tishici => convertToLocalPrompt(tishici, keepDecrypted)));
  } catch (error) {
    console.error(`获取类型为 ${type} 的提示词失败:`, error);
    throw error;
  }
};

/**
 * 根据ID获取提示词
 * @param id 提示词ID
 * @param keepDecrypted 是否保持解密状态
 * @returns 提示词或null
 */
export const getPromptByIdFromTishici = async (id: string, keepDecrypted: boolean = false): Promise<Prompt | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    const { data, error } = await supabase
      .from('tishici')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // 记录不存在
      throw error;
    }

    return data ? await convertToLocalPrompt(data as SupabaseTishici, keepDecrypted) : null;
  } catch (error) {
    console.error(`获取ID为 ${id} 的提示词失败:`, error);
    throw error;
  }
};

/**
 * 添加提示词
 * @param prompt 提示词
 * @param sendDecrypted 是否发送解密内容到Supabase
 * @returns 添加后的提示词
 */
export const addPromptToTishici = async (prompt: Omit<Prompt, 'id'>, sendDecrypted: boolean = true): Promise<Prompt> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    const supabaseTishici = await convertToSupabaseTishici(prompt, sendDecrypted);

    const { data, error } = await supabase
      .from('tishici')
      .insert([{ ...supabaseTishici, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;

    return convertToLocalPrompt(data as SupabaseTishici, false);
  } catch (error) {
    console.error('添加提示词失败:', error);
    throw error;
  }
};

/**
 * 更新提示词
 * @param prompt 提示词
 * @param sendDecrypted 是否发送解密内容到Supabase
 * @returns 更新后的提示词
 */
export const updatePromptInTishici = async (prompt: Prompt, sendDecrypted: boolean = true): Promise<Prompt> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    const supabaseTishici = await convertToSupabaseTishici(prompt, sendDecrypted);

    // 检查是否修改了公开状态
    let updateData: any = { ...supabaseTishici };

    // 获取当前提示词
    const { data: currentData, error: currentError } = await supabase
      .from('tishici')
      .select('is_public')
      .eq('id', prompt.id)
      .single();

    if (currentError) throw currentError;

    // 如果修改了公开状态，更新public_changed_at
    if (currentData && currentData.is_public !== prompt.isPublic) {
      updateData = {
        ...updateData,
        public_changed_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('tishici')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', prompt.id)
      .select()
      .single();

    if (error) throw error;

    return convertToLocalPrompt(data as SupabaseTishici, false);
  } catch (error) {
    console.error('更新提示词失败:', error);
    throw error;
  }
};

/**
 * 删除提示词
 * @param id 提示词ID
 */
export const deletePromptFromTishici = async (id: string): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    const { error } = await supabase
      .from('tishici')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('删除提示词失败:', error);
    throw error;
  }
};

/**
 * 获取所有公开提示词
 * @param type 提示词类型（可选）
 * @param keepDecrypted 是否保持解密状态
 * @returns 提示词数组
 */
export const getPublicPromptsFromTishici = async (type?: Prompt['type'], keepDecrypted: boolean = false): Promise<Prompt[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    let query = supabase
      .from('tishici')
      .select('*')
      .eq('is_public', true)
      .order('updated_at', { ascending: false });

    // 如果指定了类型，则按类型过滤
    if (type) {
      query = query.eq('type', type);
    }

    // 不排除用户自己的提示词，允许用户在推荐页面看到自己的公开提示词

    const { data, error } = await query;

    if (error) throw error;

    // 使用Promise.all处理异步的convertToLocalPrompt
    return Promise.all((data as SupabaseTishici[]).map(tishici => convertToLocalPrompt(tishici, keepDecrypted)));
  } catch (error) {
    console.error('获取公开提示词失败:', error);
    throw error;
  }
};

/**
 * 复制提示词到自己的账户
 * @param promptId 要复制的提示词ID
 * @returns 复制后的提示词
 */
export const copyPromptToMyAccount = async (promptId: string): Promise<Prompt> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('用户未登录');

    // 获取原始提示词
    const originalPrompt = await getPromptByIdFromTishici(promptId, true);
    if (!originalPrompt) throw new Error('提示词不存在');

    // 检查提示词是否公开
    if (!originalPrompt.isPublic) throw new Error('此提示词不允许复制');

    // 创建新的提示词
    const newPrompt: Omit<Prompt, 'id'> = {
      title: `${originalPrompt.title} (复制)`,
      type: originalPrompt.type,
      content: originalPrompt.content,
      description: originalPrompt.description,
      examples: originalPrompt.examples,
      isPublic: false, // 默认设为私有
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 添加到自己的账户
    return await addPromptToTishici(newPrompt);
  } catch (error) {
    console.error(`复制ID为 ${promptId} 的提示词失败:`, error);
    throw error;
  }
};
