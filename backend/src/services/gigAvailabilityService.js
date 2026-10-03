const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getTodayDateString = () =>
  new Date().toISOString().split('T')[0];

const isValidDateOnly = (value) => {
  const normalized = String(value || '').trim();

  if (!DATE_ONLY_PATTERN.test(normalized)) {
    return false;
  }

  const parsed = new Date(`${normalized}T00:00:00Z`);

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === normalized
  );
};

const getGigAvailability = (draftData) => {
  const delivery =
    draftData?.delivery &&
    typeof draftData.delivery === 'object'
      ? draftData.delivery
      : {};

  return {
    acceptingOrders:
      typeof delivery.acceptingOrders === 'boolean'
        ? delivery.acceptingOrders
        : true,
    unavailableUntil:
      typeof delivery.unavailableUntil === 'string'
        ? delivery.unavailableUntil.trim()
        : ''
  };
};

const validateGigAvailability = (draftData) => {
  const { acceptingOrders, unavailableUntil } = getGigAvailability(draftData);

  if (!acceptingOrders && unavailableUntil) {
    if (!isValidDateOnly(unavailableUntil)) {
      return {
        field: 'unavailableUntil',
        message: 'Choose a valid unavailable-until date.',
        detail: 'Use a valid calendar date in YYYY-MM-DD format.'
      };
    }

    if (unavailableUntil < getTodayDateString()) {
      return {
        field: 'unavailableUntil',
        message: 'Unavailable-until date cannot be in the past.',
        detail: 'Choose today or a future date.'
      };
    }
  }

  return null;
};

const isGigAcceptingOrders = (draftData) => {
  const { acceptingOrders, unavailableUntil } = getGigAvailability(draftData);

  if (acceptingOrders) return true;
  if (!unavailableUntil || !isValidDateOnly(unavailableUntil)) return false;

  return unavailableUntil <= getTodayDateString();
};

module.exports = {
  getGigAvailability,
  validateGigAvailability,
  isGigAcceptingOrders
};
