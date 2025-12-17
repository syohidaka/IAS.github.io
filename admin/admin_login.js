document.getElementById("adminLoginForm").addEventListener("submit", (e) => {
    e.preventDefault(); // ← ページが勝手にリロードされるのを防ぐ

    const id = document.getElementById("adminId").value;
    const pass = document.getElementById("adminPass").value;

    const admin = {
        id: "admin",
        pass: "1234",
        name: "管理者"
    };

    if (id === admin.id && pass === admin.pass) {
        sessionStorage.setItem("adminName", admin.name);

        // ★ ここを追加！
        sessionStorage.setItem("role", "admin");

        alert("ログイン成功！");
        location.href = "admin_menu.html";
    } else {
        alert("ID またはパスワードが違います。");
    }
});
