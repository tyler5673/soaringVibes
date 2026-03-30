module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  setupFiles: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^three$': '<rootDir>/tests/__mocks__/three.js'
  }
};
