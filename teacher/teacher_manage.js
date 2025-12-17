// ① ダミーの教員データ（本番は管理者登録画面で追加）
if (!localStorage.getItem("teachers")) {
    const defaultTeachers = [
        { id: "T001", name: "馬場先生" },
        { id: "T002", name: "橘高先生" }
    ];
    localStorage.setItem("teachers", JSON.stringify(defaultTeachers));
}

// ② テーブルへ表示
function loadTeachers() {
    const teachers = JSON.parse(localStorage.getItem("teachers") || "[]");
    const list = document.getElementById("teacher-list");

    list.innerHTML = "";
    teachers.forEach(t => {
        const row = `
            <tr>
                <td>${t.id}</td>
                <td>${t.name}</td>
            </tr>
        `;
        list.insertAdjacentHTML("beforeend", row);
    });
}

loadTeachers();

// ③ CSV出力
document.getElementById("exportBtn").addEventListener("click", () => {
    const teachers = JSON.parse(localStorage.getItem("teachers") || "[]");

    if (teachers.length === 0) {
        alert("教員データがありません。");
        return;
    }

    // CSVヘッダー
    let csv = "teacher_id,teacher_name\n";

    // CSV内容
    teachers.forEach(t => {
        csv += `${t.id},${t.name}\n`;
    });

    // ダウンロード処理
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "teachers.csv";
    a.click();
});
