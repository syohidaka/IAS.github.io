// project/admin/class/class_members.js

document.addEventListener("DOMContentLoaded", () => {

    // ===== 時計（おまけ） =====
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

    // ===== データ読み書き =====
    function loadData() {
        return {
            students: JSON.parse(localStorage.getItem("students") || "[]"),
            classes:  JSON.parse(localStorage.getItem("classes")  || "[]")
        };
    }

    function saveData(students, classes) {
        localStorage.setItem("students", JSON.stringify(students));
        localStorage.setItem("classes",  JSON.stringify(classes));
    }

    // ===== クラス選択肢の初期化 =====
    const classSelect = document.getElementById("classSelect");
    const memberList  = document.getElementById("memberList");

    function initClassOptions() {
        const { classes } = loadData();
        classSelect.innerHTML = "";

        classes.forEach(cls => {
            const op = document.createElement("option");
            op.value = cls.id;
            op.textContent = `${cls.id}：${cls.name}`;
            classSelect.appendChild(op);
        });

        // クラス編集画面から sessionStorage で来た場合、そのクラスを初期選択
        const selected = sessionStorage.getItem("selectedClassId");
        if (selected && classes.some(c => c.id === selected)) {
            classSelect.value = selected;
        }
    }

    // ===== メンバー一覧の表示 =====
    function renderMembers() {
        const { students, classes } = loadData();
        const classId = classSelect.value;

        memberList.innerHTML = "";

        if (!classId) return;

        const cls = classes.find(c => c.id === classId);
        if (!cls) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 6;
            td.textContent = "クラスが見つかりません。";
            tr.appendChild(td);
            memberList.appendChild(tr);
            return;
        }

        if (!Array.isArray(cls.members)) {
            cls.members = [];
        }

        // このクラスに所属する学生を抽出
        const members = students.filter(s => cls.members.includes(s.id));

        if (members.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 6;
            td.textContent = "このクラスにはまだ学生が登録されていません。";
            tr.appendChild(td);
            memberList.appendChild(tr);
            return;
        }

        members.forEach(stu => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${stu.id}</td>
                <td>${stu.name}</td>
                <td>${stu.kana || ""}</td>
                <td>${stu.gender || ""}</td>
                <td>${stu.email || ""}</td>
                <td>
                    <button class="btn btn-del" onclick="removeMember('${stu.id}')">
                        クラスから削除
                    </button>
                </td>
            `;
            memberList.appendChild(tr);
        });
    }

    // ===== クラスからメンバーを削除 =====
    window.removeMember = function(studentId) {
        if (!confirm(`学籍番号 ${studentId} をこのクラスから削除しますか？`)) {
            return;
        }

        const { students, classes } = loadData();
        const classId = classSelect.value;
        const cls = classes.find(c => c.id === classId);

        if (!cls) {
            alert("クラスが見つかりません。");
            return;
        }

        if (!Array.isArray(cls.members)) {
            cls.members = [];
        }

        // クラス側の members から除外
        cls.members = cls.members.filter(id => id !== studentId);

        // 学生側のクラス情報も外す（同じクラスだったときだけ）
        const stu = students.find(s => s.id === studentId);
        if (stu && (stu.class === classId || stu.classId === classId)) {
            stu.class = "";   // 「未所属」扱い。必要なら "未所属" 等でもOK
        }

        saveData(students, classes);

        alert("クラスから学生を削除しました。");
        renderMembers();
    };

    // ===== 初期化 =====
    initClassOptions();
    renderMembers();

    classSelect.addEventListener("change", () => {
        // クラス選択が変わったら一覧を更新
        sessionStorage.setItem("selectedClassId", classSelect.value);
        renderMembers();
    });
});
