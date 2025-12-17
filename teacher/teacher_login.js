// teacher_login.js

// ----------------------------
//  教員ログイン処理（管理者が登録した教員と紐づけ）
// ----------------------------

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("teacherLoginForm");

    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const inputId   = document.getElementById("teacherId").value.trim();
        const inputPass = document.getElementById("teacherPass").value;

        // ★ 管理者が admin_teacher_edit で登録した教員一覧を読み込む
        const teachers = JSON.parse(localStorage.getItem("teachers") || "[]");

        // id と password が一致する教員を探す
        const teacher = teachers.find(t =>
            t.id === inputId && t.password === inputPass
        );

        if (!teacher) {
            alert("教員ID またはパスワードが違います。");
            return;
        }

        // ★ ログイン情報をセッションに保存（他の画面でも使う）
        sessionStorage.setItem("teacherId", teacher.id);
        sessionStorage.setItem("teacherName", teacher.name);
        sessionStorage.setItem("role", "teacher");

        alert("ログインしました。");

        // 教員メニューへ遷移
        window.location.href = "teacher_menu.html"; 
    });
});
