import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'e2e',
    include: [
      'test/e2e/*.spec.ts',
    ]
  },
})