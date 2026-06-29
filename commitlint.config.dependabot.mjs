export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Dependabot's auto-generated PR body contains markdown link bullets whose
    // first content line routinely exceeds the 100-char cap. The full rule
    // set is otherwise identical to commitlint.config.mjs — humans stay strict.
    'body-max-line-length': [0],
    'header-max-line-length': [0],
    'body-leading-blank': [0],
    'footer-leading-blank': [0],
  },
}
