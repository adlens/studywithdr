(function () {
  var container = document.getElementById('pdf-resources');
  var searchInput = document.getElementById('resource-search');
  var subjectTabs = document.querySelectorAll('.subject-tab');
  if (!container) return;

  var allRows = [];
  var allTopics = [];
  var currentSubject = 'maths';

  function getQueryFromUrl() {
    return new URLSearchParams(window.location.search).get('q') || '';
  }

  function getSubjectFromUrl() {
    var subject = new URLSearchParams(window.location.search).get('subject') || 'maths';
    return window.StudyWithDr.RESOURCE_SUBJECTS.some(function (item) { return item.slug === subject; })
      ? subject
      : 'maths';
  }

  function setUrlState(query, subject) {
    var url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    url.searchParams.delete('level');
    if (!query) {
      url.searchParams.set('subject', subject);
    }
    window.history.replaceState({}, '', url);
  }

  function updateSubjectTabs(subject) {
    subjectTabs.forEach(function (tab) {
      var isActive = tab.getAttribute('data-subject') === subject;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function render(query) {
    var searching = !!query;
    subjectTabs.forEach(function (tab) {
      tab.disabled = searching;
      tab.style.opacity = searching ? '0.45' : '';
    });

    window.StudyWithDr.renderPdfList(container, allRows, {
      query: query,
      topics: allTopics,
      subject: searching ? '' : currentSubject
    });
  }

  function loadFromJson() {
    return fetch('./pdfs.json')
      .then(function (res) {
        if (!res.ok) throw new Error('pdfs.json HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var rows = [];
        (data.categories || []).forEach(function (cat) {
          (cat.items || []).forEach(function (item) {
            rows.push({
              category_slug: cat.slug,
              category_name: cat.name,
              title: item.title,
              description: item.description || '',
              exam_board: item.exam_board || null,
              exam_board_name: item.exam_board_name || null,
              topic_slug: item.topic_slug || null,
              topic_name: item.topic_name || null,
              file_path: cat.slug + '/' + item.file,
              _local: true,
              _file: item.file
            });
          });
        });
        return { rows: rows, failed: false };
      })
      .catch(function (err) {
        console.warn('[Study with Dr] Local pdfs.json fallback unavailable:', err.message || err);
        return { rows: [], failed: true };
      });
  }

  function loadCatalog() {
    return fetch('./catalog.json')
      .then(function (res) {
        if (!res.ok) throw new Error('catalog.json HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        return (data.resources || []).map(window.StudyWithDr.mapCatalogItem);
      })
      .catch(function (err) {
        console.warn('[Study with Dr] Resource catalog unavailable:', err.message || err);
        return [];
      });
  }

  var catalogRows = [];

  function applyRows(rows, topics) {
    allRows = catalogRows.concat(rows);
    allTopics = topics;
    window.StudyWithDr._allPdfRows = allRows;
    window.StudyWithDr._allTopics = allTopics;
    render(searchInput ? searchInput.value.trim() : '');
  }

  function showUnavailable() {
    container.innerHTML = '<p class="pdf-empty">Unable to load resources right now. Please try again later.</p>';
  }

  function showLoadError(err) {
    console.error('[Study with Dr] Resource list failed:', err);
    showUnavailable();
  }

  currentSubject = getSubjectFromUrl();
  updateSubjectTabs(currentSubject);
  if (searchInput) {
    searchInput.value = getQueryFromUrl();
  }

  Promise.all([loadFromJson(), loadCatalog()])
    .then(function (results) {
      var jsonData = results[0];
      catalogRows = results[1];
      if (!catalogRows.length && jsonData.failed) {
        showUnavailable();
        return;
      }
      applyRows(jsonData.rows, []);
    })
    .catch(showLoadError);

  subjectTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (searchInput && searchInput.value.trim()) {
        searchInput.value = '';
      }
      currentSubject = tab.getAttribute('data-subject');
      updateSubjectTabs(currentSubject);
      setUrlState('', currentSubject);
      render('');
    });
  });

  if (searchInput) {
    var searchTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var query = searchInput.value.trim();
      searchTimer = setTimeout(function () {
        setUrlState(query, currentSubject);
        render(query);
      }, 200);
    });
  }
})();
