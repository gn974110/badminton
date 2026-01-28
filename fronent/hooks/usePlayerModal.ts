import { useState, useCallback } from 'react';

interface PlayerEditState {
  editingPlayerId: string | null;
  editName: string;
  editGender: 'M' | 'F';
  editLevel: number;
}

interface PickerTarget {
  courtId: string;
  slotIndex: number;
}

export function usePlayerModal() {
  const [playerEdit, setPlayerEdit] = useState<PlayerEditState>({
    editingPlayerId: null,
    editName: '',
    editGender: 'M',
    editLevel: 3,
  });

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const openPlayerEdit = useCallback((id: string, name: string, gender: 'M' | 'F', level: number) => {
    setPlayerEdit({ editingPlayerId: id, editName: name, editGender: gender, editLevel: level });
  }, []);

  const closePlayerEdit = useCallback(() => {
    setPlayerEdit(prev => ({ ...prev, editingPlayerId: null }));
  }, []);

  const setEditName = useCallback((name: string) => {
    setPlayerEdit(prev => ({ ...prev, editName: name }));
  }, []);

  const setEditGender = useCallback((gender: 'M' | 'F') => {
    setPlayerEdit(prev => ({ ...prev, editGender: gender }));
  }, []);

  const setEditLevel = useCallback((level: number) => {
    setPlayerEdit(prev => ({ ...prev, editLevel: level }));
  }, []);

  const openPlayerPicker = useCallback((courtId: string, slotIndex: number) => {
    setPickerTarget({ courtId, slotIndex });
  }, []);

  const closePlayerPicker = useCallback(() => {
    setPickerTarget(null);
  }, []);

  return {
    editingPlayerId: playerEdit.editingPlayerId,
    editName: playerEdit.editName,
    editGender: playerEdit.editGender,
    editLevel: playerEdit.editLevel,
    openPlayerEdit,
    closePlayerEdit,
    setEditName,
    setEditGender,
    setEditLevel,
    pickerTarget,
    openPlayerPicker,
    closePlayerPicker,
  };
}
