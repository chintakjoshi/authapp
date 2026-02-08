const PASSWORD_RULES = [
  {
    key: 'length',
    label: 'At least 8 characters',
    test: (value) => value.length >= 8,
  },
  {
    key: 'uppercase',
    label: 'At least 1 uppercase letter',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: 'lowercase',
    label: 'At least 1 lowercase letter',
    test: (value) => /[a-z]/.test(value),
  },
  {
    key: 'number',
    label: 'At least 1 number',
    test: (value) => /\d/.test(value),
  },
  {
    key: 'symbol',
    label: 'At least 1 special character',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function evaluatePasswordStrength(value = '') {
  const checks = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(value),
  }));

  const passedCount = checks.filter((item) => item.passed).length;
  const meetsMinimum = checks.find((item) => item.key === 'length')?.passed && passedCount >= 4;

  let label = 'Very Weak';
  if (passedCount >= 5) label = 'Strong';
  else if (passedCount === 4) label = 'Good';
  else if (passedCount === 3) label = 'Fair';
  else if (passedCount >= 1) label = 'Weak';

  return {
    checks,
    passedCount,
    meetsMinimum,
    label,
  };
}

