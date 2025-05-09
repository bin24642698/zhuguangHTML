/**
 * 验证工具函数
 */

/**
 * 验证标题
 * @param title 标题
 * @returns 错误信息或null
 */
export const validateTitle = (title: string): string | null => {
  if (!title.trim()) {
    return '标题不能为空';
  }

  if (title.length > 100) {
    return '标题不能超过100个字符';
  }

  return null;
};

/**
 * 验证内容
 * @param content 内容
 * @returns 错误信息或null
 */
export const validateContent = (content: string): string | null => {
  if (!content.trim()) {
    return '内容不能为空';
  }

  return null;
};

/**
 * 验证描述
 * @param description 描述
 * @returns 错误信息或null
 */
export const validateDescription = (description: string): string | null => {
  if (description.length > 500) {
    return '描述不能超过500个字符';
  }

  return null;
};

/**
 * 验证API密钥
 * @param apiKey API密钥
 * @returns 错误信息或null
 */
export const validateApiKey = (apiKey: string): string | null => {
  if (!apiKey.trim()) {
    return 'API密钥不能为空';
  }

  // 简单验证API密钥格式
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(apiKey)) {
    return 'API密钥格式不正确';
  }

  return null;
};

/**
 * 验证邮箱域名
 * @param email 邮箱
 * @returns 错误信息或null
 */
export const validateEmailDomain = (email: string): string | null => {
  if (!email.trim()) {
    return '邮箱不能为空';
  }

  // 基本邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return '邮箱格式不正确';
  }

  // 验证域名是否在允许列表中
  const allowedDomains = ['qq.com', '163.com', 'gmail.com'];
  const domain = email.split('@')[1].toLowerCase();

  if (!allowedDomains.includes(domain)) {
    return `邮箱域名不被支持，请使用 @qq.com、@163.com 或 @gmail.com 的邮箱`;
  }

  return null;
};
