// admin_student_register.js

document.addEventListener("DOMContentLoaded", () => {

    // -------------------------
    // データ取得 & クラスのmembers補正
    // -------------------------
    function loadData() {
        const students = JSON.parse(localStorage.getItem("students") || "[]");
        let classes = JSON.parse(localStorage.getItem("classes") || "[]");

        // 既存クラスに members 無かったら追加
        classes = classes.map(c => {
            if (!Array.isArray(c.members)) {
                c.members = [];
            }
            return c;
        });
        localStorage.setItem("classes", JSON.stringify(classes));

        return { students, classes };
    }

    // -------------------------
    // クラス選択肢の読み込み
    // -------------------------
    function loadClassOptions() {
        const { classes } = loadData();
        const select = document.getElementById("studentClass");
        if (!select) {
            console.error("studentClass セレクトが見つかりません");
            return;
        }

        select.innerHTML = "";

        classes.forEach(c => {
            const op = document.createElement("option");
            op.value = c.id;
            op.textContent = `${c.id}：${c.name}`;
            select.appendChild(op);
        });

        // クラス編集画面から来たとき、選択されたクラスをセット
        const selectedClassId = sessionStorage.getItem("selectedClassId");
        if (selectedClassId) {
            select.value = selectedClassId;
        }
    }

    // ★ 最初にクラス一覧反映
    loadClassOptions();

    // -------------------------
    // 登録ボタンのクリック処理
    // -------------------------
    const btn = document.getElementById("studentRegisterBtn");
    if (!btn) {
        console.error("studentRegisterBtn が見つかりません");
        return;
    }

    btn.addEventListener("click", () => {
        const { students, classes } = loadData();

        const newStudent = {
            id: document.getElementById("studentId").value.trim(),
            name: document.getElementById("studentName").value.trim(),
            kana: document.getElementById("studentKana").value.trim(),
            class: document.getElementById("studentClass").value,
            gender: document.getElementById("studentGender").value,
            email: document.getElementById("studentEmail").value.trim(),
            password: document.getElementById("studentPass").value.trim(),
            mustChangePassword: true
        };

        // 必須チェック
        if (!newStudent.id || !newStudent.name || !newStudent.password) {
            alert("必須項目が入力されていません。");
            return;
        }

        // ID 重複チェック
        if (students.some(s => s.id === newStudent.id)) {
            alert("この学籍番号は既に登録されています。");
            return;
        }

        // 学生を追加
        students.push(newStudent);
        localStorage.setItem("students", JSON.stringify(students));

        // クラスの members に学籍番号を追加
        const cls = classes.find(c => c.id === newStudent.class);
        if (cls) {
            if (!Array.isArray(cls.members)) {
                cls.members = [];
            }
            cls.members.push(newStudent.id);
            localStorage.setItem("classes", JSON.stringify(classes));
        }

        // 例：登録完了のところで
        alert("学生を登録しました。");
        window.location.href = "admin_student_members.html";

    });

});
