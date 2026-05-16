# Security Specification - Sportivo

## Data Invariants
1. A user cannot modify their own `role` or `isAdmin` status.
2. Comments must be linked to a valid article and the currently authenticated user.
3. Articles can only be created/edited by Admins.
4. Users can only update their own profile (except for protected fields).
5. Analytics can be written by any authenticated user but not read except by admins.

## The Dirty Dozen Payloads (Unauthorized Attempts)

1. **Self-Promotion**: Authenticated user trying to update their own role to 'admin'.
2. **Identity Spoofing (Comment)**: Writing a comment with a `userId` that doesn't match the auth token.
3. **Ghost Article**: Anonymous user trying to create an article.
4. **Unauthorized Article Edit**: Standard user trying to update an article status to 'published'.
5. **PII Leak**: Authenticated user trying to read another user's private data (if any).
6. **Comment Hijacking**: User trying to edit or delete another user's comment.
7. **Cross-Article Comment**: User trying to move a comment to a different article by changing `articleId`.
8. **Resource Poisoning (User)**: Injecting 1MB of junk into the `displayName` field.
9. **Analytics Scraping**: Standard user trying to read the `analytics` collection.
10. **Match Tampering**: User trying to update a live match score.
11. **Future Dating**: Creating an article with a `createdAt` timestamp in the future (not matching server time).
12. **Orphaned Comment**: Creating a comment for an article ID that doesn't exist.

## Test Runner Logic
All above payloads must return `PERMISSION_DENIED`.
