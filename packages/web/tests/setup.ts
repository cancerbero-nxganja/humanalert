// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', { value: true, writable: true });

// Mock fetch
global.fetch = jest.fn();

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    locale: 'en',
    pathname: '/',
    asPath: '/',
    push: jest.fn(),
  }),
}));
