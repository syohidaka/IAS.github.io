// student_history.js
document.addEventListener("DOMContentLoaded", () => {
  // ===== ログイン中学生取得 =====
  const student = (typeof getLoggedInStudent === "function")
    ? getLoggedInStudent()
    : JSON.parse(localStorage.getItem("loggedInStudent"));

  if (!student) {
    alert("ログインしてください");
    location.href = "student_login.html";
    return;
  }

  const sid = student.studentId || student.id; // 学籍番号のキー
  const name = student.name || "";

  const studentNameLine = document.getElementById("studentNameLine");
  if (studentNameLine) studentNameLine.textContent = `学生：${sid} ${name}`;

  // ===== 要素 =====
  const monthPicker  = document.getElementById("monthPicker");
  const statusFilter = document.getElementById("statusFilter");
  const reloadBtn    = document.getElementById("reloadBtn");
  const body         = document.getElementById("historyBody");

  const sumPresent = document.getElementById("sumPresent");
  const sumLate    = document.getElementById("sumLate");
  const sumEarly   = document.getElementById("sumEarly");
  const sumAbsent  = document.getElementById("sumAbsent");

  // ===== ルール（必要ならここだけ変える） =====
  const LATE_LIMIT_MIN = 8 * 60 + 50;   // 8:50より後は遅刻
  const EARLY_LIMIT_MIN = 15 * 60;      // 15:00より前に下校なら早退（好みで変更OK）

  // ===== ユーティリティ =====
  function loadAttendanceData() {
    return JSON.parse(localStorage.getItem("attendanceData") || "{}");
  }

  function toMinutes(timeStr) {
    if (!timeStr) return null;
    // "HH:MM:SS" or "HH:MM"
    const parts = timeStr.split(":").map(n => parseInt(n, 10));
    if (parts.length < 2) return null;
    return parts[0] * 60 + parts[1];
  }

  function getWeekJP(dateObj) {
    return ["日","月","火","水","木","金","土"][dateObj.getDay()];
  }

  function ymd(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function initMonthDefault() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    monthPicker.value = `${y}-${m}`;
  }

  function judgeDay(rec) {
    // rec が無い or startが無い → 欠席
    if (!rec || !rec.start) {
      return { absent: true, late: false, early: false, label: "欠席", key: "absent" };
    }

    const startMin = toMinutes(rec.start);
    const endMin   = toMinutes(rec.end);

    const late = (rec.late === true) || (startMin != null && startMin > LATE_LIMIT_MIN);
    const early = (rec.end && endMin != null && endMin < EARLY_LIMIT_MIN);

    // 表示ラベル（複合も見えるようにする）
    let label = "出席";
    if (late && early) label = "遅刻・早退";
    else if (late) label = "遅刻";
    else if (early) label = "早退";

    // フィルタ用の主キー（遅刻優先にしたいならここを変える）
    let key = "present";
    if (late) key = "late";
    else if (early) key = "early";

    return { absent: false, late, early, label, key };
  }

  function matchesFilter(judge, filterValue) {
    if (filterValue === "all") return true;
    if (filterValue === "present") return !judge.absent && !judge.late && !judge.early;
    if (filterValue === "late") return judge.late;
    if (filterValue === "early") return judge.early;
    if (filterValue === "absent") return judge.absent;
    return true;
  }

  function render() {
    const ym = monthPicker.value; // "YYYY-MM"
    if (!ym) return;

    const [yy, mm] = ym.split("-").map(v => parseInt(v, 10));
    const year = yy;
    const monthIndex = mm - 1; // 0-based

    const filterValue = statusFilter.value;

    const dataAll = loadAttendanceData();
    const userData = dataAll[sid] || {};

    // その月の日数
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();

    body.innerHTML = "";

    let cPresent = 0, cLate = 0, cEarly = 0, cAbsent = 0;
    let shownRows = 0;

    for (let day = 1; day <= lastDay; day++) {
      const dt = new Date(year, monthIndex, day);
      const dateStr = ymd(dt);
      const rec = userData[dateStr] || null;

      const judge = judgeDay(rec);

      // 集計は「全日」でカウント（フィルタに関係なく）
      if (judge.absent) cAbsent++;
      else {
        // 出席扱いの日
        if (judge.late) cLate++;
        if (judge.early) cEarly++;
        if (!judge.late && !judge.early) cPresent++;
      }

      // 表示はフィルタに合わせる
      if (!matchesFilter(judge, filterValue)) continue;

      const tr = document.createElement("tr");

      // 行にクラスを付けて見やすく（CSSで色付けできる）
      tr.classList.add("row-" + (judge.absent ? "absent" : judge.late ? "late" : judge.early ? "early" : "present"));

      tr.innerHTML = `
        <td>${dateStr}</td>
        <td>${getWeekJP(dt)}</td>
        <td>${rec?.start || "-"}</td>
        <td>${rec?.end   || "-"}</td>
        <td>${judge.label}</td>
      `;
      body.appendChild(tr);
      shownRows++;
    }

    // 表示が0行ならメッセージ行
    if (shownRows === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5">該当するデータがありません。</td>`;
      body.appendChild(tr);
    }

    // 集計表示
    sumPresent.textContent = `出席: ${cPresent}`;
    sumLate.textContent    = `遅刻: ${cLate}`;
    sumEarly.textContent   = `早退: ${cEarly}`;
    sumAbsent.textContent  = `欠席: ${cAbsent}`;
  }

  // 初期化
  initMonthDefault();
  render();

  reloadBtn.addEventListener("click", render);
  monthPicker.addEventListener("change", render);
  statusFilter.addEventListener("change", render);
});
