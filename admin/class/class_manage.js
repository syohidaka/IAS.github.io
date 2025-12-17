function loadClasses() {
    const classes = JSON.parse(localStorage.getItem("classes") || "[]");
    const list = document.getElementById("classList");
    list.innerHTML = "";

    classes.forEach((c, index) => {
        list.innerHTML += `
            <tr>
                <td>${c.id}</td>
                <td>${c.name}</td>

                <td>
                    <button class="btn btn-edit" onclick="editClass(${index})">
                        編集
                    </button>
                </td>

                <td>
                    <button class="btn btn-member" onclick="editMember(${index})">
                        生徒
                    </button>
                </td>

                <td>
                    <button class="btn btn-delete" onclick="deleteClass(${index})">
                        削除
                    </button>
                </td>
            </tr>
        `;
    });
}

// クラス追加ページへ
function addClass() {
    window.location.href = "class_add.html";
}

// 編集ページへ
function editClass(index) {
    localStorage.setItem("editClassIndex", index);
    window.location.href = "class_edit.html";
}

// 生徒（クラスメンバー）一覧へ
// 修正版 class_manage.js
function editMember(index) {
    const classes = JSON.parse(localStorage.getItem("classes") || "[]");
    const cls = classes[index];
    if (!cls) return;

    // どのクラスかを次の画面に渡す
    sessionStorage.setItem("selectedClassId", cls.id);

    // class_manage.html は admin/class/ の中にあるので 1 つ上へ戻る
    // => project/admin/admin_student_members.html を開く
    location.href = "../admin_student_members.html";
}

// 削除
function deleteClass(index) {
    if (!confirm("本当に削除しますか？")) return;

    let classes = JSON.parse(localStorage.getItem("classes") || "[]");
    classes.splice(index, 1);
    localStorage.setItem("classes", JSON.stringify(classes));

    loadClasses();
}

// 初期表示
loadClasses();
