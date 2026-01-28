interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface DuplicateCheckOptions {
  items?: Array<{ id: string; name: string }>;
  excludeId?: string;
}

/**
 * Validates a player name.
 * @param name - The name to validate
 * @param options - Optional duplicate checking with items array and excludeId for editing
 */
export function validatePlayerName(
  name: string,
  options?: DuplicateCheckOptions
): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: '請輸入球員姓名' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: '姓名不能超過 20 個字元' };
  }

  if (options?.items) {
    const isDuplicate = options.items.some(
      p => p.name.toLowerCase() === trimmed.toLowerCase() && p.id !== options.excludeId
    );
    if (isDuplicate) {
      return { isValid: false, error: '此球員姓名已存在' };
    }
  }

  return { isValid: true };
}

export const validatePlayerLevel = (level: number): ValidationResult => {
  if (!Number.isInteger(level)) {
    return { isValid: false, error: '等級必須是整數' };
  }

  if (level < 1 || level > 18) {
    return { isValid: false, error: '等級必須在 1-18 之間' };
  }

  return { isValid: true };
};

export const validatePlayerGender = (gender: string): ValidationResult => {
  if (gender !== 'M' && gender !== 'F') {
    return { isValid: false, error: '性別必須是 M 或 F' };
  }

  return { isValid: true };
};

export interface PlayerFormData {
  name: string;
  gender: 'M' | 'F';
  level: number;
}

export const validatePlayer = (data: PlayerFormData): ValidationResult => {
  const nameResult = validatePlayerName(data.name);
  if (!nameResult.isValid) return nameResult;

  const genderResult = validatePlayerGender(data.gender);
  if (!genderResult.isValid) return genderResult;

  const levelResult = validatePlayerLevel(data.level);
  if (!levelResult.isValid) return levelResult;

  return { isValid: true };
};

/**
 * Validates a court name.
 * @param name - The name to validate
 * @param options - Optional duplicate checking with items array and excludeId for editing
 */
export function validateCourtName(
  name: string,
  options?: DuplicateCheckOptions
): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: '請輸入場地名稱' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: '場地名稱不能超過 30 個字元' };
  }

  if (options?.items) {
    const isDuplicate = options.items.some(
      c => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== options.excludeId
    );
    if (isDuplicate) {
      return { isValid: false, error: '此場地名稱已存在' };
    }
  }

  return { isValid: true };
}

// 通用驗證工具
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};
