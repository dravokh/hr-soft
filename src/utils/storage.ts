const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  get<T>(key: string): T | null {
    if (!isBrowser) {
      return null;
    }

    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch (error) {
      console.warn(`Unable to parse storage value for key "${key}"`, error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isBrowser) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    if (!isBrowser) {
      return;
    }

    window.localStorage.removeItem(key);
  }
};
