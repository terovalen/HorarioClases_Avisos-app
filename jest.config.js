/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/logica/**/*.ts',
    '!src/logica/tipos.ts', // solo tipos, sin código ejecutable
    'src/api/cliente.ts',
    'src/servicios/notificaciones.ts',
  ],
  coverageThreshold: {
    './src/logica/**': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/api/cliente.ts': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    './src/servicios/notificaciones.ts': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
