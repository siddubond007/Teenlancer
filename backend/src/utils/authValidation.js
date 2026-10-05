function parseDateOfBirthAndAge(dobString, referenceDate = new Date()) {
  if (typeof dobString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
    return null;
  }

  const [year, month, day] = dobString.split('-').map(Number);
  const dobDate = new Date(Date.UTC(year, month - 1, day));

  if (
    dobDate.getUTCFullYear() !== year ||
    dobDate.getUTCMonth() !== month - 1 ||
    dobDate.getUTCDate() !== day
  ) {
    return null;
  }

  const today = referenceDate;
  let age = today.getUTCFullYear() - year;

  const birthdayPassed =
    today.getUTCMonth() > month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() >= day);

  if (!birthdayPassed) {
    age -= 1;
  }

  if (dobDate > today || age < 0 || age > 120) {
    return null;
  }

  return { dobDate, age };
}

module.exports = {
  parseDateOfBirthAndAge
};
