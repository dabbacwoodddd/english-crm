

const KEYS = {
  students:   'ok_students',
  grades:     'ok_grades',
  attendance: 'ok_attendance',
  activities: 'ok_activities',
};


function load(key)        { return JSON.parse(localStorage.getItem(key) || '[]'); }
function save(key, data)  { localStorage.setItem(key, JSON.stringify(data)); }

// Генерация уникального id
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }


function seedDemoData() {
  if (localStorage.getItem('ok_seeded')) return;

  const students = [
    { id: uid(), name: 'Айбек Дуйшеев',    age: 11, group: 'Python A',      createdAt: '2025-01-15' },
    { id: uid(), name: 'Малика Сарыбаева', age: 10, group: 'Scratch Junior', createdAt: '2025-01-20' },
    { id: uid(), name: 'Темир Асанов',     age: 12, group: 'Web B',          createdAt: '2025-02-03' },
    { id: uid(), name: 'Нурия Исакова',    age: 11, group: 'Python A',       createdAt: '2025-02-10' },
    { id: uid(), name: 'Бекзод Кадыров',   age: 13, group: 'JavaScript',     createdAt: '2025-02-18' },
  ];
  save(KEYS.students, students);

  const subjects = ['Python', 'Scratch', 'Web (HTML/CSS)', 'JavaScript', 'Алгоритмы'];
  const grades = [];
  students.forEach(s => {
    subjects.slice(0, 3).forEach(subj => {
      grades.push({
        id:        uid(),
        studentId: s.id,
        subject:   subj,
        score:     Math.floor(Math.random() * 30) + 70,
        date:      `2025-0${Math.floor(Math.random()*3)+2}-${String(Math.floor(Math.random()*20)+1).padStart(2,'0')}`,
      });
    });
  });
  save(KEYS.grades, grades);

  const attendance = [];
  const today = new Date();
  students.forEach(s => {
    for (let d = 5; d >= 1; d--) {
      const dt = new Date(today); dt.setDate(dt.getDate() - d);
      attendance.push({
        id:        uid(),
        studentId: s.id,
        date:      dt.toISOString().slice(0,10),
        status:    Math.random() > 0.2 ? 'present' : 'absent',
      });
    }
  });
  save(KEYS.attendance, attendance);

  const activities = [
    { type:'blue',   text:'Айбек Дуйшеев добавлен в систему',        time: fmtTime(new Date()) },
    { type:'green',  text:'Малика Сарыбаева: оценка 95 по Python',    time: fmtTime(new Date(Date.now()-3600000)) },
    { type:'orange', text:'Темир Асанов отсутствовал на занятии',     time: fmtTime(new Date(Date.now()-7200000)) },
    { type:'purple', text:'Новая группа JavaScript открыта',           time: fmtTime(new Date(Date.now()-86400000)) },
  ];
  save(KEYS.activities, activities);

  localStorage.setItem('ok_seeded', '1');
}



const pageTitles = {
  dashboard:  'Дашборд',
  students:   'Ученики',
  grades:     'Оценки',
  attendance: 'Посещаемость',
};

function navigate(page) {

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[page];

  
  if (page === 'dashboard')  renderDashboard();
  if (page === 'students')   { populateGroupFilter(); renderStudents(); }
  if (page === 'grades')     { populateGradeFilters(); renderGrades(); }
  if (page === 'attendance') { populateAttendanceFilter(); renderAttendance(); }

  closeSidebar();
}


function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}


function renderDashboard() {
  const students   = load(KEYS.students);
  const grades     = load(KEYS.grades);
  const attendance = load(KEYS.attendance);

  
  document.getElementById('stat-students').textContent = students.length;

  
  const groups = new Set(students.map(s => s.group));
  document.getElementById('stat-groups').textContent = groups.size;


  if (grades.length) {
    const avg = grades.reduce((s, g) => s + g.score, 0) / grades.length;
    document.getElementById('stat-avg').textContent = avg.toFixed(1);
  } else {
    document.getElementById('stat-avg').textContent = '—';
  }

  
  if (attendance.length) {
    const present = attendance.filter(a => a.status === 'present').length;
    document.getElementById('stat-attend').textContent =
      Math.round(present / attendance.length * 100) + '%';
  } else {
    document.getElementById('stat-attend').textContent = '—';
  }

  
  const activities = load(KEYS.activities);
  const list = document.getElementById('activityList');
  if (!activities.length) {
    list.innerHTML = '<div class="empty-state">Нет активностей</div>';
    return;
  }
  list.innerHTML = activities.slice(-8).reverse().map(a => `
    <div class="activity-item">
      <div class="activity-dot dot-${a.type}"></div>
      <span class="activity-text">${a.text}</span>
      <span class="activity-time">${a.time}</span>
    </div>
  `).join('');
}



function populateGroupFilter() {
  const students = load(KEYS.students);
  const groups   = [...new Set(students.map(s => s.group))].sort();
  const sel = document.getElementById('groupFilter');
  sel.innerHTML = '<option value="">Все группы</option>' +
    groups.map(g => `<option value="${g}">${g}</option>`).join('');
}

function renderStudents() {
  const query  = (document.getElementById('studentSearch').value || '').toLowerCase();
  const group  = document.getElementById('groupFilter').value;
  const grades = load(KEYS.grades);

  let students = load(KEYS.students);

  if (query) students = students.filter(s => s.name.toLowerCase().includes(query));
  if (group) students = students.filter(s => s.group === group);

  const tbody = document.getElementById('studentsBody');
  const empty = document.getElementById('studentsEmpty');

  if (!students.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = students.map((s, i) => {
    const sg  = grades.filter(g => g.studentId === s.id);
    const avg = sg.length ? (sg.reduce((a,g) => a+g.score, 0) / sg.length).toFixed(1) : '—';
    const badge = avg !== '—' ? scoreBadge(parseFloat(avg)) : '<span style="color:var(--text3)">—</span>';
    return `
      <tr>
        <td style="color:var(--text3);font-family:var(--mono)">${i+1}</td>
        <td><strong>${esc(s.name)}</strong></td>
        <td>${s.age} лет</td>
        <td><span class="group-chip">${esc(s.group)}</span></td>
        <td>${badge}</td>
        <td>
          <button class="action-btn" onclick="openEditStudent('${s.id}')">✏ Изменить</button>
          <button class="action-btn danger" onclick="deleteStudent('${s.id}')">✕ Удалить</button>
        </td>
      </tr>
    `;
  }).join('');
}

function saveStudent() {
  const name  = document.getElementById('sName').value.trim();
  const age   = parseInt(document.getElementById('sAge').value);
  const group = document.getElementById('sGroup').value.trim();

  if (!name || !age || !group) { showToast('Заполните все поля'); return; }

  const students = load(KEYS.students);
  const student  = { id: uid(), name, age, group, createdAt: todayStr() };
  students.push(student);
  save(KEYS.students, students);

  addActivity('blue', `${name} добавлен(а) как ученик`);
  closeModal();
  clearModal(['sName','sAge','sGroup']);
  renderStudents();
  populateGroupFilter();
  showToast(`✓ ${name} добавлен(а)`);
}

function openEditStudent(id) {
  const s = load(KEYS.students).find(x => x.id === id);
  if (!s) return;
  document.getElementById('esId').value   = s.id;
  document.getElementById('esName').value = s.name;
  document.getElementById('esAge').value  = s.age;
  document.getElementById('esGroup').value= s.group;
  openModal('editStudent');
}

function updateStudent() {
  const id    = document.getElementById('esId').value;
  const name  = document.getElementById('esName').value.trim();
  const age   = parseInt(document.getElementById('esAge').value);
  const group = document.getElementById('esGroup').value.trim();

  if (!name || !age || !group) { showToast('Заполните все поля'); return; }

  const students = load(KEYS.students);
  const idx = students.findIndex(s => s.id === id);
  if (idx === -1) return;
  students[idx] = { ...students[idx], name, age, group };
  save(KEYS.students, students);

  addActivity('purple', `Данные ученика ${name} обновлены`);
  closeModal();
  renderStudents();
  populateGroupFilter();
  showToast(`✓ Данные обновлены`);
}

function deleteStudent(id) {
  const students = load(KEYS.students);
  const s = students.find(x => x.id === id);
  if (!s) return;
  if (!confirm(`Удалить ученика "${s.name}"? Все оценки и посещаемость тоже будут удалены.`)) return;

  save(KEYS.students,   students.filter(x => x.id !== id));
  save(KEYS.grades,     load(KEYS.grades).filter(g => g.studentId !== id));
  save(KEYS.attendance, load(KEYS.attendance).filter(a => a.studentId !== id));

  addActivity('orange', `Ученик ${s.name} удалён из системы`);
  renderStudents();
  populateGroupFilter();
  showToast(`✗ ${s.name} удалён(а)`);
}


function populateGradeFilters() {
  const students = load(KEYS.students);
  const grades   = load(KEYS.grades);

  const sSel = document.getElementById('gradeStudentFilter');
  sSel.innerHTML = '<option value="">Все ученики</option>' +
    students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');

  const subjects = [...new Set(grades.map(g => g.subject))].sort();
  const subSel = document.getElementById('gradeSubjectFilter');
  subSel.innerHTML = '<option value="">Все предметы</option>' +
    subjects.map(s => `<option value="${s}">${s}</option>`).join('');

  const gSel = document.getElementById('gStudent');
  gSel.innerHTML = '<option value="">Выберите ученика</option>' +
    students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
}

function renderGrades() {
  const studentId = document.getElementById('gradeStudentFilter').value;
  const subject   = document.getElementById('gradeSubjectFilter').value;
  const students  = load(KEYS.students);

  let grades = load(KEYS.grades);
  if (studentId) grades = grades.filter(g => g.studentId === studentId);
  if (subject)   grades = grades.filter(g => g.subject === subject);

  
  grades.sort((a, b) => b.date.localeCompare(a.date));

  const tbody = document.getElementById('gradesBody');
  const empty = document.getElementById('gradesEmpty');

  if (!grades.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = grades.map(g => {
    const s = students.find(x => x.id === g.studentId);
    return `
      <tr>
        <td><strong>${s ? esc(s.name) : '—'}</strong></td>
        <td>${esc(g.subject)}</td>
        <td>${scoreBadge(g.score)}</td>
        <td style="font-family:var(--mono);font-size:13px;color:var(--text2)">${g.date}</td>
        <td>
          <button class="action-btn danger" onclick="deleteGrade('${g.id}')">✕ Удалить</button>
        </td>
      </tr>
    `;
  }).join('');
}

function saveGrade() {
  const studentId = document.getElementById('gStudent').value;
  const subject   = document.getElementById('gSubject').value;
  const score     = parseInt(document.getElementById('gScore').value);
  const date      = document.getElementById('gDate').value;

  if (!studentId || !subject || !score || !date) { showToast('Заполните все поля'); return; }
  if (score < 1 || score > 100) { showToast('Балл должен быть от 1 до 100'); return; }

  const students = load(KEYS.students);
  const student  = students.find(s => s.id === studentId);

  const grades = load(KEYS.grades);
  grades.push({ id: uid(), studentId, subject, score, date });
  save(KEYS.grades, grades);

  addActivity('green', `${student?.name}: оценка ${score} по "${subject}"`);
  closeModal();
  clearModal(['gScore','gDate']);
  populateGradeFilters();
  renderGrades();
  showToast(`✓ Оценка ${score} сохранена`);
}

function deleteGrade(id) {
  if (!confirm('Удалить эту оценку?')) return;
  save(KEYS.grades, load(KEYS.grades).filter(g => g.id !== id));
  renderGrades();
  populateGradeFilters();
  showToast('✗ Оценка удалена');
}



function populateAttendanceFilter() {
  const students = load(KEYS.students);

  const sel = document.getElementById('attendStudentFilter');
  sel.innerHTML = '<option value="">Все ученики</option>' +
    students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');

  const aSel = document.getElementById('aStudent');
  aSel.innerHTML = '<option value="">Выберите ученика</option>' +
    students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
}

function renderAttendance() {
  const studentId = document.getElementById('attendStudentFilter').value;
  const dateFilter= document.getElementById('attendDateFilter').value;
  const students  = load(KEYS.students);

  let records = load(KEYS.attendance);
  if (studentId)  records = records.filter(r => r.studentId === studentId);
  if (dateFilter) records = records.filter(r => r.date === dateFilter);

  records.sort((a, b) => b.date.localeCompare(a.date));

  const tbody = document.getElementById('attendanceBody');
  const empty = document.getElementById('attendanceEmpty');

  if (!records.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = records.map(r => {
    const s = students.find(x => x.id === r.studentId);
    const badge = r.status === 'present'
      ? '<span class="status-badge status-present">✓ Присутствовал</span>'
      : '<span class="status-badge status-absent">✗ Отсутствовал</span>';
    return `
      <tr>
        <td><strong>${s ? esc(s.name) : '—'}</strong></td>
        <td style="font-family:var(--mono);font-size:13px;color:var(--text2)">${r.date}</td>
        <td>${badge}</td>
        <td>
          <button class="action-btn danger" onclick="deleteAttendance('${r.id}')">✕ Удалить</button>
        </td>
      </tr>
    `;
  }).join('');
}

function saveAttendance() {
  const studentId = document.getElementById('aStudent').value;
  const date      = document.getElementById('aDate').value;
  const status    = document.querySelector('input[name="aStatus"]:checked')?.value;

  if (!studentId || !date || !status) { showToast('Заполните все поля'); return; }

  const students = load(KEYS.students);
  const student  = students.find(s => s.id === studentId);

  const records = load(KEYS.attendance);
  const dup = records.find(r => r.studentId === studentId && r.date === date);
  if (dup) { showToast('Запись на эту дату уже существует'); return; }

  records.push({ id: uid(), studentId, date, status });
  save(KEYS.attendance, records);

  const statusText = status === 'present' ? 'присутствовал(а)' : 'отсутствовал(а)';
  addActivity('orange', `${student?.name} ${statusText} ${date}`);
  closeModal();
  populateAttendanceFilter();
  renderAttendance();
  showToast(`✓ Посещаемость отмечена`);
}

function deleteAttendance(id) {
  if (!confirm('Удалить запись?')) return;
  save(KEYS.attendance, load(KEYS.attendance).filter(r => r.id !== id));
  renderAttendance();
  showToast('✗ Запись удалена');
}


let currentModal = null;

function openModal(name) {

  const today = todayStr();
  if (document.getElementById('gDate')) document.getElementById('gDate').value = today;
  if (document.getElementById('aDate')) document.getElementById('aDate').value = today;


  const students = load(KEYS.students);
  const gSel = document.getElementById('gStudent');
  if (gSel && name === 'addGrade') {
    gSel.innerHTML = '<option value="">Выберите ученика</option>' +
      students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }
  const aSel = document.getElementById('aStudent');
  if (aSel && name === 'addAttendance') {
    aSel.innerHTML = '<option value="">Выберите ученика</option>' +
      students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }

  document.getElementById('modalBackdrop').classList.add('open');
  const modal = document.getElementById('modal-' + name);
  if (modal) { modal.classList.add('open'); currentModal = name; }
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
  currentModal = null;
}

// Закрытие по Esc
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });



function scoreBadge(score) {
  const cls = score >= 85 ? 'score-high' : score >= 65 ? 'score-mid' : 'score-low';
  return `<span class="score-badge ${cls}">${score}</span>`;
}

function addActivity(type, text) {
  const activities = load(KEYS.activities);
  activities.push({ type, text, time: fmtTime(new Date()) });
  // Хранить последние 20
  if (activities.length > 20) activities.splice(0, activities.length - 20);
  save(KEYS.activities, activities);
}

function fmtTime(date) {
  return date.toLocaleTimeString('ru-RU', { hour:'2-digit', minute:'2-digit' });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function clearModal(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}


let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}


function updateTopbarDate() {
  const now = new Date();
  document.getElementById('topbarDate').textContent =
    now.toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  seedDemoData();        
  updateTopbarDate();    
  navigate('dashboard');  
});