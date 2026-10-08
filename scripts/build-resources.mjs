// Generates crawlable resource HTML from resources/catalog.json:
//   - resources/<slug>.html for every catalog item with `slug` and `page`
//   - the default (Maths) library view prerendered into resources/index.html
//   - ItemList / BreadcrumbList JSON-LD for resources/index.html
//   - resource page entries in sitemap.xml
// Run after editing catalog.json:  node scripts/build-resources.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://studywithdr.co.uk';
const PERSON_ID = `${SITE}/#drxin`;
const ORG_ID = `${SITE}/#business`;

const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(ROOT, file), text);

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(read('resources/supabase-client.js'), sandbox);
const SWD = sandbox.window.StudyWithDr;

const catalog = JSON.parse(read('resources/catalog.json')).resources;
const rows = catalog.map(SWD.mapCatalogItem);
const pages = catalog.filter((item) => item.slug && item.page);

const esc = SWD.escapeHtml;
const jsonLd = (data) =>
  `<script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n    </script>`;

function replaceBetween(text, name, content, indent) {
  const start = `<!-- generated:${name}:start -->`;
  const end = `<!-- generated:${name}:end -->`;
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from === -1 || to === -1) throw new Error(`Missing ${name} markers`);
  return text.slice(0, from + start.length) + '\n' + content + '\n' + indent + text.slice(to);
}

function breadcrumbs(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, url], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: url
    }))
  };
}

function resourceUrl(item) {
  return SITE + SWD.getResourcePagePath(item);
}

function renderResourcePage(item) {
  const page = item.page;
  const url = resourceUrl(item);
  const typeName = SWD.getResourceTypeName(item.resource_type);
  const isFree = String(item.price).toLowerCase() === 'free';
  const priceLabel = [isFree ? 'Free' : '', item.format].filter(Boolean).join(' ');
  const ctaLabel = item.cta_label || (isFree && item.format ? `Get the Free ${item.format}` : 'View resource');
  const tags = [item.qualification, typeName, priceLabel].filter(Boolean)
    .map((tag) => `<span class="pdf-board-tag">${esc(tag)}</span>`).join('\n                        ');
  const topicTags = (item.topics || [])
    .map((topic) => `<span class="resource-topic-tag">${esc(topic)}</span>`).join('\n                        ');

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: page.h1,
        description: page.meta_description,
        inLanguage: 'en-GB',
        isPartOf: { '@type': 'WebSite', '@id': `${SITE}/#website`, name: 'Study with Dr', url: `${SITE}/` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#resource` }
      },
      {
        '@type': 'LearningResource',
        '@id': `${url}#resource`,
        name: item.title,
        headline: page.h1,
        description: page.meta_description,
        url,
        learningResourceType: typeName,
        educationalLevel: page.educational_level,
        ...(page.alignment && {
          educationalAlignment: {
            '@type': 'AlignmentObject',
            alignmentType: 'educationalSubject',
            educationalFramework: page.alignment.framework,
            targetName: page.alignment.target
          }
        }),
        teaches: page.covers,
        keywords: (item.topics || []).join(', '),
        inLanguage: 'en-GB',
        isAccessibleForFree: isFree,
        encodingFormat: item.format === 'PDF' ? 'application/pdf' : undefined,
        datePublished: item.date_published,
        dateModified: item.date_modified || item.date_published,
        author: { '@id': PERSON_ID },
        publisher: { '@id': ORG_ID },
        offers: {
          '@type': 'Offer',
          price: isFree ? '0' : undefined,
          priceCurrency: 'GBP',
          url: item.url,
          availability: 'https://schema.org/InStock'
        }
      },
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: 'Zhiying Xin',
        honorificPrefix: 'Dr',
        jobTitle: 'Maths and Science Tutor',
        url: `${SITE}/`,
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of Manchester' },
        worksFor: { '@id': ORG_ID }
      },
      {
        '@type': 'ProfessionalService',
        '@id': ORG_ID,
        name: 'Study with Dr',
        url: `${SITE}/`,
        email: 'contact@studywithdr.co.uk',
        founder: { '@id': PERSON_ID }
      },
      {
        ...breadcrumbs([
          ['Home', `${SITE}/`],
          ['Resources', `${SITE}/resources/`],
          [item.title, url]
        ]),
        '@id': `${url}#breadcrumb`
      }
    ]
  };

  const intro = page.intro.map((p) => `<p>${esc(p)}</p>`).join('\n                    ');
  const covers = page.covers.map((c) => `<li>${esc(c)}</li>`).join('\n                        ');
  const keyIdeas = (page.key_ideas || []).map((idea) =>
    `<h3>${esc(idea.heading)}</h3>\n                    <p>${esc(idea.text)}</p>`
  ).join('\n                    ');

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${esc(page.meta_description)}">
    <title>${esc(page.title_tag)}</title>
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Study with Dr">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(page.h1)}">
    <meta property="og:description" content="${esc(page.meta_description)}">
    <meta property="og:locale" content="en_GB">
    <meta name="twitter:card" content="summary">
    <meta name="author" content="Dr Zhiying Xin">
    <link rel="stylesheet" href="/style.css">
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-JQY10RB4L4"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-JQY10RB4L4');
    </script>
    ${jsonLd(structuredData)}
</head>
<body class="page-guides page-resource">
    <header class="site-header" role="banner">
        <div class="site-container site-header-inner">
            <a class="site-brand" href="/">Study with Dr</a>
            <button type="button" class="site-nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
                <span class="site-nav-toggle-bar" aria-hidden="true"></span>
                <span class="site-nav-toggle-bar" aria-hidden="true"></span>
                <span class="site-nav-toggle-bar" aria-hidden="true"></span>
            </button>
            <nav class="site-nav" id="site-nav" aria-label="Primary navigation">
                <ul class="site-nav-list">
                    <li><a class="site-nav-link" href="/">Home</a></li>
                    <li><a class="site-nav-link is-active" href="/resources/">Resources</a></li>
                    <li><a class="site-nav-link" href="/guides/">Guides</a></li>
                    <li><a class="site-nav-link" href="/#pricing">Pricing</a></li>
                </ul>
                <a class="btn btn-navy site-nav-cta" href="/#contact">Book a lesson</a>
            </nav>
        </div>
    </header>

    <div class="container">
        <header class="article-header">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <ol>
                    <li><a href="/">Home</a></li>
                    <li><a href="/resources/">Resources</a></li>
                    <li aria-current="page">${esc(item.title)}</li>
                </ol>
            </nav>
            <h1 class="hero-headline">
                <span class="headline-main">${esc(page.h1)}</span>
            </h1>
            <p class="hero-subtitle">${esc(page.subtitle)}</p>
        </header>
    </div>

    <div class="section">
        <div class="container">
            <article class="article-wrap">
                <p class="article-meta">By <a href="/#about">Dr Zhiying Xin</a>, Study with Dr · Updated <time datetime="${item.date_modified || item.date_published}">${formatDate(item.date_modified || item.date_published)}</time></p>

                <div class="resource-download">
                    <div class="resource-download-info">
                        <p class="resource-download-title">${esc(item.title)}</p>
                        <div class="resource-item-meta">
                        ${tags}
                        </div>
                        <div class="resource-item-topics" aria-label="Topics">
                        ${topicTags}
                        </div>
                    </div>
                    <div class="resource-download-actions">
                        <a class="btn btn-navy" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${esc(ctaLabel)}</a>
                        <p class="resource-download-note">Hosted on Payhip. Opens in a new tab.</p>
                    </div>
                </div>

                <div class="article-body">
                    <h2>Who these notes are for</h2>
                    ${intro}

                    <h2>What the notes cover</h2>
                    <ul>
                        ${covers}
                    </ul>
                    <p>${esc(page.scope_note)}</p>
${keyIdeas ? `
                    <h2>Key ideas at a glance</h2>
                    ${keyIdeas}
` : ''}
                    <h2>About the author</h2>
                    <p>Dr Zhiying Xin is the founder of Study with Dr and a private Maths and Science tutor with nearly seven years of experience, teaching students from 11+ and GCSE through to A-Level and university. She completed her PhD at the University of Manchester.</p>
                </div>

                <div class="article-cta">
                    <p><strong>${esc(page.tuition_heading)}</strong> ${esc(page.tuition_text)}</p>
                    <a class="btn btn-primary" href="/#contact">${esc(page.tuition_cta)}</a>
                </div>

                <div class="article-links">
                    <a href="/resources/">&larr; Back to all resources</a>
                </div>
            </article>
        </div>
    </div>

    <footer>
        <div class="site-container">
            <div class="footer-newsletter">
                <p class="footer-newsletter-label">Want revision tips and exam-board advice by email? No spam, unsubscribe anytime.</p>
                <form id="newsletter-form" class="footer-newsletter-form" action="https://formspree.io/f/xqelgqbj" method="POST">
                    <input type="email" id="email-input" name="email" placeholder="Your email address" required>
                    <button type="submit">Subscribe</button>
                </form>
            </div>
            <p class="footer-copyright">&copy; 2026 Study with Dr · Maths & Science Tutoring, Manchester</p>
        </div>
    </footer>
    <script src="/script.js"></script>
</body>
</html>
`;
}

function formatDate(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London'
  });
}

// Resource pages
for (const item of pages) {
  write(`resources/${item.slug}.html`, renderResourcePage(item));
}

// Library prerender: same markup the browser renders for the default Maths tab.
const container = { innerHTML: '' };
SWD.renderPdfList(container, rows, { subject: 'maths', topics: [] });
const listIndent = '                ';
let resourcesHtml = read('resources/index.html');
resourcesHtml = replaceBetween(resourcesHtml, 'resource-list', listIndent + container.innerHTML, listIndent);

const listed = rows.filter((row) => container.innerHTML.includes(esc(row.title)));
const resourcesLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${SITE}/resources/#webpage`,
      url: `${SITE}/resources/`,
      name: 'Free Maths & Science Revision Resources',
      inLanguage: 'en-GB',
      publisher: { '@id': ORG_ID },
      breadcrumb: { '@id': `${SITE}/resources/#breadcrumb` },
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: listed.map((row, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: row.title,
          url: row.page_url ? SITE + row.page_url : row.external_url
        }))
      }
    },
    {
      ...breadcrumbs([['Home', `${SITE}/`], ['Resources', `${SITE}/resources/`]]),
      '@id': `${SITE}/resources/#breadcrumb`
    }
  ]
};
resourcesHtml = replaceBetween(resourcesHtml, 'resources-jsonld', '    ' + jsonLd(resourcesLd), '    ');
write('resources/index.html', resourcesHtml);

// Sitemap
const sitemapEntries = pages.map((item) => [
  '  <url>',
  `    <loc>${resourceUrl(item)}</loc>`,
  `    <lastmod>${item.date_modified || item.date_published}</lastmod>`,
  '    <changefreq>monthly</changefreq>',
  '    <priority>0.7</priority>',
  '  </url>'
].join('\n')).join('\n');
write('sitemap.xml', replaceBetween(read('sitemap.xml'), 'resource-pages', sitemapEntries, '  '));

console.log(`Built ${pages.length} resource page(s); prerendered ${listed.length} library item(s).`);
