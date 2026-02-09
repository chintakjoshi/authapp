module.exports = {
  root: true,
  extends: ["react-app", "react-app/jest"],
  rules: {
    "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-unreachable": "error",
    "no-unreachable-loop": "error",
  },
};
