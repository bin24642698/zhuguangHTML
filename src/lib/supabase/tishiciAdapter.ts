/**
 * Tishici适配器
 * 将tishiciService适配为与promptService相同的接口，以便无缝替换
 */
import { Prompt } from '@/data/database/types/prompt';
import { UserPromptSelection } from '@/data/database/types/userPromptSelection';
import {
  getAllPromptsFromTishici,
  getPromptsByTypeFromTishici,
  getPromptByIdFromTishici,
  addPromptToTishici,
  updatePromptInTishici,
  deletePromptFromTishici,
  getPublicPromptsFromTishici,
  copyPromptToMyAccount as copyTishiciToMyAccount
} from './tishiciService';
import {
  getUserTishiciSelectionsFromSupabase,
  addUserTishiciSelectionToSupabase,
  removeUserTishiciSelectionFromSupabase,
  isTishiciSelectedByUserInSupabase
} from './userTishiciSelectionService';

/**
 * 获取所有提示词
 * @param decryptContent 是否解密内容
 * @param onlyUserPrompts 是否只获取当前用户的提示词
 * @returns 提示词数组
 */
export const getAllPromptsFromSupabase = async (decryptContent: boolean = false, onlyUserPrompts: boolean = false): Promise<Prompt[]> => {
  return getAllPromptsFromTishici(decryptContent, onlyUserPrompts);
};

/**
 * 根据类型获取提示词
 * @param type 提示词类型
 * @param decryptContent 是否解密内容
 * @param onlyUserPrompts 是否只获取当前用户的提示词
 * @returns 提示词数组
 */
export const getPromptsByTypeFromSupabase = async (type: Prompt['type'], decryptContent: boolean = false, onlyUserPrompts: boolean = false): Promise<Prompt[]> => {
  return getPromptsByTypeFromTishici(type, decryptContent, onlyUserPrompts);
};

/**
 * 根据ID获取提示词
 * @param id 提示词ID
 * @param decryptContent 是否解密内容
 * @returns 提示词或null
 */
export const getPromptByIdFromSupabase = async (id: string, decryptContent: boolean = false): Promise<Prompt | null> => {
  return getPromptByIdFromTishici(id, decryptContent);
};

/**
 * 添加提示词
 * @param prompt 提示词
 * @param sendDecrypted 是否发送解密内容到Supabase
 * @returns 添加后的提示词
 */
export const addPromptToSupabase = async (prompt: Omit<Prompt, 'id'>, sendDecrypted: boolean = true): Promise<Prompt> => {
  return addPromptToTishici(prompt, sendDecrypted);
};

/**
 * 更新提示词
 * @param prompt 提示词
 * @param sendDecrypted 是否发送解密内容到Supabase
 * @returns 更新后的提示词
 */
export const updatePromptInSupabase = async (prompt: Prompt, sendDecrypted: boolean = true): Promise<Prompt> => {
  return updatePromptInTishici(prompt, sendDecrypted);
};

/**
 * 删除提示词
 * @param id 提示词ID
 */
export const deletePromptFromSupabase = async (id: string): Promise<void> => {
  return deletePromptFromTishici(id);
};

/**
 * 获取所有公开提示词
 * @param type 提示词类型（可选）
 * @param decryptContent 是否解密内容
 * @returns 提示词数组
 */
export const getPublicPromptsFromSupabase = async (type?: Prompt['type'], decryptContent: boolean = false): Promise<Prompt[]> => {
  return getPublicPromptsFromTishici(type, decryptContent);
};

/**
 * 复制提示词到自己的账户
 * @param promptId 要复制的提示词ID
 * @returns 复制后的提示词
 */
export const copyPromptToMyAccount = async (promptId: string): Promise<Prompt> => {
  return copyTishiciToMyAccount(promptId);
};

/**
 * 获取用户选择的提示词ID列表
 * @returns 提示词ID数组
 */
export const getUserPromptSelectionsFromSupabase = async (): Promise<string[]> => {
  // 直接返回字符串ID，不进行转换
  return await getUserTishiciSelectionsFromSupabase();
};

/**
 * 添加提示词到用户选择
 * @param promptId 提示词ID
 * @returns 添加的用户提示词选择
 */
export const addUserPromptSelectionToSupabase = async (promptId: string): Promise<UserPromptSelection> => {
  return addUserTishiciSelectionToSupabase(promptId);
};

/**
 * 从用户选择中移除提示词
 * @param promptId 提示词ID
 */
export const removeUserPromptSelectionFromSupabase = async (promptId: string): Promise<void> => {
  return removeUserTishiciSelectionFromSupabase(promptId);
};

/**
 * 检查提示词是否已被用户选择
 * @param promptId 提示词ID
 * @returns 是否已被选择
 */
export const isPromptSelectedByUserInSupabase = async (promptId: string): Promise<boolean> => {
  return isTishiciSelectedByUserInSupabase(promptId);
};
