// teacher/teacher_history.js

document.addEventListener("DOMContentLoaded", () => {

    // ===== ログインチェック =====
    const role        = sessionStorage.getItem("role");
    const teacherId   = sessionStorage.getItem("teacherId");
    const teacherName = sessionStorage.getItem("teacherName") || "教員";

    if (role !== "teacher" || !teacherId) {
        alert("教員としてログインしてください。");
        location.href = "teacher_login.html";
        return;
    }

    // 画面上部の表示
    const infoEl = document.getElementById("teacherInfo");
    if (infoEl) {
        infoEl.textContent = `現在ログイン中：${teacherName} 先生（ID: ${teacherId}）`;
    }

    // ===== 時計 =====
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
        if (el) {
            el.textContent = `${y}/${m}/${d} (${w}) ${hh}:${mm}:${ss}`;
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ===== データ読み込み =====
    function loadAttendance() {
        // 管理者側と同じキー名を使うこと！
        return JSON.parse(localStorage.getItem("teacherAttendance") || "[]");
    }

    // 分 → "X時間Y分"
    function formatMinutes(min) {
        if (min == null || isNaN(min)) return "-";
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h}時間${m}分`;
    }

    const monthSelect = document.getElementById("monthSelect");
    const historyBody = document.getElementById("historyBody");
    const summaryText = document.getElementById("summaryText");

    // 今月を初期値に設定
    function initMonth() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        monthSelect.value = `${y}-${m}`;
    }

    // 一覧再描画
    function reloadTable() {
        const ym = monthSelect.value;
        if (!ym) return;
        const [yy, mm] = ym.split("-");
        const year  = parseInt(yy, 10);
        const month = parseInt(mm, 10);

        const attendance = loadAttendance()
            .filter(rec => rec.teacherId === teacherId)
            .filter(rec => {
                if (!rec.date) return false;
                const [ry, rm] = rec.date.split("-").map(v => parseInt(v, 10));
                return ry === year && rm === month;
            })
            .sort((a, b) => (a.date < b.date ? -1 : 1));

        historyBody.innerHTML = "";

        let sumTotal = 0;
        let sumOver  = 0;

        if (attendance.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 7;
            td.textContent = "この月の勤務履歴はありません。";
            tr.appendChild(td);
            historyBody.appendChild(tr);
            summaryText.textContent = "勤務時間：- / 残業時間：-";
            return;
        }

        attendance.forEach(rec => {
            if (rec.totalMinutes != null) {
                sumTotal += rec.totalMinutes;
            }
            if (rec.overtimeMinutes != null) {
                sumOver += rec.overtimeMinutes;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${rec.date}</td>
                <td>${rec.clockIn    || "-"}</td>
                <td>${rec.clockOut   || "-"}</td>
                <td>${rec.breakStart || "-"}</td>
                <td>${rec.breakEnd   || "-"}</td>
                <td>${formatMinutes(rec.totalMinutes)}</td>
                <td>${formatMinutes(rec.overtimeMinutes)}</td>
            `;
            historyBody.appendChild(tr);
        });

        summaryText.textContent =
            `勤務時間：${formatMinutes(sumTotal)} / 残業時間：${formatMinutes(sumOver)}`;
    }

    initMonth();
    reloadTable();

    document.getElementById("reloadBtn").addEventListener("click", reloadTable);
    monthSelect.addEventListener("change", reloadTable);
});
