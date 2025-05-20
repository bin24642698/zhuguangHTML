'use client';

import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 受保护的路由组件 - 静态导出版本
 *
 * 注意：这是为了静态导出而修改的临时版本
 * 在实际部署时应该使用完整的认证逻辑
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 静态导出版本直接返回子组件，不做任何认证检查
  return <>{children}</>;
}
