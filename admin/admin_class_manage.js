// -------------------------
// データ読み込み
// -------------------------
function loadData() {
    return {
        students: JSON.parse(localStorage.getItem("students") || "[]"),
        classes: JSON.parse(localStorage.getItem("classes") || "[]"),
    };
}

// -------------------------
// クラス一覧表示
// -------------------------
function displayClassList() {
    const { classes } = loadData();
    const tbody = document.getElementById("classTableBody");
    tbody.innerHTML = "";

    classes.forEach(cls => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${cls.id}</td>
            <td>${cls.name}</td>
            <td><button class="edit-btn" onclick="editClass('${cls.id}')">編集</button></td>
            <td><button class="member-btn" onclick="goMembers('${cls.id}')">メンバー</button></td>
            <td><button class="delete-btn" onclick="deleteClass('${cls.id}')">削除</button></td>
        `;

        tbody.appendChild(tr);
    });
}

displayClassList();

// -------------------------
// クラス追加
// -------------------------
document.getElementById("addClassBtn").addEventListener("click", function () {
    const classId = prompt("クラスIDを入力（例：C002）");
    const className = prompt("クラス名を入力（例：2-CS）");

    if (!classId || !className) return;

    const { classes } = loadData();

    // ID重複チェック
    if (classes.some(c => c.id === classId)) {
        alert("このクラスIDは既に存在します！");
        return;
    }

    // 新規クラス追加（必ず members: [] を付与）
    const newClass = {
        id: classId,
        name: className,
        members: []
    };

    classes.push(newClass);
    localStorage.setItem("classes", JSON.stringify(classes));

    alert("クラスを追加しました！");
    displayClassList();
});

// -------------------------
// メンバー管理画面へ遷移
// -------------------------
function goMembers(classId) {
    localStorage.setItem("selectedClassId", classId);
    window.location.href = "admin_class_members.html";
}

// -------------------------
// クラス編集（名称変更のみ簡易）
// -------------------------
function editClass(id) {
    const { classes } = loadData();
    const target = classes.find(c => c.id === id);

    const newName = prompt("新しいクラス名を入力", target.name);
    if (!newName) return;

    target.name = newName;
    localStorage.setItem("classes", JSON.stringify(classes));

    alert("クラス名を更新しました！");
    displayClassList();
}

// -------------------------
// クラス削除
// -------------------------
function deleteClass(id) {
    if (!confirm("本当に削除しますか？\n※クラスの所属学生は解除されます")) return;

    let { students, classes } = loadData();

    // 対象クラスの生徒から class を解除
    students = students.map(s => {
        if (s.class === id) s.class = "";
        return s;
    });
    localStorage.setItem("students", JSON.stringify(students));

    // クラス削除
    classes = classes.filter(c => c.id !== id);
    localStorage.setItem("classes", JSON.stringify(classes));

    alert("クラスを削除しました。");
    displayClassList();
}
