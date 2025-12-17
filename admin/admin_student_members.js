// admin_student_members.js
// クラスメンバー一覧（編集・除外・追加・完全削除）

document.addEventListener("DOMContentLoaded", () => {
  const classSelect   = document.getElementById("classSelect");
  const memberList    = document.getElementById("memberList");
  const addMemberBtn  = document.getElementById("addMemberBtn");
  const hardDeleteAllBtn = document.getElementById("hardDeleteAllBtn");
  const titleElement  = document.getElementById("classMemberTitle");

  if (!classSelect || !memberList || !addMemberBtn) {
    console.error("必要な要素が見つかりません（idを確認）");
    return;
  }

  // ===== データ読み書き =====
  function loadData() {
    return {
      students: JSON.parse(localStorage.getItem("students") || "[]"),
      classes:  JSON.parse(localStorage.getItem("classes")  || "[]"),
    };
  }
  function saveData(students, classes) {
    localStorage.setItem("students", JSON.stringify(students));
    localStorage.setItem("classes",  JSON.stringify(classes));
  }

  // ===== クラス選択肢の初期化 =====
  function initClassOptions() {
    const { classes } = loadData();
    classSelect.innerHTML = "";

    if (!Array.isArray(classes) || classes.length === 0) {
      const op = document.createElement("option");
      op.value = "";
      op.textContent = "クラスがありません";
      classSelect.appendChild(op);
      classSelect.disabled = true;
      addMemberBtn.disabled = true;
      if (hardDeleteAllBtn) hardDeleteAllBtn.disabled = true;
      return;
    }

    classSelect.disabled = false;
    addMemberBtn.disabled = false;
    if (hardDeleteAllBtn) hardDeleteAllBtn.disabled = false;

    classes.forEach(cls => {
      const op = document.createElement("option");
      op.value = cls.id;
      op.textContent = `${cls.id}：${cls.name}`;
      classSelect.appendChild(op);
    });

    const selected = sessionStorage.getItem("selectedClassId");
    if (selected && classes.some(c => c.id === selected)) {
      classSelect.value = selected;
    }

    if (!classSelect.value && classSelect.options.length > 0) {
      classSelect.selectedIndex = 0;
    }
  }

  // ===== メンバー一覧の描画 =====
  function renderMembers() {
    const { students, classes } = loadData();
    const classId = classSelect.value;
    memberList.innerHTML = "";

    if (!classId) {
      if (titleElement) titleElement.textContent = "";
      return;
    }

    const cls = classes.find(c => c.id === classId);
    if (!cls) {
      if (titleElement) titleElement.textContent = "";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="8">クラスが見つかりません。</td>`;
      memberList.appendChild(tr);
      return;
    }

    if (!Array.isArray(cls.members)) cls.members = [];

    if (titleElement) {
      titleElement.textContent = `${cls.id}：${cls.name} のメンバー`;
    }

    // このクラスに所属している学生だけ
    const members = students
      .filter(s => cls.members.includes(s.id))
      .sort((a, b) => {
        const na = parseInt(a.id, 10);
        const nb = parseInt(b.id, 10);
        if (isNaN(na) && isNaN(nb)) return 0;
        if (isNaN(na)) return 1;
        if (isNaN(nb)) return -1;
        return na - nb;
      });

    if (members.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="8">このクラスにはまだ学生が登録されていません。</td>`;
      memberList.appendChild(tr);
      return;
    }

    members.forEach(st => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(st.id)}</td>
        <td>${escapeHtml(st.name)}</td>
        <td>${escapeHtml(st.kana || "")}</td>
        <td>${escapeHtml(st.gender || "")}</td>
        <td>${escapeHtml(st.email || "")}</td>
        <td>
          <button type="button" class="btn btn-edit js-edit" data-id="${st.id}">編集</button>
        </td>
        <td>
          <button type="button" class="btn btn-del js-remove" data-id="${st.id}">クラスから除外</button>
        </td>
        <td>
          <button type="button" class="btn btn-del js-hard-delete" data-id="${st.id}">完全削除</button>
        </td>
      `;
      memberList.appendChild(tr);
    });
  }

  // XSS軽減（表示用）
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===== 学生情報の編集 =====
  function editStudent(studentId) {
    const { students, classes } = loadData();
    const stu = students.find(s => s.id === studentId);
    if (!stu) {
      alert("学生が見つかりません。");
      return;
    }

    const name = prompt("氏名を編集してください", stu.name);
    if (name === null) return;

    const kana = prompt("フリガナを編集してください", stu.kana || "");
    if (kana === null) return;

    const gender = prompt("性別（例：男 / 女）", stu.gender || "");
    if (gender === null) return;

    const email = prompt("メールアドレスを編集してください", stu.email || "");
    if (email === null) return;

    stu.name   = name.trim();
    stu.kana   = kana.trim();
    stu.gender = gender.trim();
    stu.email  = email.trim();

    saveData(students, classes);
    alert("学生情報を更新しました。");
    renderMembers();
  }

  // ===== 完全削除（システムから消す） =====
  function hardDeleteStudent(studentId, silent = false) {
    if (!silent) {
      const ok = confirm(
        `学籍番号：${studentId} を「完全削除」します。\n` +
        `（学生情報・所属・出欠データが消えます）\nよろしいですか？`
      );
      if (!ok) return false;
    }

    // 1) students から削除
    let students = JSON.parse(localStorage.getItem("students") || "[]");
    students = students.filter(s => (s.id || s.studentId) !== studentId);
    localStorage.setItem("students", JSON.stringify(students));

    // 2) classes からも削除（全クラス）
    let classes = JSON.parse(localStorage.getItem("classes") || "[]");
    classes.forEach(c => {
      if (Array.isArray(c.members))   c.members   = c.members.filter(x => x !== studentId);
      if (Array.isArray(c.memberIds)) c.memberIds = c.memberIds.filter(x => x !== studentId);
      if (Array.isArray(c.students))  c.students  = c.students.filter(x => x !== studentId);
    });
    localStorage.setItem("classes", JSON.stringify(classes));

    // 3) 出欠データ attendanceData から削除
    const attendanceMap = JSON.parse(localStorage.getItem("attendanceData") || "{}");
    delete attendanceMap[studentId];
    localStorage.setItem("attendanceData", JSON.stringify(attendanceMap));

    // 4) ログイン中ならログイン情報を消す
    const logged = JSON.parse(localStorage.getItem("loggedInStudent") || "null");
    if (logged && (logged.id || logged.studentId) === studentId) {
      localStorage.removeItem("loggedInStudent");
    }

    if (!silent) alert("完全削除しました。");
    return true;
  }

  // ===== クラスから外す（所属だけ削除） =====
  function removeMember(studentId) {
    const { students, classes } = loadData();
    const classId = classSelect.value;

    const cls = classes.find(c => c.id === classId);
    if (!cls) {
      alert("クラスが見つかりません。");
      return;
    }
    if (!Array.isArray(cls.members)) cls.members = [];

    const stu = students.find(s => s.id === studentId);
    if (!stu) {
      alert("学生が見つかりません。");
      return;
    }

    if (!confirm(`学籍番号 ${stu.id}：${stu.name} をこのクラスから外しますか？`)) {
      return;
    }

    cls.members = cls.members.filter(id => id !== studentId);

    // 学生側のクラス情報も外す（あなたの仕様に合わせて）
    if (stu.class === classId) {
      stu.class = "";
    }

    saveData(students, classes);
    alert("クラスから除外しました。");
    renderMembers();
  }

  // ===== クラスに学生を追加 =====
  function addMember() {
    const { students, classes } = loadData();
    const classId = classSelect.value;
    const cls = classes.find(c => c.id === classId);

    if (!cls) {
      alert("クラスが選択されていません。");
      return;
    }
    if (!Array.isArray(cls.members)) cls.members = [];

    // まだこのクラスに所属していない学生だけ候補
    const candidates = students.filter(s => !cls.members.includes(s.id));

    if (candidates.length === 0) {
      alert("追加できる学生がいません。（全員このクラスに所属済みです）");
      return;
    }

    let listText = "";
    candidates.forEach(s => {
      listText += `${s.id} : ${s.name}\n`;
    });

    const inputId = prompt("追加したい学生の学籍番号を入力してください。\n\n" + listText);
    if (!inputId) return;

    const stu = candidates.find(s => s.id === inputId.trim());
    if (!stu) {
      alert("その学籍番号の学生は候補にいません。");
      return;
    }

    cls.members.push(stu.id);
    stu.class = classId;

    saveData(students, classes);
    alert(`${stu.name} さんをこのクラスに追加しました。`);
    renderMembers();
  }

  // ===== クラス全員を完全削除 =====
  function hardDeleteAllInClass() {
    const { students, classes } = loadData();
    const classId = classSelect.value;
    const cls = classes.find(c => c.id === classId);

    if (!cls || !Array.isArray(cls.members) || cls.members.length === 0) {
      alert("削除対象の学生がいません。");
      return;
    }

    const count = cls.members.length;
    const ok = confirm(
      `このクラスの学生 ${count} 人を「完全削除」します。\n` +
      `（学生情報・所属・出欠データが消えます）\n本当に実行しますか？`
    );
    if (!ok) return;

    // メンバーIDをコピーして順に削除（途中で配列が変わってもOK）
    const ids = cls.members.slice();

    // silent=true にして confirm/alert を連発しない
    ids.forEach(id => hardDeleteStudent(id, true));

    alert(`完全削除しました（${count}人）。`);
    renderMembers();
  }

  // ===== クリックイベント（イベント委譲）=====
  memberList.addEventListener("click", (e) => {
    const hardBtn = e.target.closest(".js-hard-delete");
    if (hardBtn) {
      const studentId = hardBtn.dataset.id;
      hardDeleteStudent(studentId);
      renderMembers();
      return;
    }

    const editBtn = e.target.closest(".js-edit");
    if (editBtn) {
      editStudent(editBtn.dataset.id);
      return;
    }

    const removeBtn = e.target.closest(".js-remove");
    if (removeBtn) {
      removeMember(removeBtn.dataset.id);
      return;
    }
  });

  classSelect.addEventListener("change", () => {
    sessionStorage.setItem("selectedClassId", classSelect.value);
    renderMembers();
  });

  addMemberBtn.addEventListener("click", addMember);

  if (hardDeleteAllBtn) {
    hardDeleteAllBtn.addEventListener("click", hardDeleteAllInClass);
  }

  // ===== 初期化 =====
  initClassOptions();
  renderMembers();
});
