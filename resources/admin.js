(function () {
  var loginPanel = document.getElementById('admin-login');
  var dashboard = document.getElementById('admin-dashboard');
  var setupPanel = document.getElementById('admin-setup');
  var loginForm = document.getElementById('login-form');
  var uploadForm = document.getElementById('upload-form');
  var logoutBtn = document.getElementById('logout-btn');
  var categorySelect = document.getElementById('upload-category');
  var examBoardWrap = document.getElementById('exam-board-wrap');
  var examBoardSelect = document.getElementById('upload-exam-board');
  var topicWrap = document.getElementById('topic-wrap');
  var topicSelect = document.getElementById('upload-topic');
  var topicNewWrap = document.getElementById('topic-new-wrap');
  var topicNewInput = document.getElementById('upload-topic-new');
  var createTopicName = document.getElementById('create-topic-name');
  var createTopicBtn = document.getElementById('create-topic-btn');
  var topicStatus = document.getElementById('topic-status');
  var adminList = document.getElementById('admin-list');
  var adminEmail = document.getElementById('admin-email');
  var loginError = document.getElementById('login-error');
  var uploadStatus = document.getElementById('upload-status');
  var uploadBtn = document.getElementById('upload-btn');

  var client = window.StudyWithDr.getSupabase();

  if (!client) {
    setupPanel.hidden = false;
    loginPanel.hidden = true;
    return;
  }

  window.StudyWithDr.CATEGORIES.forEach(function (cat) {
    var option = document.createElement('option');
    option.value = cat.slug;
    option.textContent = cat.name;
    option.dataset.name = cat.name;
    categorySelect.appendChild(option);
  });

  function showTopicStatus(message, isError) {
    topicStatus.textContent = message;
    topicStatus.className = isError ? 'admin-status admin-status-error' : 'admin-status admin-status-success';
    topicStatus.hidden = !message;
  }

  function getCategoryContext() {
    return {
      slug: categorySelect.value,
      name: categorySelect.options[categorySelect.selectedIndex].dataset.name
    };
  }

  function getExamBoardContext() {
    return {
      slug: examBoardSelect.value,
      name: examBoardSelect.options[examBoardSelect.selectedIndex].dataset.name
    };
  }

  function loadTopics() {
    var category = getCategoryContext();
    var board = getExamBoardContext();
    topicSelect.innerHTML = '';

    return client
      .from('resource_topics')
      .select('*')
      .eq('category_slug', category.slug)
      .eq('exam_board', board.slug)
      .order('topic_name')
      .then(function (result) {
        if (result.error) throw result.error;

        var topics = result.data || [];

        var none = document.createElement('option');
        none.value = '';
        none.textContent = 'No topic';
        none.selected = true;
        topicSelect.appendChild(none);

        topics.forEach(function (topic) {
            var option = document.createElement('option');
            option.value = topic.topic_slug;
            option.textContent = topic.topic_name;
            option.dataset.name = topic.topic_name;
            topicSelect.appendChild(option);
          });

        var createNew = document.createElement('option');
        createNew.value = '__new__';
        createNew.textContent = '+ Add new topic with this upload';
        topicSelect.appendChild(createNew);
      });
  }

  function updateExamBoardField() {
    var boards = window.StudyWithDr.getExamBoards(categorySelect.value);
    examBoardSelect.innerHTML = '';

    if (!boards.length) {
      examBoardWrap.hidden = true;
      topicWrap.hidden = true;
      examBoardSelect.required = false;
      topicSelect.required = false;
      return;
    }

    examBoardWrap.hidden = false;
    examBoardSelect.required = true;

    boards.forEach(function (board) {
      var option = document.createElement('option');
      option.value = board.slug;
      option.textContent = board.name;
      option.dataset.name = board.name;
      examBoardSelect.appendChild(option);
    });

    updateTopicField();
  }

  function updateTopicField() {
    var boards = window.StudyWithDr.getExamBoards(categorySelect.value);
    if (!boards.length) {
      topicWrap.hidden = true;
      topicSelect.required = false;
      return;
    }

    topicWrap.hidden = false;
    topicSelect.required = false;
    topicNewWrap.hidden = true;
    topicNewInput.required = false;
    showTopicStatus('', false);

    loadTopics().catch(function () {
      showTopicStatus('Could not load topics.', true);
    });
  }

  categorySelect.addEventListener('change', updateExamBoardField);
  examBoardSelect.addEventListener('change', updateTopicField);
  topicSelect.addEventListener('change', function () {
    var isNew = topicSelect.value === '__new__';
    topicNewWrap.hidden = !isNew;
    topicNewInput.required = isNew;
  });

  updateExamBoardField();

  function createTopic(topicName) {
    var category = getCategoryContext();
    var board = getExamBoardContext();
    var topicSlug = window.StudyWithDr.slugify(topicName);

    if (!topicSlug) {
      return Promise.reject(new Error('Please enter a valid topic name.'));
    }

    return client.from('resource_topics').insert({
      category_slug: category.slug,
      category_name: category.name,
      exam_board: board.slug,
      exam_board_name: board.name,
      topic_slug: topicSlug,
      topic_name: topicName.trim()
    }).then(function (result) {
      if (result.error) throw result.error;
      return { slug: topicSlug, name: topicName.trim() };
    });
  }

  createTopicBtn.addEventListener('click', function () {
    var name = createTopicName.value.trim();
    if (!name) {
      showTopicStatus('Enter a topic name first.', true);
      return;
    }

    createTopicBtn.disabled = true;
    createTopic(name)
      .then(function (topic) {
        createTopicName.value = '';
        showTopicStatus('Topic "' + topic.name + '" created.');
        return loadTopics().then(function () {
          topicSelect.value = topic.slug;
        });
      })
      .catch(function (err) {
        showTopicStatus(err.message || 'Could not create topic.', true);
      })
      .finally(function () {
        createTopicBtn.disabled = false;
      });
  });

  function showError(el, message) {
    el.textContent = message;
    el.hidden = !message;
  }

  function showDashboard(user) {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    adminEmail.textContent = user.email;
    loadAdminList();
  }

  function showLogin() {
    loginPanel.hidden = false;
    dashboard.hidden = true;
  }

  function sanitizeFileName(name) {
    return window.StudyWithDr.slugify(name.replace(/\.pdf$/i, '')) + '.pdf';
  }

  function resolveTopic() {
    if (!topicSelect.value) {
      return Promise.resolve({ slug: null, name: null });
    }

    if (topicSelect.value === '__new__') {
      var newName = topicNewInput.value.trim();
      if (!newName) {
        return Promise.reject(new Error('Please enter a name for the new topic.'));
      }
      return createTopic(newName);
    }

    return Promise.resolve({
      slug: topicSelect.value,
      name: topicSelect.options[topicSelect.selectedIndex].dataset.name
    });
  }

  function loadAdminList() {
    adminList.innerHTML = '<p class="pdf-empty">Loading…</p>';

    client
      .from('pdf_resources')
      .select('*')
      .order('created_at', { ascending: false })
      .then(function (result) {
        if (result.error) throw result.error;

        var rows = result.data || [];
        if (!rows.length) {
          adminList.innerHTML = '<p class="pdf-empty">No PDFs uploaded yet.</p>';
          return;
        }

        adminList.innerHTML = rows.map(function (row) {
          var path = [row.category_name, row.exam_board_name, row.topic_name].filter(Boolean).join(' · ');
          return (
            '<div class="admin-item">' +
              '<div class="admin-item-info">' +
                '<strong>' + row.title + '</strong>' +
                '<span>' + path + '</span>' +
                (row.description ? '<span class="admin-item-desc">' + row.description + '</span>' : '') +
              '</div>' +
              '<button type="button" class="btn btn-secondary admin-delete" data-id="' + row.id + '" data-path="' + row.file_path + '">Delete</button>' +
            '</div>'
          );
        }).join('');

        adminList.querySelectorAll('.admin-delete').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-id');
            var path = btn.getAttribute('data-path');
            if (!confirm('Delete this PDF? This cannot be undone.')) return;

            btn.disabled = true;
            client.storage.from('pdf-resources').remove([path])
              .then(function () {
                return client.from('pdf_resources').delete().eq('id', id);
              })
              .then(function (result) {
                if (result.error) throw result.error;
                loadAdminList();
              })
              .catch(function (err) {
                alert(err.message || 'Could not delete file.');
                btn.disabled = false;
              });
          });
        });
      })
      .catch(function () {
        adminList.innerHTML = '<p class="pdf-empty">Could not load resources.</p>';
      });
  }

  client.auth.getSession().then(function (result) {
    if (result.data.session) {
      showDashboard(result.data.session.user);
    }
  });

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    showError(loginError, '');

    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;

    client.auth.signInWithPassword({ email: email, password: password })
      .then(function (result) {
        if (result.error) throw result.error;
        showDashboard(result.data.user);
        loginForm.reset();
      })
      .catch(function (err) {
        showError(loginError, err.message || 'Sign in failed.');
      });
  });

  logoutBtn.addEventListener('click', function () {
    client.auth.signOut().then(function () {
      showLogin();
    });
  });

  uploadForm.addEventListener('submit', function (event) {
    event.preventDefault();
    showError(uploadStatus, '');
    uploadStatus.hidden = true;
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading…';

    var category = getCategoryContext();
    var boards = window.StudyWithDr.getExamBoards(category.slug);
    var examBoardSlug = null;
    var examBoardName = null;

    if (boards.length) {
      var board = getExamBoardContext();
      examBoardSlug = board.slug;
      examBoardName = board.name;
    }

    var title = document.getElementById('upload-title').value.trim();
    var description = document.getElementById('upload-description').value.trim();
    var fileInput = document.getElementById('upload-file');
    var file = fileInput.files[0];

    if (!file || (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name))) {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload';
      showError(uploadStatus, 'Please choose a PDF file.');
      uploadStatus.hidden = false;
      return;
    }

    resolveTopic()
      .then(function (topic) {
        var topicSlug = null;
        var topicName = null;
        if (boards.length && topic && topic.slug) {
          topicSlug = topic.slug;
          topicName = topic.name;
        }
        return { topicSlug: topicSlug, topicName: topicName };
      })
      .then(function (topicInfo) {
        var filePath = category.slug + '/';
        if (examBoardSlug) filePath += examBoardSlug + '/';
        if (topicInfo.topicSlug) filePath += topicInfo.topicSlug + '/';
        filePath += Date.now() + '-' + sanitizeFileName(file.name);

        return client.storage.from('pdf-resources').upload(filePath, file, { upsert: false })
          .then(function (uploadResult) {
            if (uploadResult.error) throw uploadResult.error;

            return client.from('pdf_resources').insert({
              category_slug: category.slug,
              category_name: category.name,
              exam_board: examBoardSlug,
              exam_board_name: examBoardName,
              topic_slug: topicInfo.topicSlug,
              topic_name: topicInfo.topicName,
              title: title,
              description: description || null,
              file_path: filePath
            });
          });
      })
      .then(function (insertResult) {
        if (insertResult.error) throw insertResult.error;

        uploadForm.reset();
        updateExamBoardField();
        uploadStatus.textContent = 'Uploaded successfully.';
        uploadStatus.className = 'admin-status admin-status-success';
        uploadStatus.hidden = false;
        loadAdminList();
      })
      .catch(function (err) {
        uploadStatus.textContent = err.message || 'Upload failed.';
        uploadStatus.className = 'admin-status admin-status-error';
        uploadStatus.hidden = false;
      })
      .finally(function () {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
      });
  });
})();
