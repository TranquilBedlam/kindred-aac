// Scope this workflow to the canonical root test directory.
// The deployed preview contains a snapshot of tests and must not run a second server.
module.exports = {
  testDir: __dirname,
  testMatch: 'browser-reorder.spec.cjs',
  workers: 1,
};
