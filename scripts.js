// 获取弹窗元素
var profileModal = document.getElementById("profileModal");
var editModal = document.getElementById("editModal");

// 获取 <span> 元素，用于关闭弹窗
var closeButtons = document.getElementsByClassName("close");

// 获取保存按钮
var saveButton = document.getElementById("saveProfile");

// 打开个人信息弹窗的函数
function openProfileModal() {
    profileModal.style.display = "flex";
}

// 打开编辑弹窗的函数
function openEditModal() {
    editModal.style.display = "flex";
    profileModal.style.display = "none";
}

// 关闭弹窗的函数
function closeModal() {
    profileModal.style.display = "none";
    editModal.style.display = "none";
}

// 点击保存按钮时更新信息
saveButton.onclick = function() {
    var username = document.getElementById("username").value;
    var avatarInput = document.getElementById("avatar");
    var avatarFile = avatarInput.files[0];

    if (avatarFile) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var avatarUrl = e.target.result;
            document.getElementById("displayAvatar").src = avatarUrl;
            document.getElementById("sidebarAvatar").src = avatarUrl;
        }
        reader.readAsDataURL(avatarFile);
    }

    // 更新展示的用户名
    document.getElementById("displayUsername").innerText = "Nickname：" + username;
    document.getElementById("sidebarUsername").innerText = username;

    // 关闭弹窗
    editModal.style.display = "none";
}

// 点击其他地方关闭弹窗
window.onclick = function(event) {
    if (event.target == profileModal) {
        profileModal.style.display = "none";
    }
    if (event.target == editModal) {
        editModal.style.display = "none";
    }
}