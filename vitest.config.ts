import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul', // or 'v8'
      reporter: ['text'],
      include: [
        'src/**',
      ],
      exclude: [
        'src/logger.ts', // Not necessary to test
        'src/index.ts', // Everything is covered by other tests
      ]
    },

  },
})