// ----------------------------------------------------
// Input Validation & Sanitization Helpers
// ----------------------------------------------------

export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim(); // Remove basic HTML tags
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

export function validateId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}
