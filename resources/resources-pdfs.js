(function () {
  var container = document.getElementById('pdf-resources');
  var searchInput = document.getElementById('resource-search');
  if (!container) return;

  var allRows = [];

  function getQueryFromUrl() {
    return new URLSearchParams(window.location.search).get('q') || '';
  }

  function setQueryInUrl(query) {
    var url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
  }

  function render(query) {
    window.StudyWithDr.renderPdfList(container, allRows, { query: query });
  }

  function loadFromJson() {
    return fetch('./pdfs.json')
      .then(function (res) { return res.json(); })
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
              file_path: cat.slug + '/' + item.file,
              _local: true,
              _file: item.file
            });
          });
        });
        return rows;
      });
  }

  function loadFromSupabase() {
    var client = window.StudyWithDr.getSupabase();
    if (!client) return Promise.resolve([]);

    return client
      .from('pdf_resources')
      .select('*')
      .order('category_name')
      .order('exam_board_name')
      .order('created_at', { ascending: false })
      .then(function (result) {
        if (result.error) throw result.error;
        return result.data || [];
      });
  }

  Promise.all([loadFromSupabase(), loadFromJson()])
    .then(function (results) {
      allRows = results[0].length ? results[0] : results[1];
      window.StudyWithDr._allPdfRows = allRows;

      var initialQuery = getQueryFromUrl();
      if (searchInput) {
        searchInput.value = initialQuery;
      }
      render(initialQuery);
    })
    .catch(function () {
      container.innerHTML = '<p class="pdf-empty">Unable to load resources right now. Please try again later.</p>';
    });

  if (searchInput) {
    var searchTimer;
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var query = searchInput.value.trim();
      searchTimer = setTimeout(function () {
        setQueryInUrl(query);
        render(query);
      }, 200);
    });
  }
})();
