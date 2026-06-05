export function buildProductSort(sort) {
  switch (String(sort || "newest")) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "name_asc":
      return { name: 1 };
    default:
      return { createdAt: -1 };
  }
}

export function buildProductFilter(query) {
  const filter = { active: { $ne: false } };

  if (query.categoryId) {
    const id = String(query.categoryId);
    filter.$or = [{ categoryId: id }, { categoryIds: id }];
  }

  if (query.section === "most-ordered") filter.isMostOrdered = true;
  if (query.section === "just-arrived") filter.isJustArrived = true;
  if (query.section === "freshly-baked") filter.isFreshlyBaked = true;

  if (query.q) {
    filter.name = { $regex: String(query.q), $options: "i" };
  }

  if (query.location) {
    filter.deliveryZones = { $in: [String(query.location)] };
  }

  if (query.minPrice) filter.price = { ...(filter.price || {}), $gte: Number(query.minPrice) };
  if (query.maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(query.maxPrice) };

  return filter;
}
