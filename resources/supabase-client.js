window.StudyWithDr = window.StudyWithDr || {};

window.StudyWithDr.LEGACY_CATEGORY_SLUGS = {
  'gcse-maths': 'maths-gcse',
  'chemistry': 'chemistry-gcse',
  'a-level-maths': 'maths-a-level',
  'a-level-physics': 'physics-a-level',
  'a-level-chemistry': 'chemistry-a-level',
  'university': 'maths-university',
  'general-maths-drills': 'maths-drills'
};

window.StudyWithDr.EXAM_BOARD_OPTIONS = [
  { slug: 'aqa', name: 'AQA' },
  { slug: 'edexcel', name: 'Edexcel' },
  { slug: 'ocr', name: 'OCR' },
  { slug: 'cie', name: 'CIE (Cambridge)' },
  { slug: 'edexcel-intl', name: 'International Edexcel' },
  { slug: 'wjec', name: 'WJEC' },
  { slug: 'eduqas', name: 'Eduqas' },
  { slug: 'ib', name: 'IB' }
];

var GCSE_WITH_BOARDS = { slug: 'gcse', name: 'GCSE', hasTopics: true, hasExamBoards: true };
var ALEVEL_WITH_BOARDS = { slug: 'a-level', name: 'A-Level', hasTopics: true, hasExamBoards: true };

window.StudyWithDr.RESOURCE_SUBJECTS = [
  {
    slug: 'maths',
    name: 'Maths',
    levels: [
      GCSE_WITH_BOARDS,
      ALEVEL_WITH_BOARDS,
      { slug: 'university', name: 'University', hasCourses: true },
      { slug: 'drills', name: 'General Maths Drills' }
    ]
  },
  {
    slug: 'physics',
    name: 'Physics',
    levels: [
      GCSE_WITH_BOARDS,
      ALEVEL_WITH_BOARDS,
      { slug: 'university', name: 'University', hasCourses: true }
    ]
  },
  {
    slug: 'chemistry',
    name: 'Chemistry',
    levels: [
      GCSE_WITH_BOARDS,
      ALEVEL_WITH_BOARDS,
      { slug: 'university', name: 'University', hasCourses: true }
    ]
  },
  {
    slug: 'computer-science',
    name: 'Computer Science',
    levels: [
      GCSE_WITH_BOARDS,
      ALEVEL_WITH_BOARDS,
      { slug: 'university', name: 'University', hasCourses: true }
    ]
  }
];

window.StudyWithDr.normalizeCategorySlug = function (categorySlug) {
  return window.StudyWithDr.LEGACY_CATEGORY_SLUGS[categorySlug] || categorySlug;
};

window.StudyWithDr.buildCategories = function () {
  var categories = [];

  window.StudyWithDr.RESOURCE_SUBJECTS.forEach(function (subject) {
    subject.levels.forEach(function (level) {
      categories.push({
        slug: subject.slug + '-' + level.slug,
        name: subject.name + ' · ' + level.name,
        subject: subject.slug,
        subjectName: subject.name,
        level: level.slug,
        levelName: level.name,
        hasTopics: !!level.hasTopics,
        hasCourses: !!level.hasCourses,
        hasExamBoards: !!level.hasExamBoards
      });
    });
  });

  return categories;
};

window.StudyWithDr.CATEGORIES = window.StudyWithDr.buildCategories();

window.StudyWithDr.getCategoryBySlug = function (categorySlug) {
  var normalized = window.StudyWithDr.normalizeCategorySlug(categorySlug);
  return window.StudyWithDr.CATEGORIES.find(function (cat) {
    return cat.slug === normalized;
  }) || null;
};

window.StudyWithDr.getCategoriesForSubject = function (subjectSlug) {
  return window.StudyWithDr.CATEGORIES
    .filter(function (cat) { return cat.subject === subjectSlug; })
    .map(function (cat) { return cat.slug; });
};

window.StudyWithDr.getLevelsForSubject = function (subjectSlug) {
  var subject = window.StudyWithDr.RESOURCE_SUBJECTS.find(function (item) {
    return item.slug === subjectSlug;
  });
  return subject ? subject.levels : [];
};

window.StudyWithDr.getCategorySlug = function (subjectSlug, levelSlug) {
  return subjectSlug + '-' + levelSlug;
};

window.StudyWithDr.hasCourses = function (categorySlug) {
  var cat = window.StudyWithDr.getCategoryBySlug(categorySlug);
  return !!(cat && cat.hasCourses);
};

window.StudyWithDr.hasTopics = function (categorySlug) {
  var cat = window.StudyWithDr.getCategoryBySlug(categorySlug);
  return !!(cat && cat.hasTopics && !window.StudyWithDr.getExamBoards(categorySlug).length);
};

window.StudyWithDr.hasDirectFolders = function (categorySlug) {
  return window.StudyWithDr.hasCourses(categorySlug) || window.StudyWithDr.hasTopics(categorySlug);
};

window.StudyWithDr.getExamBoards = function (categorySlug) {
  var cat = window.StudyWithDr.getCategoryBySlug(categorySlug);
  if (cat && cat.hasExamBoards) {
    return window.StudyWithDr.EXAM_BOARD_OPTIONS.slice();
  }
  return [];
};

window.StudyWithDr.slugify = function (text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

window.StudyWithDr.escapeHtml = function (text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

window.StudyWithDr.getSearchText = function (row) {
  var cat = window.StudyWithDr.getCategoryBySlug(row.category_slug);
  return [
    row.title,
    row.description,
    row.category_name,
    cat ? cat.subjectName : '',
    cat ? cat.levelName : '',
    row.exam_board_name,
    row.topic_name
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
  var meta = [];
  if (item.exam_board_name) meta.push(item.exam_board_name);
  if (item.topic_name) meta.push(item.topic_name);
  var tags = meta.length
    ? '<span class="pdf-board-tag">' + esc(meta.join(' · ')) + '</span>'
    : '';
  var searchText = esc(window.StudyWithDr.getSearchText(item));

  return (
    '<li data-search-text="' + searchText + '">' +
      '<a class="pdf-link" href="' + href + '" target="_blank" rel="noopener">' +
        esc(item.title) + tags +
      '</a>' +
      desc +
    '</li>'
  );
};

window.StudyWithDr.getTopicsForBoard = function (topics, categorySlug, examBoardSlug) {
  var normalized = window.StudyWithDr.normalizeCategorySlug(categorySlug);
  return (topics || []).filter(function (topic) {
    return window.StudyWithDr.normalizeCategorySlug(topic.category_slug) === normalized
      && topic.exam_board === examBoardSlug;
  }).sort(function (a, b) {
    return a.topic_name.localeCompare(b.topic_name);
  });
};

window.StudyWithDr.renderTopicGroups = function (boardItems, topicDefs, esc, getHref) {
  var topicMap = {};
  var order = [];

  topicDefs.forEach(function (topic) {
    topicMap[topic.topic_slug] = { name: topic.topic_name, items: [] };
    order.push(topic.topic_slug);
  });

  boardItems.forEach(function (item) {
    var key = item.topic_slug || '__general__';
    if (!topicMap[key]) {
      topicMap[key] = { name: item.topic_name || 'General resources', items: [] };
      if (order.indexOf(key) === -1) order.push(key);
    }
    topicMap[key].items.push(item);
  });

  return order.map(function (slug) {
    var group = topicMap[slug];
    if (!group.items.length && slug !== '__general__' && topicDefs.some(function (t) { return t.topic_slug === slug; })) {
      return (
        '<div class="pdf-topic-group">' +
          '<h4 class="pdf-topic-title">' + esc(group.name) + '</h4>' +
          '<p class="pdf-topic-empty">Resources coming soon.</p>' +
        '</div>'
      );
    }
    if (!group.items.length) return '';

    var itemsHtml = group.items.map(function (item) {
      return window.StudyWithDr.renderPdfItem(item, getHref(item));
    }).join('');

    return (
      '<div class="pdf-topic-group">' +
        '<h4 class="pdf-topic-title">' + esc(group.name) + '</h4>' +
        '<ul class="pdf-list">' + itemsHtml + '</ul>' +
      '</div>'
    );
  }).join('');
};

window.StudyWithDr.renderCategoryWithDirectFolders = function (sectionTitle, slug, cat, topics, folderTitle, esc) {
  var folderDefs = window.StudyWithDr.getTopicsForBoard(topics, slug, '');
  if (!cat.items.length && !folderDefs.length) return '';

  var groupHtml = window.StudyWithDr.renderTopicGroups(
    cat.items,
    folderDefs,
    esc,
    function (item) { return window.StudyWithDr.getPdfUrl(item.file_path); }
  );

  return (
    '<section class="pdf-level-section">' +
      '<h3 class="pdf-level-title">' + esc(sectionTitle) + '</h3>' +
      '<div class="pdf-board-group">' +
        '<h4 class="pdf-board-title">' + esc(folderTitle) + '</h4>' +
        groupHtml +
      '</div>' +
    '</section>'
  );
};

window.StudyWithDr.renderCategorySection = function (slug, cat, topics, esc) {
  var catDef = window.StudyWithDr.getCategoryBySlug(slug);
  var sectionTitle = catDef ? catDef.levelName : (cat.name || slug);
  var boards = window.StudyWithDr.getExamBoards(slug);
  var hasBoards = boards.length > 0;
  var hasCourses = window.StudyWithDr.hasCourses(slug);
  var hasTopics = window.StudyWithDr.hasTopics(slug);

  if (hasCourses) {
    return window.StudyWithDr.renderCategoryWithDirectFolders(sectionTitle, slug, cat, topics, 'Courses', esc);
  }

  if (hasTopics && !hasBoards) {
    return window.StudyWithDr.renderCategoryWithDirectFolders(sectionTitle, slug, cat, topics, 'Topics', esc);
  }

  if (!hasBoards) {
    if (!cat.items.length) return '';
    var flatItems = cat.items.map(function (item) {
      var href = item._local
        ? './files/' + item.category_slug + '/' + encodeURIComponent(item._file)
        : window.StudyWithDr.getPdfUrl(item.file_path);
      return window.StudyWithDr.renderPdfItem(item, href);
    }).join('');

    return (
      '<section class="pdf-level-section">' +
        '<h3 class="pdf-level-title">' + esc(sectionTitle) + '</h3>' +
        '<ul class="pdf-list">' + flatItems + '</ul>' +
      '</section>'
    );
  }

  var boardSections = boards.map(function (board) {
    var boardItems = cat.items.filter(function (item) {
      return item.exam_board === board.slug;
    });
    var boardTopics = window.StudyWithDr.getTopicsForBoard(topics, slug, board.slug);

    if (!boardItems.length && !boardTopics.length) return '';

    var topicHtml = window.StudyWithDr.renderTopicGroups(
      boardItems,
      boardTopics,
      esc,
      function (item) { return window.StudyWithDr.getPdfUrl(item.file_path); }
    );

    return (
      '<div class="pdf-board-group">' +
        '<h4 class="pdf-board-title">' + esc(board.name) + '</h4>' +
        topicHtml +
      '</div>'
    );
  }).join('');

  return boardSections
    ? '<section class="pdf-level-section"><h3 class="pdf-level-title">' + esc(sectionTitle) + '</h3>' + boardSections + '</section>'
    : '';
};

window.StudyWithDr.renderPdfList = function (container, rows, options) {
  options = options || {};
  var query = (options.query || '').trim().toLowerCase();
  var topics = options.topics || [];
  var subject = options.subject || '';
  var subjectDef = window.StudyWithDr.RESOURCE_SUBJECTS.find(function (item) {
    return item.slug === subject;
  });
  var filtered = rows;

  if (query) {
    filtered = rows.filter(function (row) {
      return window.StudyWithDr.getSearchText(row).indexOf(query) !== -1;
    });
  } else if (subjectDef) {
    filtered = rows.filter(function (row) {
      var cat = window.StudyWithDr.getCategoryBySlug(row.category_slug);
      return cat && cat.subject === subject;
    });
    topics = topics.filter(function (topic) {
      var cat = window.StudyWithDr.getCategoryBySlug(topic.category_slug);
      return cat && cat.subject === subject;
    });
  }

  if (!filtered.length && !topics.length) {
    var emptyMsg = query
      ? 'No resources matched your search. Try a different keyword.'
      : subjectDef
        ? 'No ' + subjectDef.name + ' resources yet. Check back soon.'
        : 'Revision PDFs will appear here soon. Check back after your next lesson.';
    container.innerHTML = '<p class="pdf-empty">' + emptyMsg + '</p>';
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
    var slug = window.StudyWithDr.normalizeCategorySlug(row.category_slug);
    if (!byCategory[slug]) {
      var catDef = window.StudyWithDr.getCategoryBySlug(slug);
      byCategory[slug] = { name: catDef ? catDef.name : row.category_name, items: [] };
    }
    byCategory[slug].items.push(row);
  });

  var esc = window.StudyWithDr.escapeHtml;
  var levelOrder = subjectDef
    ? subjectDef.levels.map(function (level) { return level.slug; })
    : window.StudyWithDr.CATEGORIES.map(function (cat) { return cat.slug; });

  var html = levelOrder
    .map(function (levelSlug) {
      var slug = subjectDef
        ? window.StudyWithDr.getCategorySlug(subject, levelSlug)
        : levelSlug;
      var cat = byCategory[slug] || { name: '', items: [] };
      var hasTopicRows = topics.some(function (topic) {
        return window.StudyWithDr.normalizeCategorySlug(topic.category_slug) === slug;
      });
      if (!cat.items.length && !hasTopicRows) return '';
      return window.StudyWithDr.renderCategorySection(slug, cat, topics, esc);
    })
    .filter(Boolean)
    .join('');

  container.innerHTML = html || '<p class="pdf-empty">Revision PDFs will appear here soon. Check back after your next lesson.</p>';
};
