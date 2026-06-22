window.StudyWithDr = window.StudyWithDr || {};

window.StudyWithDr.CATEGORIES = [
  { slug: 'gcse-maths', name: 'GCSE Maths' },
  { slug: 'a-level-maths', name: 'A-Level Maths' },
  { slug: 'a-level-physics', name: 'A-Level Physics' },
  { slug: 'a-level-chemistry', name: 'A-Level Chemistry' },
  { slug: 'chemistry', name: 'Chemistry' },
  { slug: 'university', name: 'University' }
];

window.StudyWithDr.getSupabase = function () {
  if (window.StudyWithDr._client) return window.StudyWithDr._client;

  var cfg = window.STUDY_WITH_DR_SUPABASE;
  if (!cfg || !cfg.url || !cfg.anonKey || cfg.url.indexOf('YOUR_PROJECT') !== -1) {
    return null;
  }

  window.StudyWithDr._client = window.supabase.createClient(cfg.url, cfg.anonKey);
  return window.StudyWithDr._client;
};

window.StudyWithDr.getPdfUrl = function (filePath) {
  var client = window.StudyWithDr.getSupabase();
  if (!client) return '#';
  return client.storage.from('pdf-resources').getPublicUrl(filePath).data.publicUrl;
};

window.StudyWithDr.renderPdfList = function (container, rows) {
  if (!rows.length) {
    container.innerHTML = '<p class="pdf-empty">Revision PDFs will appear here soon. Check back after your next lesson.</p>';
    return;
  }

  var byCategory = {};
  rows.forEach(function (row) {
    if (!byCategory[row.category_slug]) {
      byCategory[row.category_slug] = { name: row.category_name, items: [] };
    }
    byCategory[row.category_slug].items.push(row);
  });

  var order = window.StudyWithDr.CATEGORIES.map(function (c) { return c.slug; });

  container.innerHTML = order
    .filter(function (slug) { return byCategory[slug]; })
    .map(function (slug) {
      var cat = byCategory[slug];
      var items = cat.items.map(function (item) {
        var href = window.StudyWithDr.getPdfUrl(item.file_path);
        var desc = item.description ? '<span class="pdf-desc">' + item.description + '</span>' : '';
        return '<li><a class="pdf-link" href="' + href + '" target="_blank" rel="noopener">' + item.title + '</a>' + desc + '</li>';
      }).join('');

      return (
        '<section class="pdf-category">' +
          '<h2 class="pdf-category-title">' + cat.name + '</h2>' +
          '<ul class="pdf-list">' + items + '</ul>' +
        '</section>'
      );
    })
    .join('');
};
