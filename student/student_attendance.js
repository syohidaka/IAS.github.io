document.addEventListener("DOMContentLoaded", () => {
  console.log("student_attendance DOMContentLoaded");

  const student = typeof getLoggedInStudent === "function"
    ? getLoggedInStudent()
    : JSON.parse(localStorage.getItem("loggedInStudent"));

  if (!student) {
    alert("ログインしてください");
    window.location.href = "student_login.html";
    return;
  }

  const welcome = document.getElementById("welcome-msg");
  if (welcome) {
    welcome.textContent = `こんにちは、${student.name} さん`;
  }

  const startBtn = document.getElementById("startButton");
  const endBtn   = document.getElementById("endButton");
  const statusEl = document.getElementById("status-message");

  // もし要素が取れてないときは、ここで止める（バグ原因がすぐ分かる）
  if (!startBtn || !endBtn || !statusEl) {
    console.error("必要な要素が見つかりません", { startBtn, endBtn, statusEl });
    return;
  }

  // ---------------------------
  // ステータスメッセージの色と文言をまとめて変える
  // ---------------------------
  function setStatus(type, text) {
    statusEl.classList.remove("status-present", "status-late", "status-absent");
    statusEl.textContent = text;

    if (type === "present") {
      statusEl.classList.add("status-present"); // 緑
    } else if (type === "late") {
      statusEl.classList.add("status-late");    // オレンジ
    } else if (type === "absent") {
      statusEl.classList.add("status-absent");  // 赤（未使用）
    }
  }

  const sid   = student.studentId || student.id;
  const today = new Date().toISOString().split("T")[0];

  let data = JSON.parse(localStorage.getItem("attendanceData") || "{}");
  if (!data[sid]) data[sid] = {};
  if (!data[sid][today]) data[sid][today] = { start: null, end: null, late: false, reason: "" };

  function save() {
    localStorage.setItem("attendanceData", JSON.stringify(data));
  }

  // 8:50 以降は遅刻
  function isLate(timeStr) {
    if (!timeStr) return false;

    // "HH:MM:SS" or "HH:MM" どっちでもOKにする
    const parts = timeStr.split(":").map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;

    const minutes = h * 60 + m;
    const limit = 8 * 60 + 50; // 8:50
    return minutes > limit;
  }

  // 表示更新
  function updateView() {
    const rec = data[sid][today];

    if (!rec.start && !rec.end) {
      setStatus("none", "まだ打刻していません。");

    } else if (rec.start && !rec.end) {
      const base = `本日登校打刻済み：${rec.start}　※まだ下校の打刻がありません。`;
      if (rec.late) {
        setStatus("late", `🟡 ${base}（遅刻）`);
      } else {
        setStatus("present", `🟢 ${base}（出席）`);
      }

    } else if (rec.start && rec.end) {
      const base = `本日の打刻完了：${rec.start} → ${rec.end}`;
      if (rec.late) {
        setStatus("late", `🟡 ${base}（登校遅刻）`);
      } else {
        setStatus("present", `🟢 ${base}`);
      }
    }

    // ボタン制御
    startBtn.disabled = !!rec.start;
    endBtn.disabled   = !rec.start || !!rec.end;
  }

  updateView();

  // ---------------------------
  // 登校ボタン
  // ---------------------------
  startBtn.addEventListener("click", () => {
    const rec = data[sid][today];
    if (rec.start) {
      alert("すでに登校打刻済みです。");
      return;
    }

    const now = new Date().toLocaleTimeString("ja-JP", { hour12: false });
    if (!confirm(`登校時刻として「${now}」を記録します。よろしいですか？`)) return;

    rec.start = now;
rec.late  = isLate(now);

// ★遅刻なら理由入力（任意）
if (rec.late) {
  const r = prompt("遅刻理由を入力してください（例：電車遅延、寝坊）", rec.reason || "");
  rec.reason = (r ?? "").trim(); // キャンセルなら空
} else {
  rec.reason = ""; // 遅刻じゃない日は空にする
}

save();


    updateView();
    alert(`登校を記録しました：${now}`);
  });

  // ---------------------------
  // 下校ボタン
  // ---------------------------
  endBtn.addEventListener("click", () => {
    const rec = data[sid][today];

    if (!rec.start) {
      alert("先に登校（出勤）を記録してください。");
      return;
    }
    if (rec.end) {
      alert("すでに下校打刻済みです。");
      return;
    }

    const now = new Date().toLocaleTimeString("ja-JP", { hour12: false });
    if (!confirm(`下校時刻として「${now}」を記録します。よろしいですか？`)) return;

    rec.end = now;
    save();

    updateView();
    alert(`下校を記録しました：${now}`);
  });
});
