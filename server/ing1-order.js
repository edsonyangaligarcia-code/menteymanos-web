// Canonical server-side rules for the later payment/order endpoint.
const ING_CODES = ['ING 1', 'ING 2', 'ING 3', 'ING 4', 'ING 5', 'ING 6', 'ING 7'];
const OFFERS = Object.freeze({
  opcion1: { label: 'Opción 1', priceCents: 990, additionalCount: 1 },
  combo: { label: 'Combo Pro', priceCents: 1590, additionalCount: 2 },
  vip: { label: 'VIP Full', priceCents: 2990, additionalCount: 0 }
});

export function buildIng1Order(offerKey, additionalCodes = []) {
  const offer = OFFERS[offerKey];
  if (!offer || !Array.isArray(additionalCodes) || additionalCodes.length !== offer.additionalCount) return null;
  if (new Set(additionalCodes).size !== additionalCodes.length || additionalCodes.some(code => !ING_CODES.slice(1).includes(code))) return null;
  return {
    offer: offerKey,
    label: offer.label,
    currency: 'PEN',
    priceCents: offer.priceCents,
    items: offerKey === 'vip' ? [...ING_CODES] : ['ING 1', ...additionalCodes]
  };
}
