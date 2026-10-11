module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
      useESM: true, 
      tsconfig: { 
        jsx: 'react-jsx', 
        esModuleInterop: true,
        lib: ['ES2023', 'DOM']
      } 
    }],
  },
};
