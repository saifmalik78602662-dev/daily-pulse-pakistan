require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const db = require('./db');
const { createSession, requireAuth } = require('./auth');
const render = require('./render');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------
// Mailer setup (used by the contact form). If SMTP env vars are missing,
// the server still runs — it just logs the message instead of emailing it,
// so local development doesn't require real credentials.
// ---------------------------------------------------------------------
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) !== 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
  });
}

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'saifmalik78602662@gmail.com';

// =======================================================================
// SERVER-RENDERED PUBLIC PAGES
// These build full HTML (with real article text already inside) on the
// server, so search engines and no-JS browsers see complete content —
// not an empty shell waiting on client-side fetch().
// =======================================================================

// ---------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------
app.get('/', (req, res) => {
  try {
    const sorted = db.listArticles();
    const top = sorted[0];
    const side = sorted.slice(1, 4);
    const rest = sorted.slice(4);
    const canonical = render.baseUrl(req) + '/';

    const bodyHtml = `
<main id="home">
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-lead" id="home">
        ${render.heroFragment(top)}
      </div>
      <div class="hero-side">
        ${side.map(render.sideStoryFragment).join('\n')}
      </div>
    </div>
  </section>

  <section class="section" id="news">
    <div class="wrap">
      <div class="section-head">
        <h2>Latest News</h2>
        <a href="/articles.html" class="see-all">View All Stories →</a>
      </div>
      <div class="grid">
        ${rest.length ? rest.map(render.cardFragment).join('\n') : '<p style="color:var(--ink-dim); padding:20px;">More stories coming soon.</p>'}
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0;">
    <div class="wrap">
      <div class="newsletter">
        <div>
          <h3>Get the Morning Brief</h3>
          <p>One email, every morning, with the stories that matter. No noise.</p>
        </div>
        <form class="newsletter-form" onsubmit="event.preventDefault(); this.querySelector('button').textContent='Subscribed ✓';">
          <input type="email" placeholder="you@example.com" required>
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </div>
  </section>

  <section class="section" id="about">
    <div class="wrap">
      <div class="section-head"><h2>About Us</h2></div>
      <div class="about-grid">
        <div>
          <p class="lead-text">"We report what happened, why it matters, and who it affects."</p>
          <p>${render.SITE_NAME} is a news and current-affairs website covering Pakistan and international stories across politics, business, technology, sports, and daily life. Our goal is to present news clearly, separate factual reporting from opinion, and keep the site easy to navigate.</p>
          <p>This site is currently running on placeholder/template articles while it is being set up — they are clearly marked as such within each article. They will be replaced with real reporting before the site is used as a live publication. We don't publish sponsored content disguised as news, and any correction we make will be noted openly on the relevant article.</p>
          <p>For questions about our editorial approach, corrections, or anything else, see the <a href="/#contact" style="color:var(--gold);">Contact</a> section below.</p>
        </div>
        <div>
          <div class="info-block">
            <div class="k">What we cover</div>
            <div class="v" style="font-size:14.5px; color:var(--ink-dim); line-height:1.8;">Pakistan news, world affairs, business &amp; economy, technology, sports, opinion columns, and weather advisories.</div>
          </div>
          <div class="info-block">
            <div class="k">Editorial approach</div>
            <div class="v" style="font-size:14.5px; color:var(--ink-dim); line-height:1.8;">News reporting and opinion content are clearly labelled and kept separate. Opinion pieces reflect the views of the individual writer, not the publication as a whole.</div>
          </div>
          <div class="info-block">
            <div class="k">Corrections</div>
            <div class="v" style="font-size:14.5px; color:var(--ink-dim); line-height:1.8;">If you spot an error in any article, please use the contact form — corrections are reviewed and applied promptly.</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="contact">
    <div class="wrap">
      <div class="section-head"><h2>Contact Us</h2></div>
      <div class="contact-grid">
        <div>
          <div class="info-block">
            <div class="k">Email</div>
            <div class="v"><a href="mailto:${render.CONTACT_EMAIL}">${render.CONTACT_EMAIL}</a></div>
            <div class="info-note">Form bharne par message seedha is email par backend ke zariye bhej diya jata hai.</div>
          </div>
        </div>
        <div>
          <form id="contactForm">
            <div class="row2">
              <div class="field">
                <label for="name">Full Name</label>
                <input id="name" name="name" type="text" placeholder="Your name" required>
              </div>
              <div class="field">
                <label for="email">Your Email</label>
                <input id="email" name="email" type="email" placeholder="you@example.com" required>
              </div>
            </div>
            <div class="field">
              <label for="topic">Subject</label>
              <select id="topic" name="subject">
                <option>General Inquiry</option>
                <option>News Tip</option>
                <option>Advertising</option>
                <option>Correction Request</option>
              </select>
            </div>
            <div class="field">
              <label for="message">Message</label>
              <textarea id="message" name="message" rows="5" placeholder="Write your message..." required></textarea>
            </div>
            <button type="submit" class="submit-btn" id="contactSubmitBtn">Send Message</button>
            <div class="form-note" id="formNote">Hum aam tor par 1-2 business days mein reply karte hain.</div>
          </form>
        </div>
      </div>
    </div>
  </section>
</main>`;

    const extraScripts = `<script>
  const sections = ['home','news','about','contact'].map(id => document.getElementById(id));
  const navLinks = document.querySelectorAll('#mainnav a[href^="/#"]');
  window.addEventListener('scroll', () => {
    let current = 'home';
    sections.forEach(sec => { if (sec && window.scrollY >= sec.offsetTop - 120) current = sec.id; });
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === '/#' + current));
  });

  document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    const note = document.getElementById('formNote');
    const payload = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      subject: document.getElementById('topic').value,
      message: document.getElementById('message').value,
    };
    btn.disabled = true; btn.textContent = 'Sending…';
    try{
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      note.textContent = 'Message bhej diya gaya — shukriya!';
      note.classList.add('success'); note.classList.remove('error');
      e.target.reset();
    }catch(err){
      note.textContent = 'Message bhejne mein masla hua. Dobara koshish karein.';
      note.classList.add('error'); note.classList.remove('success');
    }finally{
      btn.disabled = false; btn.textContent = 'Send Message';
    }
  });
</script>`;

    res.send(render.page({
      title: `${render.SITE_NAME} — Breaking News, Analysis & Stories`,
      description: 'Latest news, analysis, and stories from Daily Pulse Pakistan — covering Pakistan, world affairs, business, technology, sports, opinion, and weather.',
      canonical,
      active: 'home',
      bodyHtml,
      extraScripts,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------------------------------------------------------------------
// Articles listing page (with real, crawlable category filtering via
// ?category=, so it works with and without JavaScript)
// ---------------------------------------------------------------------
app.get('/articles.html', (req, res) => {
  try {
    const activeCategory = db.CATEGORIES.includes(req.query.category) ? req.query.category : 'All';
    const list = db.listArticlesByCategory(activeCategory);
    const canonical = render.baseUrl(req) + '/articles.html' + (activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : '');

    const chips = ['All', ...db.CATEGORIES].map(c => {
      const href = c === 'All' ? '/articles.html' : `/articles.html?category=${encodeURIComponent(c)}`;
      const cls = c === activeCategory ? 'chip active' : 'chip';
      return `<a href="${href}" class="${cls}">${render.escapeHtml(c)}</a>`;
    }).join('\n');

    const bodyHtml = `
<main class="page-wrap" style="max-width:1180px;">
  <div class="breadcrumb"><a href="/">Home</a> / Articles</div>
  <div class="section-head" style="margin-top:0;"><h1 style="font-family:'Playfair Display', serif; font-size:26px; font-weight:700;">All Articles</h1></div>
  <div class="chip-row">${chips}</div>
  <div class="grid">
    ${list.length ? list.map(render.cardFragment).join('\n') : '<p style="color:var(--ink-dim); padding:20px;">No articles in this category yet.</p>'}
  </div>
</main>`;

    res.send(render.page({
      title: activeCategory === 'All'
        ? `All Articles — ${render.SITE_NAME}`
        : `${activeCategory} News — ${render.SITE_NAME}`,
      description: activeCategory === 'All'
        ? `Browse all news articles and stories from ${render.SITE_NAME}.`
        : `Latest ${activeCategory} news and stories from ${render.SITE_NAME}.`,
      canonical,
      active: 'articles',
      bodyHtml,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------------------------------------------------------------------
// Single article page — readable slug URL, full content server-rendered
// ---------------------------------------------------------------------
app.get('/article/:slug', (req, res) => {
  try {
    const a = db.getArticle(req.params.slug);
    if (!a) {
      res.status(404).send(render.page({
        title: `Story Not Found — ${render.SITE_NAME}`,
        description: 'This article may have been removed or the link is incorrect.',
        canonical: render.baseUrl(req) + '/article/' + encodeURIComponent(req.params.slug),
        active: 'articles',
        bodyHtml: `<main class="page-wrap"><div class="breadcrumb"><a href="/">Home</a> / <a href="/articles.html">Articles</a> / Not found</div><h1 class="article-title">Story not found</h1><p style="color:var(--ink-dim); margin-bottom:20px;">This article may have been removed or the link is incorrect.</p><a href="/articles.html" class="back-link">← Back to all articles</a></main>`,
      }));
      return;
    }

    const paragraphs = (a.content && a.content.trim())
      ? a.content.split(/\n\s*\n/).map(p => `<p>${render.escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('\n')
      : `<p>${render.escapeHtml(a.excerpt)}</p>`;

    const canonical = render.baseUrl(req) + '/article/' + encodeURIComponent(a.slug);

    const bodyHtml = `
<main class="page-wrap">
  <div class="breadcrumb"><a href="/">Home</a> / <a href="/articles.html">Articles</a> / ${render.escapeHtml(a.title)}</div>
  <div class="article-cat">${render.escapeHtml(a.category)}</div>
  <h1 class="article-title">${render.escapeHtml(a.title)}</h1>
  <div class="article-byline">By ${render.escapeHtml(a.author || 'Staff Reporter')} · Published ${render.fmtDate(a.created_at)}${a.updated_at ? ' · Updated ' + render.fmtDate(a.updated_at) : ''}</div>
  <div class="article-body">${paragraphs}</div>
  <a href="/articles.html" class="back-link">← Back to all articles</a>
</main>`;

    res.send(render.page({
      title: `${a.title} — ${render.SITE_NAME}`,
      description: a.excerpt,
      canonical,
      ogType: 'article',
      active: 'articles',
      bodyHtml,
    }));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Backward-compatible redirect for the old query-string article links
app.get('/article.html', (req, res) => {
  const a = req.query.id ? db.getArticle(req.query.id) : null;
  if (a) return res.redirect(301, '/article/' + encodeURIComponent(a.slug));
  res.redirect(302, '/articles.html');
});

// ---------------------------------------------------------------------
// robots.txt / sitemap.xml — generated dynamically so the sitemap always
// has correct absolute URLs and every published article included.
// ---------------------------------------------------------------------
app.get('/robots.txt', (req, res) => {
  const base = render.baseUrl(req);
  res.type('text/plain').send(
`User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${base}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req, res) => {
  const base = render.baseUrl(req);
  const staticUrls = ['/', '/articles.html', '/privacy-policy.html', '/terms.html', '/disclaimer.html'];
  const articles = db.listArticles();
  const urls = [
    ...staticUrls.map(u => `  <url><loc>${base}${u}</loc></url>`),
    ...articles.map(a => `  <url><loc>${base}/article/${encodeURIComponent(a.slug)}</loc><lastmod>${(a.updated_at || a.created_at).slice(0, 10)}</lastmod></url>`),
  ];
  res.type('application/xml').send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`);
});

// =======================================================================
// STATIC FILES (admin dashboard, legal pages, 404, stylesheet)
// =======================================================================
app.use(express.static(path.join(__dirname, 'public')));

// =======================================================================
// JSON API — used by the Admin dashboard
// =======================================================================
app.get('/api/articles', (req, res) => {
  try {
    res.json(db.listArticles());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load articles.' });
  }
});

app.get('/api/articles/:id', (req, res) => {
  try {
    const article = db.getArticle(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found.' });
    res.json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load article.' });
  }
});

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = createSession();
  res.json({ token });
});

app.post('/api/articles', requireAuth, (req, res) => {
  const { title, category, author, excerpt, content } = req.body || {};
  if (!title || !category || !excerpt) {
    return res.status(400).json({ error: 'Title, category, and summary are required.' });
  }
  if (!db.CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Category must be one of: ' + db.CATEGORIES.join(', ') });
  }
  const id = 'a' + Date.now() + crypto.randomBytes(3).toString('hex');
  const article = db.createArticle({ id, title, category, author, excerpt, content });
  res.status(201).json(article);
});

app.put('/api/articles/:id', requireAuth, (req, res) => {
  const { title, category, author, excerpt, content } = req.body || {};
  if (!title || !category || !excerpt) {
    return res.status(400).json({ error: 'Title, category, and summary are required.' });
  }
  if (!db.CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Category must be one of: ' + db.CATEGORIES.join(', ') });
  }
  const article = db.updateArticle(req.params.id, { title, category, author, excerpt, content });
  if (!article) return res.status(404).json({ error: 'Article not found.' });
  res.json(article);
});

app.delete('/api/articles/:id', requireAuth, (req, res) => {
  db.deleteArticle(req.params.id);
  res.status(204).end();
});

// ---------------------------------------------------------------------
// Contact form -> sends an email to CONTACT_EMAIL
// ---------------------------------------------------------------------
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const mailBody = `New message from the ${render.SITE_NAME} contact form\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject || 'General Inquiry'}\n\nMessage:\n${message}`;

  if (!transporter) {
    console.log('--- CONTACT FORM (SMTP not configured, logging instead) ---');
    console.log(mailBody);
    return res.json({ ok: true, note: 'Message received (email sending is not configured on the server yet).' });
  }

  try {
    await transporter.sendMail({
      from: `"${render.SITE_NAME} Website" <${process.env.SMTP_USER}>`,
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: `[Website] ${subject || 'General Inquiry'} — from ${name}`,
      text: mailBody,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Email send failed, logging message instead:', err.message);
    console.log('--- CONTACT FORM (email delivery failed) ---');
    console.log(mailBody);
    res.json({ ok: true, note: 'Message received. (Email delivery is not fully configured yet — check SMTP settings in .env.)' });
  }
});

// ---------------------------------------------------------------------
// 404 fallback — keeps unknown URLs from showing a raw server error
// ---------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`${render.SITE_NAME} server running at http://localhost:${PORT}`);
});
