const ACTIVE_ORDER_STATUSES = [
  'FUNDED_IN_ESCROW',
  'REQUIREMENTS_SUBMITTED',
  'IN_PROGRESS',
  'DELIVERED',
  'REVISION_REQUESTED',
  'IN_REVIEW'
];

const getGigOrderCapacity = (draftData) => {
  const delivery =
    draftData?.delivery &&
    typeof draftData.delivery === 'object' &&
    !Array.isArray(draftData.delivery)
      ? draftData.delivery
      : {};

  const rawLimit = delivery.activeOrderLimit;

  if (rawLimit === '' || rawLimit === null || typeof rawLimit === 'undefined') {
    return null;
  }

  const limit = Number(rawLimit);

  return Number.isSafeInteger(limit) && limit > 0 ? limit : null;
};

const validateGigOrderCapacity = (draftData) => {
  const delivery =
    draftData?.delivery &&
    typeof draftData.delivery === 'object' &&
    !Array.isArray(draftData.delivery)
      ? draftData.delivery
      : {};

  const rawLimit = delivery.activeOrderLimit;

  if (rawLimit === '' || rawLimit === null || typeof rawLimit === 'undefined') {
    return null;
  }

  const normalized = String(rawLimit).trim();

  if (
    !normalized ||
    !/^\d+$/.test(normalized) ||
    !Number.isSafeInteger(Number(normalized)) ||
    Number(normalized) <= 0
  ) {
    return {
      field: 'activeOrderLimit',
      message: 'Active order limit must be a positive whole number.',
      detail: 'Leave this blank for unlimited active orders.'
    };
  }

  return null;
};

module.exports = {
  ACTIVE_ORDER_STATUSES,
  getGigOrderCapacity,
  validateGigOrderCapacity
};
