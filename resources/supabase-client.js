window.StudyWithDr = window.StudyWithDr || {};

window.StudyWithDr.CATEGORIES = [
  { slug: 'gcse-maths', name: 'GCSE Maths' },
  { slug: 'a-level-maths', name: 'A-Level Maths' },
  { slug: 'a-level-physics', name: 'A-Level Physics' },
  { slug: 'a-level-chemistry', name: 'A-Level Chemistry' },
  { slug: 'chemistry', name: 'Chemistry' },
  { slug: 'university', name: 'University' }
];

window.StudyWithDr.EXAM_BOARDS = {
  'a-level-chemistry': [
    { slug: 'edexcel-intl', name: 'International Edexcel' }
  ]
};

window.StudyWithDr.getExamBoards = function (categorySlug) {
  return window.StudyWithDr.EXAM_BOARDS[categorySlug] || [];
};

window.StudyWithDr.escapeHtml = function (text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

window.StudyWithDr.getSearchText = function (row) {
  return [
    row.title,
    row.description,
    row.category_name,
    row.exam_board_name
  ].filter(Boolean).join(' ').toLowerCase();
};

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

window.StudyWithDr.renderPdfItem = function (item, href) {
  var esc = window.StudyWithDr.escapeHtml;
  var desc = item.description ? '<span class="pdf-desc">' + esc(item.description) + '</span>' : '';
  var board = item.exam_board_name ? '<span class="pdf-board-tag">' + esc(item.exam_board_name) + '</span>' : '';
  var searchText = esc(window.StudyWithDr.getSearchText(item));

  return (
    '<li data-search-text="' + searchText + '">' +
      '<a class="pdf-link" href="' + href + '" target="_blank" rel="noopener">' +
        esc(item.title) + board +
      '</a>' +
      desc +
    '</li>'
  );
};

window.StudyWithDr.renderPdfList = function (container, rows, options) {
  options = options || {};
  var query = (options.query || '').trim().toLowerCase();
  var filtered = rows;

  if (query) {
    filtered = rows.filter(function (row) {
      return window.StudyWithDr.getSearchText(row).indexOf(query) !== -1;
    });
  }

  if (!filtered.length) {
    container.innerHTML = query
      ? '<p class="pdf-empty">No resources matched your search. Try a different keyword.</p>'
      : '<p class="pdf-empty">Revision PDFs will appear here soon. Check back after your next lesson.</p>';
    return;
  }

  if (query) {
    var searchItems = filtered.map(function (item) {
      var href = item._local
        ? './files/' + item.category_slug + '/' + encodeURIComponent(item._file)
        : window.StudyWithDr.getPdfUrl(item.file_path);
      return window.StudyWithDr.renderPdfItem(item, href);
    }).join('');

    container.innerHTML =
      '<section class="pdf-category pdf-category-search">' +
        '<h2 class="pdf-category-title">Search results</h2>' +
        '<p class="pdf-search-count">' + filtered.length + ' resource' + (filtered.length === 1 ? '' : 's') + ' found</p>' +
        '<ul class="pdf-list">' + searchItems + '</ul>' +
      '</section>';
    return;
  }

  var byCategory = {};
  filtered.forEach(function (row) {
    if (!byCategory[row.category_slug]) {
      byCategory[row.category_slug] = { name: row.category_name, items: [] };
    }
    byCategory[row.category_slug].items.push(row);
  });

  var order = window.StudyWithDr.CATEGORIES.map(function (c) { return c.slug; });
  var esc = window.StudyWithDr.escapeHtml;

  container.innerHTML = order
    .filter(function (slug) { return byCategory[slug]; })
    .map(function (slug) {
      var cat = byCategory[slug];
      var boards = window.StudyWithDr.getExamBoards(slug);
      var hasBoards = boards.length > 0;

      if (!hasBoards) {
        var flatItems = cat.items.map(function (item) {
          var href = item._local
            ? './files/' + item.category_slug + '/' + encodeURIComponent(item._file)
            : window.StudyWithDr.getPdfUrl(item.file_path);
          return window.StudyWithDr.renderPdfItem(item, href);
        }).join('');

        return (
          '<section class="pdf-category">' +
            '<h2 class="pdf-category-title">' + esc(cat.name) + '</h2>' +
            '<ul class="pdf-list">' + flatItems + '</ul>' +
          '</section>'
        );
      }

      var boardSections = boards.map(function (board) {
        var boardItems = cat.items.filter(function (item) {
          return item.exam_board === board.slug;
        });

        if (!boardItems.length) return '';

        var itemsHtml = boardItems.map(function (item) {
          var href = window.StudyWithDr.getPdfUrl(item.file_path);
          return window.StudyWithDr.renderPdfItem(item, href);
        }).join('');

        return (
          '<div class="pdf-board-group">' +
            '<h3 class="pdf-board-title">' + esc(board.name) + '</h3>' +
            '<ul class="pdf-list">' + itemsHtml + '</ul>' +
          '</div>'
        );
      }).join('');

      var ungrouped = cat.items.filter(function (item) {
        return !item.exam_board;
      });

      if (ungrouped.length) {
        boardSections += (
          '<div class="pdf-board-group">' +
            '<h3 class="pdf-board-title">General</h3>' +
            '<ul class="pdf-list">' +
              ungrouped.map(function (item) {
                return window.StudyWithDr.renderPdfItem(item, window.StudyWithDr.getPdfUrl(item.file_path));
              }).join('') +
            '</ul>' +
          '</div>'
        );
      }

      return (
        '<section class="pdf-category">' +
          '<h2 class="pdf-category-title">' + esc(cat.name) + '</h2>' +
          boardSections +
        '</section>'
      );
    })
    .join('');
};
