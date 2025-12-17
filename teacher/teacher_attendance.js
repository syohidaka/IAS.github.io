// teacher_attendance.js

document.addEventListener("DOMContentLoaded", () => {
  const OT_THRESHOLD_MIN = 8 * 60; // 8時間 = 480分（昼休み/休憩を引いた実働がこれを超えたら残業）

  // --------------- 日付＆時間ヘルパー ---------------
  function getTodayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function nowTimeStr() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function toMinutes(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10));
    return h * 60 + m;
  }

  function toSeconds(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.split(":").map((v) => parseInt(v, 10));
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const s = parts[2] ?? 0;
    return h * 3600 + m * 60 + s;
  }

  function fmtHM(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}時間${m}分`;
  }

  // --------------- 共通：先生情報・日付 ---------------
  const todayStr = getTodayStr();
  const teacherId = sessionStorage.getItem("teacherId") || "T001";
  const teacherName = sessionStorage.getItem("teacherName") || "教員";

  const teacherHello = document.getElementById("teacherHello");
  if (teacherHello) {
    teacherHello.textContent = `こんにちは、${teacherName} 先生（ID: ${teacherId}）`;
  }

  // --------------- UI要素 ---------------
  const statusEl = document.getElementById("statusLines");
  const summaryEl = document.getElementById("summaryLines");
  const overtimeBox = document.getElementById("overtimeBox");
  const overtimeReasonEl = document.getElementById("overtimeReason");
  const saveReasonBtn = document.getElementById("saveReasonBtn");
  const reasonWarn = document.getElementById("reasonWarn");

  const clockInBtn = document.getElementById("clockInBtn");
  const breakStartBtn = document.getElementById("breakStartBtn");
  const breakEndBtn = document.getElementById("breakEndBtn");
  const clockOutBtn = document.getElementById("clockOutBtn");

  // --------------- データ読み書き ---------------
  function loadAttendanceAll() {
    return JSON.parse(localStorage.getItem("teacherAttendance") || "[]");
  }
  function saveAttendanceAll(list) {
    localStorage.setItem("teacherAttendance", JSON.stringify(list));
  }

  function getTodayRecord() {
    const all = loadAttendanceAll();
    return all.find((r) => r.teacherId === teacherId && r.date === todayStr) || null;
  }

  function upsertTodayRecord(updateFn) {
    const all = loadAttendanceAll();
    let rec = all.find((r) => r.teacherId === teacherId && r.date === todayStr);

    if (!rec) {
      rec = {
        teacherId,
        date: todayStr,
        clockIn: null,
        clockOut: null,
        breakStart: null,
        breakEnd: null,
        totalMinutes: null,
        overtimeMinutes: null,
        overtimeReason: "" // ★追加：残業理由
      };
      all.push(rec);
    }

    updateFn(rec);

    // 毎回再計算
    recalcSummary(rec);

    saveAttendanceAll(all);
    refreshView();
  }

  // --------------- 勤務時間計算（休憩を引いて実働、8時間超は残業） ---------------
  function recalcSummary(rec) {
    if (!rec.clockIn || !rec.clockOut) {
      rec.totalMinutes = null;
      rec.overtimeMinutes = null;
      return;
    }

    const inMin = toMinutes(rec.clockIn);
    const outMin = toMinutes(rec.clockOut);
    let workMinutes = outMin - inMin;

    // 休憩が揃っていれば引く
    if (rec.breakStart && rec.breakEnd) {
      const brkS = toMinutes(rec.breakStart);
      const brkE = toMinutes(rec.breakEnd);
      if (brkE > brkS) {
        workMinutes -= (brkE - brkS);
      }
    }

    rec.totalMinutes = workMinutes;

    // ★ルール：昼休みを抜いた実働が8時間超えたら残業
    if (workMinutes > OT_THRESHOLD_MIN) {
      rec.overtimeMinutes = workMinutes - OT_THRESHOLD_MIN;
    } else {
      rec.overtimeMinutes = 0;
    }
  }

  // --------------- 休憩アラート（開始時＋60分経過） ---------------
  let breakReminderTimer = null;

  function clearBreakTimer() {
    if (breakReminderTimer) {
      clearTimeout(breakReminderTimer);
      breakReminderTimer = null;
    }
  }

  function scheduleBreakReminderIfNeeded(rec) {
    clearBreakTimer();

    // 休憩中（開始済み＆終了未）
    if (!(rec && rec.breakStart && !rec.breakEnd)) return;

    const startSec = toSeconds(rec.breakStart);
    const nowSec = toSeconds(nowTimeStr());
    if (startSec == null || nowSec == null) return;

    const elapsedSec = Math.max(0, nowSec - startSec);
    const targetSec = 60 * 60; // 60分

    // 1回だけ出したいので、当日・先生単位でフラグ
    const flagKey = `breakAlertShown_${teacherId}_${todayStr}`;

    // すでに60分超えてたら即アラート（未表示なら）
    if (elapsedSec >= targetSec) {
      if (!sessionStorage.getItem(flagKey)) {
        alert("休憩が60分を超えています。必要なら休憩終了を打刻してください。");
        sessionStorage.setItem(flagKey, "1");
      }
      return;
    }

    // まだなら残り時間でタイマー
    const remainMs = (targetSec - elapsedSec) * 1000;
    breakReminderTimer = setTimeout(() => {
      if (!sessionStorage.getItem(flagKey)) {
        alert("休憩が60分経過しました。必要なら休憩終了を打刻してください。");
        sessionStorage.setItem(flagKey, "1");
      }
    }, remainMs);
  }

  // --------------- 画面更新（残業理由ボックスも制御） ---------------
  function refreshView() {
    if (!statusEl || !summaryEl) {
      console.error("statusLines / summaryLines が見つかりません（HTMLのidを確認）");
      return;
      
    }

    const rec = getTodayRecord();

    if (!rec) {
      statusEl.textContent = "まだ打刻がありません。";
      summaryEl.textContent = "勤務時間：- / 残業時間：-";
      if (overtimeBox) overtimeBox.style.display = "none";
      clearBreakTimer();
      return;
    }

    const lines = [];
    lines.push(`日付：${rec.date}`);
    lines.push(`出勤：${rec.clockIn || "-"} / 退勤：${rec.clockOut || "-"}`);
    lines.push(`休憩開始：${rec.breakStart || "-"} / 休憩終了：${rec.breakEnd || "-"}`);
    statusEl.innerHTML = lines.join("<br>");

    if (rec.totalMinutes == null) {
      summaryEl.textContent = "勤務時間：- / 残業時間：-";
    } else {
      const totalText = fmtHM(rec.totalMinutes);
      const otText = fmtHM(rec.overtimeMinutes || 0);
      summaryEl.textContent = `勤務時間：${totalText} / 残業時間：${otText}`;
    }

    // 休憩リマインド
    scheduleBreakReminderIfNeeded(rec);

    // 残業理由UI
    const hasOT = (rec.overtimeMinutes || 0) > 0;
    if (overtimeBox && overtimeReasonEl && reasonWarn) {
      overtimeBox.style.display = hasOT ? "block" : "none";
      if (hasOT) {
        overtimeReasonEl.value = rec.overtimeReason || "";
        reasonWarn.style.display = (rec.clockOut && !String(rec.overtimeReason || "").trim()) ? "block" : "none";
      }
    }
  }

  // --------------- 残業理由 保存ボタン ---------------
  saveReasonBtn?.addEventListener("click", () => {
    const txt = String(overtimeReasonEl?.value || "").trim();
    upsertTodayRecord(rec => {
      rec.overtimeReason = txt;
    });
    alert("残業理由を保存しました。");
  });

  // --------------- ボタン処理 ---------------
  clockInBtn?.addEventListener("click", () => {
    upsertTodayRecord(rec => {
      if (rec.clockIn) {
        alert("すでに出勤打刻済みです。");
        return;
      }
      rec.clockIn = nowTimeStr();
      alert(`出勤を打刻しました：${rec.clockIn}`);
    });
  });

  breakStartBtn?.addEventListener("click", () => {
  upsertTodayRecord(rec => {
    if (!rec.clockIn) {
      alert("先に出勤打刻をしてください。");
      return;
    }
    // ★追加：退勤後は禁止
    if (rec.clockOut) {
      alert("退勤後は休憩を開始できません。");
      return;
    }
    if (rec.breakStart && !rec.breakEnd) {
      alert("すでに休憩中です。（休憩終了を打刻してください）");
      return;
    }

    rec.breakStart = nowTimeStr();
    rec.breakEnd = null;

    alert("休憩を開始しました。休憩終了時に「休憩終了」を押してください。");
    const flagKey = `breakAlertShown_${teacherId}_${todayStr}`;
    sessionStorage.removeItem(flagKey);
  });
});


  breakEndBtn?.addEventListener("click", () => {
  upsertTodayRecord(rec => {
    if (!rec.breakStart) {
      alert("休憩開始が未打刻です。");
      return;
    }
    if (rec.breakEnd) {
      alert("すでに休憩終了済みです。");
      return;
    }
    // ★追加：退勤後は禁止（運用上ここも止めたいなら）
    if (rec.clockOut) {
      alert("退勤後は休憩終了を打刻できません。");
      return;
    }

    rec.breakEnd = nowTimeStr();
    clearBreakTimer();
    alert("休憩を終了しました。");
  });
});


  clockOutBtn?.addEventListener("click", () => {
  let didClockOut = false;

  upsertTodayRecord(rec => {
    if (!rec.clockIn) {
      alert("先に出勤打刻をしてください。");
      return;
    }
    if (rec.clockOut) {
      alert("すでに退勤打刻済みです。");
      return;
    }

    rec.clockOut = nowTimeStr();
    didClockOut = true;
    // ※ここではアラートしない（まだ計算前）
  });

  // 打刻できてない（エラーでreturnされた）なら終わり
  if (!didClockOut) return;

  // upsertが保存＆再計算した後のデータを取り直す
  const rec = getTodayRecord();
  if (!rec) return;

  const total = (rec.totalMinutes == null) ? "-" : fmtHM(rec.totalMinutes);
  const ot    = (rec.overtimeMinutes == null) ? "-" : fmtHM(rec.overtimeMinutes || 0);

  alert(`退勤を打刻しました：${rec.clockOut}\n勤務時間：${total}\n残業時間：${ot}`);

  // 残業があり、理由が未入力なら促す
  if ((rec.overtimeMinutes || 0) > 0 && !String(rec.overtimeReason || "").trim()) {
    alert("残業が発生しています。下の『残業理由』を入力して保存してください。");
    overtimeReasonEl?.focus();
  }
});


  // 初期表示
  refreshView();
});
