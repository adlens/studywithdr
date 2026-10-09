(function () {
  var container = document.getElementById('pdf-resources');
  var searchInput = document.getElementById('resource-search');
  var subjectTabs = document.querySelectorAll('.subject-tab');
  if (!container) return;

  var allRows = [];
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
      topics: [],
      subject: searching ? '' : currentSubject
    });
  }

  function showUnavailable() {
    container.innerHTML = '<p class="pdf-empty">Unable to load resources right now. Please try again later.</p>';
  }

  currentSubject = getSubjectFromUrl();
  updateSubjectTabs(currentSubject);
  if (searchInput) {
    searchInput.value = getQueryFromUrl();
  }

  fetch('./catalog.json')
    .then(function (res) {
      if (!res.ok) throw new Error('catalog.json HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      allRows = (data.resources || [])
        .filter(window.StudyWithDr.isPublished)
        .map(window.StudyWithDr.mapCatalogItem);
      render(searchInput ? searchInput.value.trim() : '');
    })
    .catch(function (err) {
      // The prerendered list is still valid, so only replace it when it is missing.
      console.warn('[Study with Dr] Resource catalog unavailable:', err.message || err);
      if (!container.querySelector('.resource-item')) showUnavailable();
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
