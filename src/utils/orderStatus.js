export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED_BY_USER: "cancelled_by_user",
  CANCELLED_BY_ADMIN: "cancelled_by_admin"
};

export const CANCELLED_STATUSES = new Set([
  ORDER_STATUS.CANCELLED_BY_USER,
  ORDER_STATUS.CANCELLED_BY_ADMIN,
  "cancelled"
]);

export function isCancelledStatus(status) {
  return CANCELLED_STATUSES.has(String(status || ""));
}

export function formatOrderStatusLabel(status) {
  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled_by_user: "Cancelled by User",
    cancelled_by_admin: "Cancelled by Admin",
    cancelled: "Cancelled by Admin"
  };
  return labels[status] || String(status || "Pending");
}

export function canUserCancel(status) {
  return String(status) === ORDER_STATUS.PENDING;
}

export function canAdminConfirm(status) {
  return String(status) === ORDER_STATUS.PENDING;
}

export function canAdminCancel(status) {
  return String(status) === ORDER_STATUS.PENDING;
}

export function normalizeAdminStatus(status) {
  if (status === "cancelled") return ORDER_STATUS.CANCELLED_BY_ADMIN;
  return status;
}
