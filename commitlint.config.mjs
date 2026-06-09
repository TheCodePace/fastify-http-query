export default {
  extends: ['@commitlint/config-conventional'],
  // optic-release-automation opens its release PR with a hardcoded,
  // non-conventional title ("[OPTIC-RELEASE-AUTOMATION] release/vX.Y.Z").
  // Ignore it so a squash-merge of that PR doesn't fail commitlint on main.
  ignores: [(message) => message.startsWith('[OPTIC-RELEASE-AUTOMATION]')],
}
