import { useState, useCallback } from 'react';

interface CourtModalState {
  isOpen: boolean;
  editingCourtId: string | null;
  newCourtName: string;
}

export function useCourtModal() {
  const [courtModal, setCourtModal] = useState<CourtModalState>({
    isOpen: false,
    editingCourtId: null,
    newCourtName: '',
  });

  const [courtToDelete, setCourtToDelete] = useState<string | null>(null);

  const openCourtModal = useCallback((editId?: string, currentName?: string) => {
    setCourtModal({
      isOpen: true,
      editingCourtId: editId ?? null,
      newCourtName: currentName ?? '',
    });
  }, []);

  const closeCourtModal = useCallback(() => {
    setCourtModal({
      isOpen: false,
      editingCourtId: null,
      newCourtName: '',
    });
  }, []);

  const setNewCourtName = useCallback((name: string) => {
    setCourtModal(prev => ({ ...prev, newCourtName: name }));
  }, []);

  const confirmDeleteCourt = useCallback((courtId: string) => {
    setCourtToDelete(courtId);
  }, []);

  const cancelDeleteCourt = useCallback(() => {
    setCourtToDelete(null);
  }, []);

  return {
    isCourtModalOpen: courtModal.isOpen,
    editingCourtId: courtModal.editingCourtId,
    newCourtName: courtModal.newCourtName,
    openCourtModal,
    closeCourtModal,
    setNewCourtName,
    courtToDelete,
    confirmDeleteCourt,
    cancelDeleteCourt,
  };
}
