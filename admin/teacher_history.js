// admin/teacher_history.js

document.addEventListener("DOMContentLoaded", () => {

    // ★ 管理者以外は入れない
    const role = sessionStorage.getItem("role");
    if (role !== "admin") {
        alert("このページは管理者のみ参照できます。");
        location.href = "../index.html";
        return;
    }

    // ---------- データ読み込み ----------
    function loadTeachers() {
        return JSON.parse(localStorage.getItem("teachers") || "[]");
    }

    function loadAttendance() {
        return JSON.parse(localStorage.getItem("teacherAttendance") || "[]");
    }

    // ---------- フィルタ用UIの初期化 ----------
    const teacherSelect = document.getElementById("teacherSelect");
    const monthSelect   = document.getElementById("monthSelect");
    const historyBody   = document.getElementById("historyBody");
    const summaryText   = document.getElementById("summaryText");

    // 教員プルダウン
    function initTeacherSelect() {
        const teachers = loadTeachers();
        teacherSelect.innerHTML = "";

        // 先頭に「全教員」
        const opAll = document.createElement("option");
        opAll.value = "";
        opAll.textContent = "全教員";
        teacherSelect.appendChild(opAll);

        teachers.forEach(t => {
            const op = document.createElement("option");
            op.value = t.id;
            op.textContent = `${t.id}：${t.name}`;
            teacherSelect.appendChild(op);
        });

        // （教員編集から飛んできたとき用。使ってなければ無視してOK）
        const selectedId = sessionStorage.getItem("selectedTeacherIdForHistory");
        if (selectedId) {
            teacherSelect.value = selectedId;
            sessionStorage.removeItem("selectedTeacherIdForHistory");
        }
    }

    // 対象月初期値（今月）
    function initMonthSelect() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        monthSelect.value = `${y}-${m}`;
    }

    // 分 → "X時間Y分" 文字列
    function formatMinutes(min) {
        if (min == null || isNaN(min)) return "-";
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h}時間${m}分`;
    }

    // ▼▼▼ ここから「タイムカード修正用」の関数を追加 ▼▼▼

    // "HH:MM" or "HH:MM:SS" → 分
    function toMinutes(timeStr) {
        if (!timeStr) return null;
        const parts = timeStr.split(":").map(v => parseInt(v, 10));
        const h = parts[0] || 0;
        const m = parts[1] || 0;
        return h * 60 + m;
    }

    // 1レコードの勤務時間・残業時間を再計算
    function recalcRecord(rec) {
        if (!rec.clockIn || !rec.clockOut) {
            rec.totalMinutes = null;
            rec.overtimeMinutes = null;
            return;
        }

        const inMin  = toMinutes(rec.clockIn);
        const outMin = toMinutes(rec.clockOut);
        if (inMin == null || outMin == null || outMin <= inMin) {
            rec.totalMinutes = null;
            rec.overtimeMinutes = null;
            return;
        }

        let workMinutes = outMin - inMin;

        // 休憩考慮
        if (rec.breakStart && rec.breakEnd) {
            const bS = toMinutes(rec.breakStart);
            const bE = toMinutes(rec.breakEnd);
            if (bS != null && bE != null && bE > bS) {
                workMinutes -= (bE - bS);
            }
        }

        // 標準勤務時間（教員マスタから）
        const teachers = loadTeachers();
        const tInfo = teachers.find(t => t.id === rec.teacherId);
        let stdMinutes = null;

        if (tInfo && tInfo.workStart && tInfo.workEnd) {
            const ws = toMinutes(tInfo.workStart);
            const we = toMinutes(tInfo.workEnd);
            if (ws != null && we != null && we > ws) {
                stdMinutes = we - ws - (tInfo.breakMinutes || 0);
            }
        }

        rec.totalMinutes = workMinutes;
        if (stdMinutes != null && workMinutes > stdMinutes) {
            rec.overtimeMinutes = workMinutes - stdMinutes;
        } else {
            rec.overtimeMinutes = 0;
        }
    }

    // 1日分のタイムカードを修正する
    function openEditDialog(teacherId, date) {
        const attendance = loadAttendance();
        const target = attendance.find(r => r.teacherId === teacherId && r.date === date);
        if (!target) return;

        const newClockIn = prompt("出勤時刻（HH:MM または HH:MM:SS）", target.clockIn || "");
        if (newClockIn === null) return;

        const newClockOut = prompt("退勤時刻（HH:MM または HH:MM:SS）", target.clockOut || "");
        if (newClockOut === null) return;

        const newBreakStart = prompt("休憩開始（空欄可）", target.breakStart || "");
        if (newBreakStart === null) return;

        const newBreakEnd = prompt("休憩終了（空欄可）", target.breakEnd || "");
        if (newBreakEnd === null) return;

        target.clockIn    = newClockIn || null;
        target.clockOut   = newClockOut || null;
        target.breakStart = newBreakStart || null;
        target.breakEnd   = newBreakEnd || null;

        // 勤務時間・残業時間を再計算
        recalcRecord(target);

        // 保存して再描画
        localStorage.setItem("teacherAttendance", JSON.stringify(attendance));
        alert("勤務データを更新しました。");
        reloadTable();
    }

    // ▲▲▲ ここまで追加 ▲▲▲

    // ---------- 一覧の再描画 ----------
    function reloadTable() {
        const teachers   = loadTeachers();
        const attendance = loadAttendance();

        const targetTeacherId = teacherSelect.value;   // "" の場合は全教員
        const ym = monthSelect.value;                  // "YYYY-MM"
        if (!ym) return;

        const [yy, mm] = ym.split("-");
        const year  = parseInt(yy, 10);
        const month = parseInt(mm, 10);

        historyBody.innerHTML = "";

        let sumTotal = 0;
        let sumOver  = 0;

        // フィルタして日付順にソート
        const filtered = attendance
            .filter(rec => {
                if (targetTeacherId && rec.teacherId !== targetTeacherId) return false;
                if (!rec.date) return false;
                const [ry, rm] = rec.date.split("-").map(v => parseInt(v,10));
                return ry === year && rm === month;
            })
            .sort((a, b) => (a.date < b.date ? -1 : 1));

        if (filtered.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 10; // 編集列を追加したので 10 列
            td.textContent = "該当する勤務履歴がありません。";
            tr.appendChild(td);
            historyBody.appendChild(tr);
            summaryText.textContent = "勤務時間：- / 残業時間：-";
            return;
        }

        filtered.forEach(rec => {
            const tInfo = teachers.find(t => t.id === rec.teacherId);
            const name  = tInfo ? tInfo.name : "(不明)";

            // 合計時間集計
            if (rec.totalMinutes != null) {
                sumTotal += rec.totalMinutes;
            }
            if (rec.overtimeMinutes != null) {
                sumOver  += rec.overtimeMinutes;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${rec.date}</td>
                <td>${rec.teacherId}</td>
                <td>${name}</td>
                <td>${rec.clockIn     || "-"}</td>
                <td>${rec.clockOut    || "-"}</td>
                <td>${rec.breakStart  || "-"}</td>
                <td>${rec.breakEnd    || "-"}</td>
                <td>${formatMinutes(rec.totalMinutes)}</td>
                <td>${formatMinutes(rec.overtimeMinutes)}</td>
                <td><button class="edit-btn">編集</button></td>
            `;

            // この行の「編集」ボタンにイベントをつける
            const btn = tr.querySelector(".edit-btn");
            btn.addEventListener("click", () => {
                openEditDialog(rec.teacherId, rec.date);
            });

            historyBody.appendChild(tr);
        });

        summaryText.textContent =
            `勤務時間：${formatMinutes(sumTotal)} / 残業時間：${formatMinutes(sumOver)}`;
    }

    // ---------- 初期化 ----------
    initTeacherSelect();
    initMonthSelect();
    reloadTable();

    // 再表示ボタン・プルダウン変更時にも即更新
    document.getElementById("reloadBtn").addEventListener("click", reloadTable);
    teacherSelect.addEventListener("change", reloadTable);
    monthSelect.addEventListener("change", reloadTable);
});
