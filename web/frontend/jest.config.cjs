module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
      useESM: false,
      tsconfig: { 
        jsx: 'react-jsx', 
        module: 'CommonJS',
        esModuleInterop: true,
        lib: ['ES2023', 'DOM']
      },
      diagnostics: false
    }],
  },
};
