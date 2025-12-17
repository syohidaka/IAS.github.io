// ===========================
// 学生データを localStorage で管理
// ===========================

// 学生一覧を取得
function getStudents() {
    return JSON.parse(localStorage.getItem("students")) || [];
}

// 学生を保存
function saveStudents(students) {
    localStorage.setItem("students", JSON.stringify(students));
}

// 学生を追加（管理者用）
function addStudent(id, name, password, className) {
    const students = getStudents();

    // ID 重複チェック
    if (students.some(s => s.id === id)) {
        return { success: false, message: "このIDは既に登録されています" };
    }

    students.push({
        id,
        name,
        password,
        className
    });

    saveStudents(students);
    return { success: true };
}

// ログイン処理（学生用）
function loginStudent(id, pw) {
    const students = getStudents();
    const student = students.find(s => s.id === id && s.password === pw);

    if (!student) return null;

    // ログイン状態を保存
    localStorage.setItem("loggedInStudent", JSON.stringify(student));
    return student;
}

// ログイン中の学生を取得
function getLoggedInStudent() {
    return JSON.parse(localStorage.getItem("loggedInStudent"));
}

// ログアウト
function logoutStudent() {
    localStorage.removeItem("loggedInStudent");
}
