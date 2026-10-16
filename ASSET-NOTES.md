# Assets and content sources

## Chibi Miku

- File: `assets/miku.png`
- Created using the built-in imagegen tool, with a transparent background.
- Source image is preserved at its generated resolution, with its alpha channel intact.
- Used both as the hero illustration and as the sprite texture for the physics simulation.

Final generation prompt:

> Use case: stylized-concept. Asset type: a single transparent PNG character sprite for a playful physics animation on an academic personal website. Draw ONE extremely cute chibi Hatsune Miku, full body, alone, centered, all body and hair completely inside the canvas with generous transparent padding. Recognizable turquoise very long twin tails, black and hot pink headset hair ties, enormous teal eyes, small happy open smile and blush, classic grey sleeveless top, teal necktie, dark detached sleeves and pleated skirt. Super-deformed 2-head-tall proportions, little hands raised beside face, tiny feet tucked up, twin tails curving around the body to make a soft compact roughly circular silhouette suitable for tumbling like a plush ball. Style: polished contemporary Japanese kawaii sticker illustration, crisp elegant dark teal outline, flat cel shading, pastel turquoise highlights, soft white sticker border, no cast shadow, no environment. Front view, cheerful and adorable, readable when rendered just 60 px tall. No lettering, no logo, no watermark, no additional objects or characters. Truly transparent background.

The favicon and decorative marks are code-native artwork created for this page.

## Content

- [Zesen Zhao’s public profile README](https://github.com/SenmiaoORZ/SenmiaoORZ): biography, affiliation, advisor, undergraduate majors, research interests, work titles, updates, service, hobbies, and social links.
- [Zesen Zhao’s Google Scholar profile](https://scholar.google.com/citations?user=eDKnsl8AAAAJ&hl=en&pagesize=100): the six displayed publication records, imported on October 16, 2026. Each article detail was read to obtain its complete author list, recorded publication date, venue, and original paper link.

- [Martin Ziqiao Ma’s homepage](https://mars-tin.github.io/): reference for academic content organization.

The profile README calls the Cruise role “VLA Research Intern” in the biography and “VLM Research Internship” in the May update. The preview preserves both original descriptions in their respective contexts. No internship end date has been inferred.

## Physics library

- Matter.js 0.20.0, retrieved from the versioned npm distribution at `https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js`.
- Documentation: <https://brm.io/matter-js/>.
- License: `vendor/MATTER-LICENSE.txt`.

## Imported Scholar records

- [Test-Time Scaling for World Action Models via Zero-Shot Geometric Evaluation](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=eDKnsl8AAAAJ&pagesize=100&citation_for_view=eDKnsl8AAAAJ:IjCSPb-OGe4C)
- [Dynamic Linear Attention](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=eDKnsl8AAAAJ&pagesize=100&citation_for_view=eDKnsl8AAAAJ:UeHWp8X0CEIC)
- [CLAP: Contrastive Latent-space Prompt Optimization for End-to-end Autonomous Driving](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=eDKnsl8AAAAJ&pagesize=100&citation_for_view=eDKnsl8AAAAJ:qjMakFHDy7sC)
- [MARS: Harmonizing Multimodal Convergence via Adaptive Rank Search](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=eDKnsl8AAAAJ&pagesize=100&citation_for_view=eDKnsl8AAAAJ:d1gkVwhDpl0C)
- [Eagle: Efficient Training-Free Router for Multi-LLM Inference](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=eDKnsl8AAAAJ&pagesize=100&citation_for_view=eDKnsl8AAAAJ:u-x6o8ySG0sC)
- [Unfolding Videos Dynamics via Taylor Expansion](https://scholar.google.com/citations?view_op=view_citation&hl=en&user=eDKnsl8AAAAJ&pagesize=100&citation_for_view=eDKnsl8AAAAJ:u5HHmVD_uO8C)

Venue and year labels follow Scholar, including CPAL 2025 on the Taylor Expansion record whose recorded publication year is 2024. The user confirmed that MARS was accepted to NeurIPS and Dynamic Linear Attention was accepted to ICML; their displayed venues are updated to NeurIPS 2026 and ICML 2026 respectively. Citation counts are omitted because this is a static import.

## Visitor map and counters

- [Natural Earth vector data](https://github.com/nvkelso/natural-earth-vector): public-domain 1:110m country polygons, rounded to three decimal places and reduced to country name/code plus geometry. Antarctica is omitted from the display.
- [D3 Geo 3.1.1](https://github.com/d3/d3-geo) and [D3 Array 3.2.4](https://github.com/d3/d3-array): vendored renderer and its dependency; license files are included in `vendor/`.
- [GoatCounter visitor-counter documentation](https://www.goatcounter.com/help/visitor-counter): public total and date-range counters.
- [GoatCounter JavaScript integration](https://www.goatcounter.com/help/countjs-versions): version 5 tracking script with the published SRI hash; loaded on the production hostname only.
- [GoatCounter JSON API](https://www.goatcounter.com/help/api): read-only aggregate country snapshots, intended to run in GitHub Actions with a repository secret.
- [GitHub’s static Pages workflow](https://github.com/actions/starter-workflows/blob/main/pages/static.yml): publishing workflow reference.

## Current research focus

The user updated the current research description to exploration across robotics, primarily dexterous hands, robotic foundation models, and embodied agents. The introduction, topic labels, and page descriptions reflect this update.
