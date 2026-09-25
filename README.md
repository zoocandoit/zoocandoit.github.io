# zoocandoit.github.io

Personal profiles for cyber security and conducting. Static HTML, CSS and JavaScript; no build step.

Originally forked from [codewithsadee/vcard-personal-portfolio](https://github.com/codewithsadee/vcard-personal-portfolio).

## Local preview

Run `python -m http.server 8000` from this directory and open `http://localhost:8000`.

## Editing

- `assets/css/style.css`: shared foundations, profile frame, navigation and typography.
- `assets/css/index.css`: home page only.
- `security/security.css` and `conductor/conductor.css`: profile themes and unique sections.
- `assets/css/detail.css`: career detail layout; uses the security theme.
- `security/index.html`: short career summaries. Full responsibilities belong in `security/career/*.html`.
- `assets/js/script.js`: progressive enhancement for tabs, experience duration and email copying.

Navigation links use a stable `data-target` matching the article's `id`. Labels may change without changing URLs. The existing `#filmography` and `#repository` links remain supported. Without JavaScript, all articles and email links remain available. Video accordions use native `details` elements.

Original images remain available for sharing. Page images use the smaller WebP derivatives in `assets/images/`.

The home page is a directory of the two practices, distinguished by photographs and colour. Security uses responsibility records and publication lists. Conducting keeps the biography-first layout and portrait sidebar requested by the owner; recordings stay in the archive, with no featured performance. Tab transitions, a moving selection rule, link feedback and native accordion motion respond to interaction. Reduced-motion preferences disable these effects. Keep all profile text and links intact when changing presentation.

## Browser check

`node tests/check.cjs` uses Playwright and a temporary local HTTP server. Playwright is a test prerequisite, not a site dependency. If it is installed outside this project, set `PLAYWRIGHT_MODULE` to that installation's `playwright` directory. Set `CHROME_PATH` to use an installed Chrome executable instead of Playwright's browser.

The check covers navigation/history, keyboard access, tab-indicator alignment, all eight pages at four viewport sizes, reduced motion, video accordions and reading without JavaScript or external assets. Set `SCREENSHOT_DIR` to also save desktop/mobile screenshots.
