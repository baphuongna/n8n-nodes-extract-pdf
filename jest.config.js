module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'nodes/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/vendor/**',
    '!nodes/**/*.d.ts'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(iso-639-3|franc)/)'
  ],
  moduleNameMapper: {
    '^n8n-workflow$': '<rootDir>/node_modules/n8n-workflow/dist/index.js',
    '^n8n-core$': '<rootDir>/node_modules/n8n-core/dist/index.js',
  },
  testTimeout: 30000, // Tăng thời gian timeout cho các test dài hơn
}; 