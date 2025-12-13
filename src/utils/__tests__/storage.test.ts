import {
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
  saveArrayToStorage,
} from '../storage';

describe('storage utils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear console mocks
    jest.clearAllMocks();
  });

  describe('loadFromStorage', () => {
    it('should load and parse data from localStorage', () => {
      const testData = { name: 'test', value: 123 };
      localStorage.setItem('test-key', JSON.stringify(testData));

      const result = loadFromStorage<typeof testData>('test-key');
      expect(result).toEqual(testData);
    });

    it('should return fallback for non-existent key', () => {
      const fallback = { default: true };
      const result = loadFromStorage('non-existent', fallback);
      expect(result).toEqual(fallback);
    });

    it('should return null fallback by default', () => {
      const result = loadFromStorage('non-existent');
      expect(result).toBeNull();
    });

    it('should return fallback on JSON parse error', () => {
      localStorage.setItem('invalid-json', 'not valid json{');
      const fallback = { error: true };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = loadFromStorage('invalid-json', fallback);

      expect(result).toEqual(fallback);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle arrays', () => {
      const testArray = [1, 2, 3, 4, 5];
      localStorage.setItem('array-key', JSON.stringify(testArray));

      const result = loadFromStorage<number[]>('array-key');
      expect(result).toEqual(testArray);
    });
  });

  describe('saveToStorage', () => {
    it('should save data to localStorage', () => {
      const testData = { name: 'test', value: 456 };
      saveToStorage('save-key', testData);

      const stored = localStorage.getItem('save-key');
      expect(stored).toBe(JSON.stringify(testData));
    });

    it('should handle arrays', () => {
      const testArray = ['a', 'b', 'c'];
      saveToStorage('array-save', testArray);

      const stored = localStorage.getItem('array-save');
      expect(stored).toBe(JSON.stringify(testArray));
    });

    it('should handle console errors on failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const badData = {} as any;
      badData.circular = badData; // Create circular reference

      saveToStorage('circular', badData);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('removeFromStorage', () => {
    it('should remove data from localStorage', () => {
      localStorage.setItem('remove-key', 'test value');
      expect(localStorage.getItem('remove-key')).not.toBeNull();

      removeFromStorage('remove-key');
      expect(localStorage.getItem('remove-key')).toBeNull();
    });

    it('should not error when removing non-existent key', () => {
      expect(() => removeFromStorage('non-existent')).not.toThrow();
    });
  });

  describe('saveArrayToStorage', () => {
    it('should save non-empty arrays', () => {
      const testArray = [1, 2, 3];
      saveArrayToStorage('array-key', testArray);

      const stored = localStorage.getItem('array-key');
      expect(stored).toBe(JSON.stringify(testArray));
    });

    it('should remove key for empty arrays', () => {
      localStorage.setItem('array-key', JSON.stringify([1, 2, 3]));

      saveArrayToStorage('array-key', []);

      expect(localStorage.getItem('array-key')).toBeNull();
    });

    it('should handle array with objects', () => {
      const testArray = [{ id: 1 }, { id: 2 }];
      saveArrayToStorage('object-array', testArray);

      const stored = localStorage.getItem('object-array');
      expect(stored).toBe(JSON.stringify(testArray));
    });
  });
});
