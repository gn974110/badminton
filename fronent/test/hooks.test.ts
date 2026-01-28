import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useCourtModal } from '../hooks/useCourtModal';
import { usePlayerModal } from '../hooks/usePlayerModal';
import { useAppModals } from '../hooks/useAppModals';

describe('useToast', () => {
  it('should initialize with hidden toast', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toast.isVisible).toBe(false);
  });

  it('should show toast with correct message and type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'success');
    });

    expect(result.current.toast.isVisible).toBe(true);
    expect(result.current.toast.message).toBe('Test message');
    expect(result.current.toast.type).toBe('success');
  });

  it('should hide toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message', 'info');
    });

    act(() => {
      result.current.hideToast();
    });

    expect(result.current.toast.isVisible).toBe(false);
  });

  it('should default to info type', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message');
    });

    expect(result.current.toast.type).toBe('info');
  });
});

describe('useConfirm', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useConfirm());
    expect(result.current.confirmState.isOpen).toBe(false);
  });

  it('should open confirm dialog with correct config', () => {
    const { result } = renderHook(() => useConfirm());
    const mockOnConfirm = vi.fn();

    act(() => {
      result.current.confirm({
        title: 'Test Title',
        message: 'Test Message',
        confirmText: 'OK',
        variant: 'danger',
        onConfirm: mockOnConfirm,
      });
    });

    expect(result.current.confirmState.isOpen).toBe(true);
    expect(result.current.confirmState.title).toBe('Test Title');
    expect(result.current.confirmState.message).toBe('Test Message');
    expect(result.current.confirmState.confirmText).toBe('OK');
    expect(result.current.confirmState.variant).toBe('danger');
  });

  it('should close confirm dialog', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        title: 'Test',
        message: 'Test',
        onConfirm: vi.fn(),
      });
    });

    act(() => {
      result.current.closeConfirm();
    });

    expect(result.current.confirmState.isOpen).toBe(false);
  });

  it('should call onConfirm when handleConfirm is called', () => {
    const { result } = renderHook(() => useConfirm());
    const mockOnConfirm = vi.fn();

    act(() => {
      result.current.confirm({
        title: 'Test',
        message: 'Test',
        onConfirm: mockOnConfirm,
      });
    });

    act(() => {
      result.current.handleConfirm();
    });

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.confirmState.isOpen).toBe(false);
  });

  it('should use default values when not provided', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        title: 'Test',
        message: 'Test',
        onConfirm: vi.fn(),
      });
    });

    expect(result.current.confirmState.confirmText).toBe('確認');
    expect(result.current.confirmState.cancelText).toBe('取消');
    expect(result.current.confirmState.variant).toBe('danger');
  });
});

describe('useCourtModal', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useCourtModal());
    expect(result.current.isCourtModalOpen).toBe(false);
    expect(result.current.editingCourtId).toBeNull();
    expect(result.current.newCourtName).toBe('');
    expect(result.current.courtToDelete).toBeNull();
  });

  it('should open court modal for new court', () => {
    const { result } = renderHook(() => useCourtModal());

    act(() => {
      result.current.openCourtModal();
    });

    expect(result.current.isCourtModalOpen).toBe(true);
    expect(result.current.editingCourtId).toBeNull();
    expect(result.current.newCourtName).toBe('');
  });

  it('should open court modal for editing', () => {
    const { result } = renderHook(() => useCourtModal());

    act(() => {
      result.current.openCourtModal('court-1', 'Test Court');
    });

    expect(result.current.isCourtModalOpen).toBe(true);
    expect(result.current.editingCourtId).toBe('court-1');
    expect(result.current.newCourtName).toBe('Test Court');
  });

  it('should close court modal and reset state', () => {
    const { result } = renderHook(() => useCourtModal());

    act(() => {
      result.current.openCourtModal('court-1', 'Test Court');
    });

    act(() => {
      result.current.closeCourtModal();
    });

    expect(result.current.isCourtModalOpen).toBe(false);
    expect(result.current.editingCourtId).toBeNull();
    expect(result.current.newCourtName).toBe('');
  });

  it('should update court name', () => {
    const { result } = renderHook(() => useCourtModal());

    act(() => {
      result.current.setNewCourtName('New Court Name');
    });

    expect(result.current.newCourtName).toBe('New Court Name');
  });

  it('should set and clear court to delete', () => {
    const { result } = renderHook(() => useCourtModal());

    act(() => {
      result.current.confirmDeleteCourt('court-1');
    });
    expect(result.current.courtToDelete).toBe('court-1');

    act(() => {
      result.current.cancelDeleteCourt();
    });
    expect(result.current.courtToDelete).toBeNull();
  });
});

describe('usePlayerModal', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => usePlayerModal());
    expect(result.current.editingPlayerId).toBeNull();
    expect(result.current.pickerTarget).toBeNull();
  });

  it('should open player edit with correct data', () => {
    const { result } = renderHook(() => usePlayerModal());

    act(() => {
      result.current.openPlayerEdit('player-1', 'Test Player', 'F', 10);
    });

    expect(result.current.editingPlayerId).toBe('player-1');
    expect(result.current.editName).toBe('Test Player');
    expect(result.current.editGender).toBe('F');
    expect(result.current.editLevel).toBe(10);
  });

  it('should close player edit modal', () => {
    const { result } = renderHook(() => usePlayerModal());

    act(() => {
      result.current.openPlayerEdit('player-1', 'Test', 'M', 5);
    });

    act(() => {
      result.current.closePlayerEdit();
    });

    expect(result.current.editingPlayerId).toBeNull();
  });

  it('should update edit fields', () => {
    const { result } = renderHook(() => usePlayerModal());

    act(() => {
      result.current.setEditName('New Name');
      result.current.setEditGender('F');
      result.current.setEditLevel(15);
    });

    expect(result.current.editName).toBe('New Name');
    expect(result.current.editGender).toBe('F');
    expect(result.current.editLevel).toBe(15);
  });

  it('should open and close player picker', () => {
    const { result } = renderHook(() => usePlayerModal());

    act(() => {
      result.current.openPlayerPicker('court-1', 2);
    });

    expect(result.current.pickerTarget).toEqual({
      courtId: 'court-1',
      slotIndex: 2,
    });

    act(() => {
      result.current.closePlayerPicker();
    });

    expect(result.current.pickerTarget).toBeNull();
  });
});

describe('useAppModals', () => {
  it('should initialize with all modals closed', () => {
    const { result } = renderHook(() => useAppModals());
    expect(result.current.showHistory).toBe(false);
    expect(result.current.showRules).toBe(false);
    expect(result.current.courtFinishingId).toBeNull();
  });

  it('should open and close history modal', () => {
    const { result } = renderHook(() => useAppModals());

    act(() => {
      result.current.openHistory();
    });
    expect(result.current.showHistory).toBe(true);

    act(() => {
      result.current.closeHistory();
    });
    expect(result.current.showHistory).toBe(false);
  });

  it('should open and close rules modal', () => {
    const { result } = renderHook(() => useAppModals());

    act(() => {
      result.current.openRules();
    });
    expect(result.current.showRules).toBe(true);

    act(() => {
      result.current.closeRules();
    });
    expect(result.current.showRules).toBe(false);
  });

  it('should open and close finish game modal', () => {
    const { result } = renderHook(() => useAppModals());

    act(() => {
      result.current.openFinishGame('court-1');
    });
    expect(result.current.courtFinishingId).toBe('court-1');

    act(() => {
      result.current.closeFinishGame();
    });
    expect(result.current.courtFinishingId).toBeNull();
  });
});
