import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['apps/server/src/**/*.test.ts', 'apps/web/app/**/*.test.ts'], maxWorkers: 2, testTimeout: 10000 } });
