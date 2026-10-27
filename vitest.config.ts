import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['apps/server/src/**/*.test.ts'], maxWorkers: 2, testTimeout: 10000 } });
