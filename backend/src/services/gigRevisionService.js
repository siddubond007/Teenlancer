
const getPendingPackageSnapshot = (pendingEditData) => {
  const pricing = pendingEditData?.pricing || {};
  const delivery = pendingEditData?.delivery || {};

  const normalizeList = (value) =>
    Array.isArray(value)
      ? value.map((item) => String(item || '').trim()).filter(Boolean)
      : [];

  const normalizePackage = (pkg, fallbackTierName) => {
    const scope =
      pkg?.scope && typeof pkg.scope === 'object'
        ? pkg.scope
        : {};

    return {
      id: typeof pkg?.id === 'string' ? pkg.id : null,
      tierName:
        typeof pkg?.tierName === 'string' && pkg.tierName.trim()
          ? pkg.tierName.trim()
          : fallbackTierName,
      price: Number(pkg?.price),
      deliveryDays: Number(pkg?.deliveryDays),
      revisions:
        pkg?.revisions === 'unlimited'
          ? -1
          : Number(pkg?.revisions),
      description:
        typeof pkg?.description === 'string'
          ? pkg.description.trim()
          : '',
      scope: {
        includedItems: normalizeList(scope.includedItems),
        excludedItems: normalizeList(scope.excludedItems),
        deliverables: normalizeList(scope.deliverables)
      },
      features: normalizeList(pkg?.features)
    };
  };

  if (pricing.packageModel !== 'multi') {
    return [{
      tierName: 'Single',
      price: Number(pricing.basePrice),
      deliveryDays: Number(delivery.deliveryDays),
      revisions:
        delivery.revisions === 'unlimited'
          ? -1
          : Number(delivery.revisions),
      description: 'Standard student delivery',
      scope: {
        includedItems: normalizeList(delivery.includedItems),
        excludedItems: normalizeList(delivery.excludedItems),
        deliverables: normalizeList(delivery.deliverables)
      },
      features: []
    }];
  }

  if (!Array.isArray(pendingEditData?.packages)) {
    return [];
  }

  return pendingEditData.packages
    .filter((pkg) => pkg && typeof pkg === 'object')
    .map((pkg) => normalizePackage(pkg, String(pkg.tierName || 'Package')));
};

const getPendingExtraSnapshot = (pendingEditData) => {
  if (!Array.isArray(pendingEditData?.extras)) {
    return [];
  }

  return pendingEditData.extras
    .filter((extra) => extra && typeof extra === 'object')
    .map((extra) => {
      const scope =
        extra?.scope && typeof extra.scope === 'object'
          ? extra.scope
          : {};

      return {
        id: typeof extra?.id === 'string' ? extra.id : null,
        title:
          typeof extra?.title === 'string'
            ? extra.title.trim()
            : '',
        price: Number(extra?.price),
        scope: {
          description:
            typeof scope.description === 'string'
              ? scope.description.trim()
              : ''
        }
      };
    });
};

const createGigPendingEditRevision = async (
  tx,
  gigId,
  actorId,
  changeType
) => {
  const gig = await tx.gig.findUnique({
    where: { id: gigId }
  });

  if (!gig) {
    throw new Error('Gig not found while creating pending edit revision snapshot.');
  }

  const pendingEditData =
    gig.pendingEditData &&
    typeof gig.pendingEditData === 'object'
      ? gig.pendingEditData
      : null;

  if (!pendingEditData) {
    throw new Error('Pending gig edit data is missing while creating revision snapshot.');
  }

  const latestRevision = await tx.gigRevision.findFirst({
    where: { gigId },
    orderBy: { version: 'desc' },
    select: { version: true }
  });

  const snapshot = {
    id: gig.id,
    sellerId: gig.sellerId,
    title:
      typeof pendingEditData?.basics?.title === 'string'
        ? pendingEditData.basics.title
        : gig.title,
    category:
      typeof pendingEditData?.basics?.categoryId === 'string'
        ? pendingEditData.basics.categoryId
        : gig.category,
    categoryId: gig.categoryId,
    subcategoryId: gig.subcategoryId,
    description:
      typeof pendingEditData.description === 'string'
        ? pendingEditData.description
        : gig.description,
    coverImage:
      typeof pendingEditData?.media?.cover?.url === 'string'
        ? pendingEditData.media.cover.url
        : gig.coverImage,
    isTiered:
      pendingEditData?.pricing?.packageModel === 'multi',
    status: gig.status,
    draftData: pendingEditData,
    draftVersion: gig.pendingEditVersion,
    moderationStatus: 'PENDING_REVIEW',
    moderationReasonCode: gig.pendingEditReasonCode,
    moderationFindings: gig.pendingEditFindings || null,
    packages: getPendingPackageSnapshot(pendingEditData),
    extras: getPendingExtraSnapshot(pendingEditData)
  };

  return tx.gigRevision.create({
    data: {
      gigId: gig.id,
      actorId: actorId || null,
      version: (latestRevision?.version || 0) + 1,
      changeType,
      snapshot
    }
  });
};

const createGigRevision = async (tx, gigId, actorId, changeType) => {
  const gig = await tx.gig.findUnique({
    where: { id: gigId },
    include: {
      packages: {
        orderBy: { price: 'asc' }
      },
      extras: {
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!gig) {
    throw new Error('Gig not found while creating revision snapshot.');
  }

  const latestRevision = await tx.gigRevision.findFirst({
    where: { gigId },
    orderBy: { version: 'desc' },
    select: { version: true }
  });

  const snapshot = {
    id: gig.id,
    sellerId: gig.sellerId,
    title: gig.title,
    category: gig.category,
    categoryId: gig.categoryId,
    subcategoryId: gig.subcategoryId,
    description: gig.description,
    coverImage: gig.coverImage,
    isTiered: gig.isTiered,
    status: gig.status,
    draftData: gig.draftData || {},
    draftVersion: gig.draftVersion,
    moderationStatus: gig.moderationStatus,
    moderationReasonCode: gig.moderationReasonCode,
    moderationFindings: gig.moderationFindings || null,
    packages: gig.packages.map((pkg) => ({
      id: pkg.id,
      tierName: pkg.tierName,
      price: pkg.price,
      deliveryDays: pkg.deliveryDays,
      revisions: pkg.revisions,
      description: pkg.description,
      scope: pkg.scope || null,
      features: pkg.features || null
    })),
    extras: gig.extras.map((extra) => ({
      id: extra.id,
      title: extra.title,
      price: extra.price,
      scope: extra.scope || null
    }))
  };

  return tx.gigRevision.create({
    data: {
      gigId: gig.id,
      actorId: actorId || null,
      version: (latestRevision?.version || 0) + 1,
      changeType,
      snapshot
    }
  });
};

module.exports = {
  createGigRevision,
  createGigPendingEditRevision
};
