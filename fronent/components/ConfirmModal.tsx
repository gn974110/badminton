import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  buttonVariant: 'danger' | 'primary' | 'secondary';
}> = {
  danger: {
    icon: <Trash2 size={20} aria-hidden="true" />,
    bgColor: 'bg-red-50',
    iconBgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonVariant: 'danger',
  },
  warning: {
    icon: <AlertTriangle size={20} aria-hidden="true" />,
    bgColor: 'bg-amber-50',
    iconBgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'primary',
  },
  info: {
    icon: <Info size={20} aria-hidden="true" />,
    bgColor: 'bg-blue-50',
    iconBgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonVariant: 'primary',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'danger',
}: ConfirmModalProps) {
  const config = variantConfig[variant];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className={`p-4 ${config.bgColor} rounded-lg flex gap-3 items-start`}>
          <div className={`p-2 ${config.iconBgColor} rounded-full ${config.iconColor} shrink-0`}>
            {config.icon}
          </div>
          <div>
            <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={config.buttonVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
