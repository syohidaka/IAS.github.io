// admin_teacher_edit.js

const TEACHER_KEY = "teachers";

// ---------------------------
//  ストレージ I/O
// ---------------------------
function loadFromStorage() {
  const json = localStorage.getItem(TEACHER_KEY);
  if (!json) return [];

  try {
    const list = JSON.parse(json);

    // 既存データの不足項目を補正（マイグレーション用）
    list.forEach(t => {
      if (!t.workTime) t.workTime = "";
      if (t.breakMinutes == null) t.breakMinutes = 0;
      if (t.paidLeaveDays == null) t.paidLeaveDays = 0;

      // ★ パスワードがなければ「ID と同じ」にしておく
      if (!t.password) {
        t.password = t.id;
      }
    });

    return list;
  } catch (e) {
    console.error("teachers の JSON が壊れています", e);
    return [];
  }
}

function saveToStorage(teachers) {
  localStorage.setItem(TEACHER_KEY, JSON.stringify(teachers));
}

// ---------------------------
//  並び替え（ID の数字部分で昇順）
// ---------------------------
function sortById(teachers) {
  teachers.sort((a, b) => {
    const ida = String(a.id || "").replace(/\D/g, "");
    const idb = String(b.id || "").replace(/\D/g, "");
    const na = parseInt(ida || "0", 10);
    const nb = parseInt(idb || "0", 10);

    if (na !== nb) return na - nb; // 数字が小さい順
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

// ---------------------------
//  テーブル描画
// ---------------------------
function renderTeacherTable() {
  const tbody = document.getElementById("teacherList");
  if (!tbody) return;

  let teachers = loadFromStorage();
  sortById(teachers); // 表示用にソート

  tbody.innerHTML = "";

  teachers.forEach((t) => {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = t.id || "";
    tr.appendChild(tdId);

    const tdName = document.createElement("td");
    tdName.textContent = t.name || "";
    tr.appendChild(tdName);

    const tdTime = document.createElement("td");
    tdTime.textContent = t.workTime || "";
    tr.appendChild(tdTime);

    const tdBreak = document.createElement("td");
    tdBreak.textContent = t.breakMinutes != null ? t.breakMinutes : "";
    tr.appendChild(tdBreak);

    const tdPaid = document.createElement("td");
    tdPaid.textContent = t.paidLeaveDays != null ? t.paidLeaveDays : "";
    tr.appendChild(tdPaid);

    const tdHistory = document.createElement("td");
    const historyBtn = document.createElement("button");
    historyBtn.textContent = "勤務履歴修正";
    historyBtn.className = "btn btn-edit";
    historyBtn.addEventListener("click", () => editHistory(t.id));
    tdHistory.appendChild(historyBtn);
    tr.appendChild(tdHistory);

    const tdEdit = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "基本情報編集";
    editBtn.className = "btn btn-edit";
    editBtn.addEventListener("click", () => editTeacher(t.id));
    tdEdit.appendChild(editBtn);
    tr.appendChild(tdEdit);

    const tdDel = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";
    delBtn.className = "btn btn-del";
    delBtn.addEventListener("click", () => deleteTeacher(t.id));
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    tbody.appendChild(tr);
  });
}

// ---------------------------
//  教員追加
// ---------------------------
function addTeacher() {
  const teachers = loadFromStorage();

  const id = prompt("教員ID（例：IVY001）を入力してください");
  if (!id) return;

  if (teachers.some(t => t.id === id)) {
    alert("同じIDの教員が既に登録されています。");
    return;
  }

  const name = prompt("教員名を入力してください（例：山田太郎）");
  if (!name) return;

  const workTime =
    prompt("勤務時間を入力してください（例：08:50 ～ 17:30）", "08:50 ～ 17:30") || "";
  const breakMinutes = prompt("休憩時間（分）を入力してください（例：60）", "60");
  const paidLeaveDays = prompt("有給残（日）を入力してください（例：10）", "10");

  // ★ 初期パスワードを決める
  //   - ID と同じにする場合 → const password = id;
  //   - 管理者が入力する場合 → 下の prompt を使う
  const passwordInput = prompt(
    "初期パスワードを入力してください（空欄なら教員IDと同じにします）",
    ""
  );
  const password = passwordInput ? passwordInput : id;

  const newTeacher = {
    id,
    name,
    workTime,
    breakMinutes: breakMinutes ? Number(breakMinutes) : 0,
    paidLeaveDays: paidLeaveDays ? Number(paidLeaveDays) : 0,
    password, // ★ ここが重要
  };

  teachers.push(newTeacher);
  sortById(teachers);
  saveToStorage(teachers);
  renderTeacherTable();

  alert(`教員「${name}」を追加しました。\n初期パスワード：${password}`);
}

// ---------------------------
//  教員編集（ID で検索）
// ---------------------------
function editTeacher(id) {
  const teachers = loadFromStorage();
  const index = teachers.findIndex(t => t.id === id);
  if (index === -1) {
    alert("対象の教員が見つかりませんでした。");
    return;
  }
  const t = teachers[index];

  const newId = prompt("教員IDを編集してください", t.id);
  if (!newId) return;

  if (teachers.some((other, i) => i !== index && other.id === newId)) {
    alert("同じIDの教員が既に存在します。");
    return;
  }

  const newName = prompt("教員名を編集してください", t.name);
  if (!newName) return;

  const newWorkTime = prompt("勤務時間（表示用）を編集してください", t.workTime || "");
  const newBreakMinutes = prompt(
    "休憩時間（分）を編集してください",
    t.breakMinutes != null ? t.breakMinutes : ""
  );
  const newPaidLeaveDays = prompt(
    "有給残（日）を編集してください",
    t.paidLeaveDays != null ? t.paidLeaveDays : ""
  );

  // ★ パスワード編集（空欄 or キャンセルなら変更なし）
  const newPassword = prompt(
    "パスワードを編集してください（空欄またはキャンセルで変更しない）",
    t.password || t.id
  );
  if (newPassword !== null && newPassword !== "") {
    t.password = newPassword;
  }

  t.id = newId;
  t.name = newName;
  t.workTime = newWorkTime || "";
  t.breakMinutes = newBreakMinutes ? Number(newBreakMinutes) : 0;
  t.paidLeaveDays = newPaidLeaveDays ? Number(newPaidLeaveDays) : 0;

  sortById(teachers);
  saveToStorage(teachers);
  renderTeacherTable();
}

// ---------------------------
//  勤務履歴修正（ID を渡す）
// ---------------------------
function editHistory(id) {
  sessionStorage.setItem("selectedTeacherId", id);
  window.location.href = "teacher_history.html"; // 必要に応じてファイル名変更
}

// ---------------------------
//  教員削除（ID で検索）
// ---------------------------
function deleteTeacher(id) {
  const teachers = loadFromStorage();
  const index = teachers.findIndex(t => t.id === id);
  if (index === -1) {
    alert("対象の教員が見つかりませんでした。");
    return;
  }
  const t = teachers[index];

  if (!confirm(`教員「${t.name}（${t.id}）」を削除しますか？`)) return;

  teachers.splice(index, 1);
  saveToStorage(teachers);
  renderTeacherTable();
}

// ---------------------------
//  初期化
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
  renderTeacherTable();
});
