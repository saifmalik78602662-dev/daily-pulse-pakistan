const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'daily-wire.db');
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    slug TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT
  );
`);

function countArticles() {
  const row = db.prepare('SELECT COUNT(*) AS c FROM articles').get();
  return row.c;
}

function slugify(title, id) {
  const base = (title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return (base || 'article') + '-' + id.slice(-6);
}

// NOTE ON PLACEHOLDER CONTENT:
// These seed articles are original, clearly-fictional placeholder text
// written for this template — not copied from any real publication, and
// not attributed to any real named journalist. The byline is a generic
// desk name, not a fabricated individual, because inventing named "staff"
// who don't exist would be misleading. Replace all of this with your
// own real reporting before publishing the site publicly.
function seedIfEmpty() {
  if (countArticles() > 0) return;

  const now = Date.now();
  const seed = [
    ['seed1', 'Central Bank Holds Interest Rates Steady Amid Cooling Inflation', 'Business', 'Business Desk',
      'Policymakers cite easing food prices and a stable currency as inflation drops to its lowest level in two years.',
      'The central bank kept its benchmark interest rate unchanged today, citing a continued slowdown in headline inflation and improved currency stability over the past quarter. Officials said food prices, which had been the main driver of inflation for much of the past two years, have eased significantly following a strong harvest season.\n\nIn a statement released after the policy meeting, the bank\'s governor said the decision reflects a "cautious but deliberate" shift toward supporting economic growth, while still keeping a close eye on external risks such as global commodity prices and exchange rate volatility.\n\nAnalysts had largely expected the rate to hold steady, with most forecasts pointing to a potential cut later in the year if inflation continues to trend downward. Business groups welcomed the decision, saying predictable monetary policy gives companies more confidence to plan investments.\n\nThe next policy review is expected in the coming months, with markets watching closely for any signal of a shift toward rate cuts.\n\n[This is placeholder template content, not a real news report. Replace before publishing.]',
      now - 3600e3 * 2],
    ['seed2', 'Local Startups Raise Record Funding in First Half of 2026', 'Technology', 'Technology Desk',
      'Investors point to a maturing ecosystem and stronger exit pathways for regional founders.',
      'Startups in the region raised a record amount of funding in the first half of 2026, according to a new industry report, marking the strongest six-month period on record for the local tech ecosystem.\n\nThe report credits the surge to a combination of factors: a maturing pool of experienced founders building second or third companies, growing interest from international investors, and a handful of high-profile exits that have proven the market can deliver returns.\n\nFintech and logistics software accounted for the largest share of funding, though a growing number of deals went to startups working on AI-powered tools for small businesses. Industry observers expect the momentum to continue into the second half of the year, barring any major shift in global interest rates.\n\n[This is placeholder template content, not a real news report. Replace before publishing.]',
      now - 3600e3 * 5],
    ['seed3', 'National Team Names Squad for Upcoming Home Series', 'Sports', 'Sports Desk',
      'Selectors bring in two uncapped players ahead of the three-match series next month.',
      'The national selection committee today announced a 16-member squad for the upcoming home series, including two uncapped players who impressed selectors during the domestic season.\n\nThe head coach said the squad reflects a balance between experience and fresh talent, with several senior players returning from injury alongside younger names earning their first call-up.\n\nThe three-match series begins next month and will be the team\'s first major assignment of the season. Tickets for the opening match go on sale this week, with strong early demand expected given the rivalry between the two sides.\n\n[This is placeholder template content, not a real news report. Replace before publishing.]',
      now - 3600e3 * 8],
    ['seed4', 'Regional Leaders Meet to Discuss Trade Corridor Expansion', 'World', 'World Desk',
      'Talks focus on reducing transit times and easing customs procedures along the corridor.',
      'Senior officials from across the region met this week to discuss plans for expanding a major trade corridor, with talks centered on reducing transit times and simplifying customs procedures for cross-border shipments.\n\nThe corridor, which currently handles a significant share of regional trade, has faced criticism in recent years over delays at border crossings and inconsistent documentation requirements between participating countries.\n\nA working group has been established to draft a unified customs framework, with a follow-up meeting expected within the next few months.\n\n[This is placeholder template content, not a real news report. Replace before publishing.]',
      now - 3600e3 * 11],
    ['seed5', 'Government Announces New Digital ID Rollout for Rural Areas', 'Pakistan', 'Pakistan Desk',
      'The initiative aims to extend biometric verification services to more rural districts over the coming year.',
      'The government this week announced a new phase of its digital identity program, aimed at extending biometric verification services to more rural districts over the coming year.\n\nOfficials say the expansion will make it easier for rural residents to access government services, open bank accounts, and receive social support payments without having to travel long distances to district offices.\n\nMobile registration units will be deployed in phases, starting with the districts that currently have the lowest digital ID coverage. Some rights groups have raised questions about data privacy safeguards, and the relevant ministry said additional details on the privacy framework would be published before the rollout begins.\n\n[This is placeholder template content, not a real news report. Replace before publishing.]',
      now - 3600e3 * 14],
    ['seed6', 'Met Office Issues Advisory Ahead of Monsoon Season', 'Weather', 'Weather Desk',
      'Residents in low-lying districts are urged to prepare as forecasters predict above-average rainfall this season.',
      'The meteorological department has issued an advisory ahead of the upcoming monsoon season, forecasting above-average rainfall across several regions this year.\n\nForecasters say a stronger-than-usual weather pattern could bring heavier rains than in recent years, with low-lying and riverside districts at greater risk of flooding. Local disaster management authorities have been asked to review evacuation plans and ensure drainage systems are cleared ahead of the season.\n\nResidents in affected areas are being advised to avoid unnecessary travel during heavy rain warnings and to keep emergency supplies on hand.\n\n[This is placeholder template content, not a real news report. Replace before publishing.]',
      now - 3600e3 * 20],
    ['seed7', 'Op-Ed: Why Local Newsrooms Still Matter in a Crowded Media Landscape', 'Opinion', 'Opinion Desk',
      'A case for why community-focused reporting still fills a gap that larger national outlets tend to overlook.',
      'Opinion pieces on this site represent the views of the individual writer and not necessarily the editorial position of the publication as a whole. This placeholder op-ed outlines why many readers still value smaller, community-focused newsrooms even as attention increasingly shifts to large national and international outlets.\n\nLocal reporting tends to cover stories that larger outlets have little incentive to follow closely: municipal budget decisions, school board meetings, small business openings and closures, and neighborhood-level infrastructure projects. These stories rarely make national headlines, but they shape daily life for the people who live with their outcomes.\n\nThe argument isn\'t that local coverage should replace national or international reporting — the two serve different purposes. Rather, a healthy information ecosystem benefits from having both: broad context from larger outlets, and grounded, specific coverage from newsrooms embedded in the communities they cover.\n\n[This is placeholder template content, not a real opinion column. Replace before publishing.]',
      now - 3600e3 * 26],
  ];

  const insert = db.prepare(`
    INSERT INTO articles (id, title, category, author, excerpt, content, slug, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of seed) {
    const [id, title, category, author, excerpt, content, ts] = row;
    insert.run(id, title, category, author, excerpt, content, slugify(title, id), new Date(ts).toISOString());
  }
}

seedIfEmpty();

function listArticles() {
  return db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all();
}

function listArticlesByCategory(category) {
  if (!category || category === 'All') return listArticles();
  return db.prepare('SELECT * FROM articles WHERE category = ? ORDER BY created_at DESC').all(category);
}

function getArticle(idOrSlug) {
  return db.prepare('SELECT * FROM articles WHERE id = ? OR slug = ?').get(idOrSlug, idOrSlug);
}

function createArticle({ id, title, category, author, excerpt, content }) {
  const createdAt = new Date().toISOString();
  const slug = slugify(title, id);
  db.prepare(`
    INSERT INTO articles (id, title, category, author, excerpt, content, slug, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, category, author || '', excerpt, content || '', slug, createdAt);
  return getArticle(id);
}

function updateArticle(id, { title, category, author, excerpt, content }) {
  const updatedAt = new Date().toISOString();
  db.prepare(`
    UPDATE articles SET title = ?, category = ?, author = ?, excerpt = ?, content = ?, updated_at = ?
    WHERE id = ?
  `).run(title, category, author || '', excerpt, content || '', updatedAt, id);
  return getArticle(id);
}

function deleteArticle(id) {
  db.prepare('DELETE FROM articles WHERE id = ?').run(id);
}

const CATEGORIES = ['Pakistan', 'World', 'Business', 'Technology', 'Sports', 'Opinion', 'Weather'];

module.exports = {
  listArticles,
  listArticlesByCategory,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  CATEGORIES,
};
