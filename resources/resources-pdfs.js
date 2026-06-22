(function () {
  var container = document.getElementById('pdf-resources');
  if (!container) return;

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
      .order('created_at', { ascending: false })
      .then(function (result) {
        if (result.error) throw result.error;
        return result.data || [];
      });
  }

  function renderMerged(supabaseRows, jsonRows) {
    if (supabaseRows.length) {
      window.StudyWithDr.renderPdfList(container, supabaseRows);
      return;
    }

    if (jsonRows.length) {
      var grouped = {};
      jsonRows.forEach(function (row) {
        if (!grouped[row.category_slug]) {
          grouped[row.category_slug] = { name: row.category_name, items: [] };
        }
        grouped[row.category_slug].items.push(row);
      });

      var order = window.StudyWithDr.CATEGORIES.map(function (c) { return c.slug; });
      container.innerHTML = order
        .filter(function (slug) { return grouped[slug]; })
        .map(function (slug) {
          var cat = grouped[slug];
          var items = cat.items.map(function (item) {
            var href = './files/' + item.category_slug + '/' + encodeURIComponent(item._file);
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

      if (!container.innerHTML) {
        container.innerHTML = '<p class="pdf-empty">Revision PDFs will appear here soon. Check back after your next lesson.</p>';
      }
      return;
    }

    container.innerHTML = '<p class="pdf-empty">Revision PDFs will appear here soon. Check back after your next lesson.</p>';
  }

  Promise.all([loadFromSupabase(), loadFromJson()])
    .then(function (results) {
      renderMerged(results[0], results[1]);
    })
    .catch(function () {
      container.innerHTML = '<p class="pdf-empty">Unable to load resources right now. Please try again later.</p>';
    });
})();
