const test = require('node:test');
const assert = require('node:assert/strict');

const { parseDateOfBirthAndAge } = require('../src/utils/authValidation');

const referenceDate = new Date(Date.UTC(2026, 9, 5));

test('accepts a valid DOB and calculates the age', () => {
  const result = parseDateOfBirthAndAge('2010-10-05', referenceDate);

  assert.ok(result);
  assert.equal(result.age, 16);
  assert.equal(result.dobDate.toISOString(), '2010-10-05T00:00:00.000Z');
});

test('does not count the birthday until it has passed', () => {
  const result = parseDateOfBirthAndAge('2010-10-06', referenceDate);

  assert.ok(result);
  assert.equal(result.age, 15);
});

test('rejects impossible calendar dates', () => {
  assert.equal(
    parseDateOfBirthAndAge('2010-02-30', referenceDate),
    null
  );
});

test('rejects future dates of birth', () => {
  assert.equal(
    parseDateOfBirthAndAge('2026-10-06', referenceDate),
    null
  );
});

test('rejects malformed date strings', () => {
  assert.equal(
    parseDateOfBirthAndAge('05-10-2010', referenceDate),
    null
  );
});

test('rejects dates that would produce an age over 120', () => {
  assert.equal(
    parseDateOfBirthAndAge('1905-10-04', referenceDate),
    null
  );
});
