const socket = io();

// ===============================
// DOM ELEMENTS
// ===============================

const loginScreen = document.getElementById("loginScreen");
const chatScreen = document.getElementById("chatScreen");

const usernameInput = document.getElementById("usernameInput");
const joinButton = document.getElementById("joinButton");

const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const messages = document.getElementById("messages");

const leftUserList = document.getElementById("leftUserList");
const rightUserList = document.getElementById("rightUserList");
const staffUserList = document.getElementById("staffUserList");

const logoutButton = document.getElementById("logoutButton");


// ===============================
// PRIVATE CHAT ELEMENTS
// ===============================

const privateChatModal =
    document.getElementById("privateChatModal");

const privateUsername =
    document.getElementById("privateUsername");

const privateMessages =
    document.getElementById("privateMessages");

const privateMessageInput =
    document.getElementById("privateMessageInput");

const privateSendButton =
    document.getElementById("privateSendButton");

const closePrivateChat =
    document.getElementById("closePrivateChat");


// ===============================
// VARIABLES
// ===============================

let username = "";
let privateChatUser = "";


// ===============================
// OWNER
// ===============================

const OWNER_USERNAME = "Spidy007";


// ===============================
// GET USER RANK
// ===============================

function getRank(user) {

    if (
        user.toLowerCase() ===
        OWNER_USERNAME.toLowerCase()
    ) {
        return {
            name: "Owner",
            icon: "👑",
            className: "owner"
        };
    }

    return {
        name: "User",
        icon: "👤",
        className: "user"
    };
}


// ===============================
// SHOW CHAT
// ===============================
function showChat() {
    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");

    messageInput.focus();
}


// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {

    chatScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");
}


// ===============================
// JOIN CHAT
// ===============================

function joinChat() {

    const enteredUsername =
        usernameInput.value.trim();

    if (!enteredUsername) {

        usernameInput.focus();
        return;
    }

    username = enteredUsername;

    // Save username
    localStorage.setItem(
        "spidy_username",
        username
    );

    socket.emit("join", username);
}


// ===============================
// JOIN BUTTON
// ===============================

joinButton.addEventListener(
    "click",
    joinChat
);


// Enter key on login
usernameInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {
            joinChat();
        }

    }
);


// ===============================
// SOCKET CONNECT
// ===============================

socket.on("connect", () => {

    console.log("Connected to server.");

    const savedUsername =
        localStorage.getItem("spidy_username");

    if (savedUsername) {

        username = savedUsername;

        socket.emit(
            "join",
            savedUsername
        );
    }

});


// ===============================
// JOIN SUCCESS
// ===============================

socket.on("joinSuccess", (data) => {

    username = data.username;

    localStorage.setItem(
        "spidy_username",
        username
    );

    showChat();
});


// ===============================
// JOIN ERROR
// ===============================

socket.on(
    "joinError",
    (message) => {

        console.log(
            "Join error:",
            message
        );

        // Remove saved username if rejected
        localStorage.removeItem(
            "spidy_username"
        );

        username = "";

        alert(message);

        showLogin();

        usernameInput.focus();
    }
);


// ===============================
// MAIN ROOM CHAT
// ===============================

sendButton.addEventListener(
    "click",
    sendMessage
);


messageInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }

    }
);


// ===============================
// SEND MAIN ROOM MESSAGE
// ===============================

function sendMessage() {

    const message =
        messageInput.value.trim();

    if (!message) {
        return;
    }

    socket.emit(
        "chatMessage", {
            message: message
        }
    );

    messageInput.value = "";

    messageInput.focus();
}


// ===============================
// RECEIVE MAIN ROOM MESSAGE
// ===============================

socket.on(
    "chatMessage",
    (data) => {

        if (!data ||
            typeof data !== "object"
        ) {
            return;
        }

        addMessage(
            data.username || "User",
            data.message || "",
            data.time || ""
        );

    }
);


// ===============================
// ADD MESSAGE TO ROOM
// ===============================

function addMessage(
    sender,
    message,
    time
) {

    const messageWrapper =
        document.createElement("div");

    messageWrapper.className =
        "message-wrapper";


    const rank =
        getRank(sender);


    const messageBubble =
        document.createElement("div");

    messageBubble.className =
        "message-bubble";


    const messageHeader =
        document.createElement("div");

    messageHeader.className =
        "message-header";


    const senderName =
        document.createElement("span");

    senderName.className =
        `message-username ${rank.className}`;

    senderName.textContent =
        `${rank.icon} ${sender}`;


    const messageTime =
        document.createElement("span");

    messageTime.className =
        "message-time";

    messageTime.textContent =
        time;


    const messageText =
        document.createElement("div");

    messageText.className =
        "message-text";

    messageText.textContent =
        message;


    messageHeader.appendChild(
        senderName
    );

    messageHeader.appendChild(
        messageTime
    );

    messageBubble.appendChild(
        messageHeader
    );

    messageBubble.appendChild(
        messageText
    );

    messageWrapper.appendChild(
        messageBubble
    );

    messages.appendChild(
        messageWrapper
    );


    // Scroll to bottom
    messages.scrollTop =
        messages.scrollHeight;
}


// ===============================
// SYSTEM MESSAGE
// ===============================

socket.on(
    "systemMessage",
    (data) => {

        if (!data) {
            return;
        }

        addSystemMessage(
            data.message ||
            `${data.username || "Someone"} joined the room`
        );

    }
);


// ===============================
// ADD SYSTEM MESSAGE
// ===============================

function addSystemMessage(message) {

    const systemDiv =
        document.createElement("div");

    systemDiv.className =
        "system-message";

    systemDiv.textContent =
        `✦ ${message}`;

    messages.appendChild(
        systemDiv
    );

    messages.scrollTop =
        messages.scrollHeight;
}


// ===============================
// USER LIST
// ===============================

socket.on(
    "userList",
    (userList) => {

        updateUserLists(userList);

    }
);


// ===============================
// UPDATE USER LISTS
// ===============================

function updateUserLists(userList) {

    leftUserList.innerHTML = "";
    rightUserList.innerHTML = "";
    staffUserList.innerHTML = "";


    userList.forEach(
        (user) => {

            const rank =
                getRank(user);


            // LEFT USER
            const leftItem =
                createUserElement(
                    user,
                    rank
                );

            leftUserList.appendChild(
                leftItem
            );


            // RIGHT USER
            const rightItem =
                createUserElement(
                    user,
                    rank
                );

            rightUserList.appendChild(
                rightItem
            );


            // STAFF LIST
            if (
                rank.name === "Owner" ||
                rank.name === "Admin" ||
                rank.name === "Moderator"
            ) {

                const staffItem =
                    createUserElement(
                        user,
                        rank
                    );

                staffUserList.appendChild(
                    staffItem
                );
            }

        }
    );

}


// ===============================
// CREATE USER ELEMENT
// ===============================

function createUserElement(
    user,
    rank
) {

    const userItem =
        document.createElement("div");

    userItem.className =
        "online-user";


    const userLeft =
        document.createElement("div");

    userLeft.className =
        "online-user-left";


    const onlineDot =
        document.createElement("span");

    onlineDot.className =
        "online-dot";


    const name =
        document.createElement("span");

    name.className =
        "online-name";

    name.textContent =
        user;


    userLeft.appendChild(
        onlineDot
    );

    userLeft.appendChild(
        name
    );


    const rankBadge =
        document.createElement("span");

    rankBadge.className =
        `rank-badge ${rank.className}`;

    rankBadge.textContent =
        `${rank.icon} ${rank.name}`;


    userItem.appendChild(
        userLeft
    );

    userItem.appendChild(
        rankBadge
    );


    // Click user to open private chat
    userItem.addEventListener(
        "click",
        () => {

            if (
                user.toLowerCase() ===
                username.toLowerCase()
            ) {
                return;
            }

            openPrivateChat(user);

        }
    );


    return userItem;
}


// ===============================
// OPEN PRIVATE CHAT
// ===============================

function openPrivateChat(user) {

    privateChatUser = user;

    privateUsername.textContent =
        user;

    privateMessages.innerHTML = "";

    privateChatModal.classList.remove(
        "hidden"
    );

    privateMessageInput.focus();
}


// ===============================
// CLOSE PRIVATE CHAT
// ===============================

closePrivateChat.addEventListener(
    "click",
    () => {

        privateChatModal.classList.add(
            "hidden"
        );

        privateChatUser = "";

    }
);


// ===============================
// PRIVATE MESSAGE SEND
// ===============================

privateSendButton.addEventListener(
    "click",
    sendPrivateMessage
);


privateMessageInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendPrivateMessage();
        }

    }
);


// ===============================
// SEND PRIVATE MESSAGE
// ===============================

function sendPrivateMessage() {

    const message =
        privateMessageInput.value.trim();

    if (!message ||
        !privateChatUser
    ) {
        return;
    }

    socket.emit(
        "privateMessage", {
            to: privateChatUser,
            message: message
        }
    );

    privateMessageInput.value = "";

    privateMessageInput.focus();
}


// ===============================
// RECEIVE PRIVATE MESSAGE
// ===============================

socket.on(
    "privateMessage",
    (data) => {

        if (!data) {
            return;
        }

        // If private chat is not open,
        // open it automatically
        if (
            privateChatModal.classList.contains(
                "hidden"
            )
        ) {

            openPrivateChat(
                data.from
            );
        }


        // Only show messages for current chat
        if (
            data.from !== privateChatUser &&
            data.to !== privateChatUser
        ) {
            return;
        }


        addPrivateMessage(
            data.from,
            data.message,
            data.time
        );

    }
);


// ===============================
// ADD PRIVATE MESSAGE
// ===============================

function addPrivateMessage(
    sender,
    message,
    time
) {

    const div =
        document.createElement("div");

    div.className =
        "private-message";


    const senderName =
        document.createElement("strong");

    senderName.textContent =
        sender;


    const text =
        document.createElement("span");

    text.textContent =
        message;


    const messageTime =
        document.createElement("small");

    messageTime.textContent =
        time;


    div.appendChild(
        senderName
    );

    div.appendChild(
        text
    );

    div.appendChild(
        messageTime
    );


    privateMessages.appendChild(
        div
    );


    privateMessages.scrollTop =
        privateMessages.scrollHeight;
}


// ===============================
// PRIVATE ERROR
// ===============================

socket.on(
    "privateError",
    (data) => {

        if (!data) {
            return;
        }

        console.log(
            data.message
        );

    }
);


// ===============================
// LOGOUT
// ===============================

logoutButton.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "spidy_username"
        );

        username = "";

        socket.emit("logout");

        showLogin();

        usernameInput.value = "";

        messages.innerHTML = "";

        privateChatModal.classList.add(
            "hidden"
        );

    }
);


// ===============================
// SOCKET DISCONNECT
// ===============================

socket.on(
    "disconnect",
    () => {

        console.log(
            "Disconnected from server."
        );

    }
);
