import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'e2e',
    fileParallelism: false,
    testTimeout: 20000,
    include: [
      'test/e2e/*.spec.ts',
    ],
    coverage: {
      provider: 'istanbul',
      reporter: ['text'],
      include: [
        'src/**',
      ],
      exclude: [
        'src/win-version.ts',
        'src/powershell.ts',
        'src/logger.ts',
      ],
    }
  },
})