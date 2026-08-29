import { defineConfig } from 'vitest/config';

// Having this file here (even empty) stops Vitest from walking up and picking up the repo
// root's vitest.config.ts, whose deps aren't installed in worker/'s own CI job.
export default defineConfig({});
