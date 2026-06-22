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

  function updateExamBoardField() {
    var boards = window.StudyWithDr.getExamBoards(categorySelect.value);
    examBoardSelect.innerHTML = '';

    if (!boards.length) {
      examBoardWrap.hidden = true;
      examBoardSelect.required = false;
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
  }

  categorySelect.addEventListener('change', updateExamBoardField);
  updateExamBoardField();

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
    return name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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
          var boardLabel = row.exam_board_name ? ' · ' + row.exam_board_name : '';
          return (
            '<div class="admin-item">' +
              '<div class="admin-item-info">' +
                '<strong>' + row.title + '</strong>' +
                '<span>' + row.category_name + boardLabel + '</span>' +
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

    var categorySlug = categorySelect.value;
    var categoryName = categorySelect.options[categorySelect.selectedIndex].dataset.name;
    var boards = window.StudyWithDr.getExamBoards(categorySlug);
    var examBoardSlug = null;
    var examBoardName = null;

    if (boards.length) {
      examBoardSlug = examBoardSelect.value;
      examBoardName = examBoardSelect.options[examBoardSelect.selectedIndex].dataset.name;
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

    var filePath = categorySlug + '/';
    if (examBoardSlug) {
      filePath += examBoardSlug + '/';
    }
    filePath += Date.now() + '-' + sanitizeFileName(file.name);

    client.storage.from('pdf-resources').upload(filePath, file, { upsert: false })
      .then(function (uploadResult) {
        if (uploadResult.error) throw uploadResult.error;

        return client.from('pdf_resources').insert({
          category_slug: categorySlug,
          category_name: categoryName,
          exam_board: examBoardSlug,
          exam_board_name: examBoardName,
          title: title,
          description: description || null,
          file_path: filePath
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
