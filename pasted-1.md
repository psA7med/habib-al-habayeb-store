Fix ONLY the search autocomplete/suggestions.

The current inline search input is working, but autocomplete suggestions are not reliably visible.

Requirements:

1. Keep the existing inline search bar exactly as it is.
2. Do NOT open a fullscreen modal.
3. Do NOT navigate to /search while the user is typing.
4. While typing, show a compact dropdown directly below the search input.
5. Suggestions must come ONLY from the existing product data.
6. Match product names/searchable product text against the current query.
7. Show a small number of relevant suggestions.
8. Clicking a suggestion should navigate to the appropriate product/search result.
9. Pressing Enter should perform the full search as it currently does.
10. Clicking outside the dropdown should close it.
11. Escape should close it.
12. The dropdown must remain visually attached to the search field.
13. Ensure the dropdown appears above other header/page content using correct stacking context.
14. Do not change the desktop header layout.
15. Do not change the mobile header layout.
16. Do not modify cart, wishlist, checkout, products, categories, or routing architecture.
17. Do not add a new package.

Use the existing search architecture and product data.

Important:
Keep the search UI practical and similar to a normal ecommerce/search experience.
No glassmorphism.
No giant overlay.
No unnecessary animation.

After implementation:
- run typecheck
- run production build
- report exact files modified
- confirm autocomplete works on desktop and mobile
- confirm no unrelated files were changed

Make no unrelated changes.