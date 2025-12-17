// admin/admin_all_data.js
document.addEventListener("DOMContentLoaded", () => {

  // -------------------------
  // 管理者チェック
  // -------------------------
  const role = sessionStorage.getItem("role");
  if (role !== "admin") {
    alert("このページは管理者のみアクセスできます。");
    location.href = "../index.html";
    return;
  }

  const bodyEl        = document.getElementById("attendanceBody");
  const monthInput    = document.getElementById("monthSelect");
  const studentFilter = document.getElementById("studentIdFilter"); // ★追加

  // -------------------------
  // データ読み込み
  // -------------------------
  function loadAttendanceMap() {
    return JSON.parse(localStorage.getItem("attendanceData") || "{}");
  }

  function loadStudents() {
    return JSON.parse(localStorage.getItem("students") || "[]");
  }

  // -------------------------
  // 時計
  // -------------------------
  function updateClock() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const weekJP = ["日", "月", "火", "水", "木", "金", "土"];
    const w = weekJP[now.getDay()];

    const el = document.getElementById("clock");
    if (el) el.textContent = `${y}/${m}/${d} (${w}) ${hh}:${mm}:${ss}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // -------------------------
  // 月入力 初期値（今月）
  // -------------------------
  function initMonth() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    if (monthInput) monthInput.value = `${y}-${m}`;
  }

  // -------------------------
  // 一覧再描画
  // -------------------------
  function reloadTable() {
    if (!monthInput || !bodyEl) return;

    const ym = monthInput.value;
    if (!ym) return;

    const filterText = (studentFilter?.value || "").trim(); // ★追加（空なら絞り込みなし）

    const [yy, mm] = ym.split("-");
    const year  = parseInt(yy, 10);
    const month = parseInt(mm, 10);

    const attendanceMap = loadAttendanceMap();
    const students      = loadStudents();

    const rows = [];

    Object.keys(attendanceMap).forEach(studentIdKey => {
      const perStudent = attendanceMap[studentIdKey] || {};

      // ★学籍番号で絞り込み（「打つだけで」絞れる）
      // 部分一致にしたいので includes、先頭一致なら startsWith に変更OK
      if (filterText && !String(studentIdKey).includes(filterText)) {
        return;
      }

      const stuInfo = students.find(s =>
        s.id === studentIdKey || s.studentId === studentIdKey
      );

      Object.keys(perStudent).forEach(dateStr => {
        const [yStr, mStr] = dateStr.split("-");
        const ry = parseInt(yStr, 10);
        const rm = parseInt(mStr, 10);
        if (ry !== year || rm !== month) return;

        const rec = perStudent[dateStr] || {};

        // 状態判定（遅刻含む）
        let status = "未出席";
        if (rec.start && rec.end) {
          status = rec.late ? "出席（遅刻）" : "出席";
        } else if (rec.start && !rec.end) {
          status = rec.late ? "出席（遅刻・退室未記録）" : "出席（退室未記録）";
        }

        rows.push({
          date: dateStr,
          classId: stuInfo ? (stuInfo.class || stuInfo.classId || "-") : "-",
          studentId: studentIdKey,
          name: stuInfo ? stuInfo.name : "-",
          status,
          late: !!rec.late,
          reason: (rec.reason || "").trim(),
          start: rec.start || "",
          end: rec.end || ""
        });
      });
    });

    // 日付＋学籍番号でソート
    rows.sort((a, b) => {
      if (a.date === b.date) {
        return String(a.studentId).localeCompare(String(b.studentId));
      }
      return a.date < b.date ? -1 : 1;
    });

    // 描画
    bodyEl.innerHTML = "";

    if (rows.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 8;
      td.textContent = "条件に一致する出欠データはありません。";
      tr.appendChild(td);
      bodyEl.appendChild(tr);
      return;
    }

    rows.forEach(r => {
      const reasonText = r.late ? (r.reason ? r.reason : "理由未入力") : "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.classId}</td>
        <td>${r.studentId}</td>
        <td>${r.name}</td>
        <td>${r.status}</td>
        <td>${reasonText}</td>
        <td>${r.start || "-"}</td>
        <td>${r.end   || "-"}</td>
      `;
      bodyEl.appendChild(tr);
    });
  }

  // -------------------------
  // 初期化＆イベント
  // -------------------------
  initMonth();
  reloadTable();

  document.getElementById("reloadBtn")?.addEventListener("click", reloadTable);
  monthInput?.addEventListener("change", reloadTable);

  // ★「打つだけで」絞り込み（ここがポイント）
  studentFilter?.addEventListener("input", reloadTable);
});
