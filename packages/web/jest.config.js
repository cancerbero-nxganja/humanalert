/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^leaflet$': '<rootDir>/tests/__mocks__/leaflet.js',
    '^react-leaflet$': '<rootDir>/tests/__mocks__/react-leaflet.js',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    // Pages are Next.js SSR integration-level; covered by e2e tests
    '!src/pages/**',
    // Browser-only APIs (SW, Leaflet map) require e2e testing
    '!src/lib/registerSW.ts',
    '!src/components/MapView.tsx',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
};
