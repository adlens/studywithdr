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
              topic_slug: item.topic_slug || null,
              topic_name: item.topic_name || null,
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
    if (!client) return Promise.resolve({ rows: [], topics: [] });

    return Promise.all([
      client.from('pdf_resources').select('*').order('category_name').order('exam_board_name').order('topic_name').order('created_at', { ascending: false }),
      client.from('resource_topics').select('*').order('topic_name')
    ]).then(function (results) {
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      return {
        rows: results[0].data || [],
        topics: results[1].data || []
      };
    });
  }

  Promise.all([loadFromSupabase(), loadFromJson()])
    .then(function (results) {
      var supabaseData = results[0];
      var jsonRows = results[1];

      if (supabaseData.rows.length) {
        allRows = supabaseData.rows;
        allTopics = supabaseData.topics;
      } else {
        allRows = jsonRows;
        allTopics = [];
      }

      window.StudyWithDr._allPdfRows = allRows;
      window.StudyWithDr._allTopics = allTopics;

      currentSubject = getSubjectFromUrl();
      var initialQuery = getQueryFromUrl();

      updateSubjectTabs(currentSubject);
      if (searchInput) {
        searchInput.value = initialQuery;
      }
      render(initialQuery);
    })
    .catch(function () {
      container.innerHTML = '<p class="pdf-empty">Unable to load resources right now. Please try again later.</p>';
    });

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
