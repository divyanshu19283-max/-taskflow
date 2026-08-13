import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    env: {
      TASKFLOW_DB_PATH: 'src/db/test.sqlite3',
    },
  },
});
