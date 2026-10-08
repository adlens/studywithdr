(function () {
  var section = document.querySelector('[data-exam-focus]');
  if (!section) return;

  var examDate = section.getAttribute('data-exam-date');
  // Exam dates are UK dates, so compare against today's date in London.
  var today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  if (today > examDate) {
    section.remove();
    return;
  }

  var countdown = section.querySelector('[data-exam-countdown]');
  if (!countdown) return;

  var days = Math.round((Date.parse(examDate) - Date.parse(today)) / 86400000);
  countdown.textContent = days === 0 ? 'Exam today' : days === 1 ? '1 day to go' : days + ' days to go';
  countdown.hidden = false;
})();
