'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import RechargeModal from '@/components/common/modals/RechargeModal';

/**
 * 用户账号按钮组件
 * 登录后显示用户账号信息
 */
export default function UserAccountButton() {
  const { user, signOut } = useAuth();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // 如果用户未登录，返回null
  if (!user) return null;

  // 用户ID和UID
  const userId = user.user_metadata?.display_name || user.user_metadata?.name || '未设置';
  const uid = user.id;

  return (
    <div className="relative">
      {/* 用户账号按钮 */}
      <button
        className="flex items-center space-x-1 text-text-dark hover:text-primary-green transition-colors duration-200"
        onClick={() => setShowUserInfo(!showUserInfo)}
      >
        <span className="material-icons text-xl">account_circle</span>
        <span>我的账号</span>
      </button>

      {/* 用户信息弹窗 */}
      {showUserInfo && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 z-50 border border-[rgba(120,180,140,0.3)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-text-dark">账号信息</h3>
            <button
              className="text-text-medium hover:text-text-dark"
              onClick={() => setShowUserInfo(false)}
            >
              <span className="material-icons text-sm">close</span>
            </button>
          </div>

          <div className="mb-4">
            <div className="mb-2">
              <p className="text-xs text-text-medium">用户ID（显示名称）</p>
              <p className="text-sm font-medium text-text-dark">{userId}</p>
            </div>
            <div>
              <p className="text-xs text-text-medium">UID</p>
              <p className="text-sm font-medium text-text-dark break-all">{uid}</p>
            </div>
          </div>

          {/* 充值按钮 */}
          <button
            className="w-full bg-blue-500 text-white py-1.5 px-4 rounded-full hover:bg-blue-600 transition-colors duration-200 text-sm mb-2"
            onClick={() => {
              setShowRechargeModal(true);
              setShowUserInfo(false); // 关闭用户信息弹窗
            }}
          >
            充值
          </button>

          <button
            className="w-full bg-primary-green text-white py-1.5 px-4 rounded-full hover:bg-[#4a8d5b] transition-colors duration-200 text-sm"
            onClick={() => {
              signOut();
              setShowUserInfo(false);
            }}
          >
            退出登录
          </button>
        </div>
      )}

      {/* 充值模态窗口 */}
      <RechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
      />
    </div>
  );
}
