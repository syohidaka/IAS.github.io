document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const id = document.getElementById("loginId").value.trim();
    const pass = document.getElementById("loginPassword").value.trim();
    const message = document.getElementById("login-message");

    // ローカルデータ取得
    const students = JSON.parse(localStorage.getItem("students")) || [];

    // 該当の学生を検索
    const student = students.find(s => s.id === id && s.password === pass);

    if (student) {
        // ログイン情報を保存
        localStorage.setItem("loggedInStudent", JSON.stringify(student));
        window.location.href = "student_attendance.html";
    } else {
        message.textContent = "ID またはパスワードが違います。";
        message.style.color = "red";
    }
});
