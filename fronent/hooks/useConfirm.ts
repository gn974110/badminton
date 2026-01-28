import { useState, useCallback } from 'react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: ConfirmVariant;
  onConfirm: () => void;
}

const defaultState: ConfirmState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: '確認',
  cancelText: '取消',
  variant: 'danger',
  onConfirm: () => {},
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(defaultState);

  const confirm = useCallback((config: ConfirmConfig) => {
    setState({
      isOpen: true,
      title: config.title,
      message: config.message,
      confirmText: config.confirmText || '確認',
      cancelText: config.cancelText || '取消',
      variant: config.variant || 'danger',
      onConfirm: config.onConfirm,
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    state.onConfirm();
    closeConfirm();
  }, [state.onConfirm, closeConfirm]);

  return {
    confirmState: state,
    confirm,
    closeConfirm,
    handleConfirm,
  };
}
