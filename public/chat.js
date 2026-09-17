const socket = io();

// ===============================
// DOM ELEMENTS
// ===============================

const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');

const usernameInput = document.getElementById('usernameInput');
const joinButton = document.getElementById('joinButton');

const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

const messages = document.getElementById('messages');

const leftUserList = document.getElementById('leftUserList');
const rightUserList = document.getElementById('rightUserList');
const staffUserList = document.getElementById('staffUserList');

const logoutButton = document.getElementById('logoutButton');

// ===============================
// PRIVATE CHAT ELEMENTS
// ===============================

const privateChatModal =
    document.getElementById('privateChatModal');

const privateUsername =
    document.getElementById('privateUsername');

const privateMessages =
    document.getElementById('privateMessages');

const privateMessageInput =
    document.getElementById('privateMessageInput');

const privateSendButton =
    document.getElementById('privateSendButton');

const closePrivateChat =
    document.getElementById('closePrivateChat');

// ===============================
// VARIABLES
// ===============================

let username = '';
let privateChatUser = '';

const OWNER_USERNAME = 'Spidy 007';

function normalizeUsername(name) {
    return String(name || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function getRank(user) {
    if (
        normalizeUsername(user) ===
        normalizeUsername(OWNER_USERNAME)
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
    loginScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');

    messageInput.focus();
}

// ===============================
// SHOW LOGIN
// ===============================

function showLogin() {
    chatScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
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

    localStorage.setItem(
        'spidy_username',
        username
    );

    socket.emit(
        'join',
        username
    );
}

// ===============================
// LOGIN EVENTS
// ===============================

joinButton.addEventListener(
    'click',
    joinChat
);

usernameInput.addEventListener(
    'keydown',
    function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            joinChat();
        }
    }
);

// ===============================
// SOCKET CONNECT
// ===============================

socket.on(
    'connect',
    function() {
        console.log(
            'Connected to server:',
            socket.id
        );

        const savedUsername =
            localStorage.getItem(
                'spidy_username'
            );

        if (savedUsername) {
            username = savedUsername;

            socket.emit(
                'join',
                savedUsername
            );
        }
    }
);

// ===============================
// JOIN SUCCESS
// ===============================

socket.on(
    'joinSuccess',
    function(data) {
        if (!data || !data.username) {
            return;
        }

        username = data.username;

        localStorage.setItem(
            'spidy_username',
            username
        );

        showChat();
    }
);

// ===============================
// JOIN ERROR
// ===============================

socket.on(
    'joinError',
    function(message) {
        console.log(
            'Join error:',
            message
        );

        localStorage.removeItem(
            'spidy_username'
        );

        username = '';

        alert(
            message ||
            'Unable to join chat.'
        );

        showLogin();
        usernameInput.focus();
    }
);

// ===============================
// MAIN ROOM
// ===============================

sendButton.addEventListener(
    'click',
    sendMessage
);

messageInput.addEventListener(
    'keydown',
    function(event) {
        if (
            event.key === 'Enter' &&
            !event.shiftKey
        ) {
            event.preventDefault();
            sendMessage();
        }
    }
);

// ===============================
// SEND MESSAGE
// ===============================

function sendMessage() {
    const message =
        messageInput.value.trim();

    if (!message) {
        return;
    }

    // ===============================
    // /CLEAR COMMAND
    // ===============================

    if (message.toLowerCase() === "/clear") {

        if (
            normalizeUsername(username) !==
            normalizeUsername(OWNER_USERNAME)
        ) {
            addSystemMessage(
                "Only the Owner can clear the room."
            );

            messageInput.value = "";
            messageInput.focus();

            return;
        }

        socket.emit("clearRoom");

        messageInput.value = "";
        messageInput.focus();

        return;
    }

    // ===============================
    // NORMAL MESSAGE
    // ===============================

    socket.emit("chatMessage", {
        message: message
    });

    messageInput.value = "";
    messageInput.focus();
}

// ===============================
// RECEIVE MAIN CHAT
// ===============================

socket.on(
    'chatMessage',
    function(data) {
        if (!data ||
            typeof data !== 'object'
        ) {
            return;
        }

        addMessage(
            data.username || 'User',
            data.message || '',
            data.time || ''
        );
    }
);

// ===============================
// CLEAR ROOM
// ===============================

socket.on(
    'clearRoom',
    function(data) {
        messages.innerHTML = '';

        const clearedBy =
            data && data.by ?
            data.by :
            'Owner';

        addSystemMessage(
            'Main room cleared by ' +
            clearedBy
        );
    }
);

// ===============================
// ADD MESSAGE
// ===============================

function addMessage(
    sender,
    message,
    time
) {
    const wrapper =
        document.createElement('div');

    wrapper.className = 'message';

    // Spider avatar
    const avatar =
        document.createElement('div');

    avatar.className =
        'message-avatar';

    avatar.title =
        sender;

    // Message content
    const content =
        document.createElement('div');

    content.className =
        'message-content';

    // Header
    const header =
        document.createElement('div');

    header.className =
        'message-header';

    const senderName =
        document.createElement('span');

    const rank =
        getRank(sender);

    senderName.className =
        'message-username ' +
        rank.className;

    senderName.textContent =
        rank.icon +
        ' ' +
        sender;

    const timeElement =
        document.createElement('span');

    timeElement.className =
        'message-time';

    timeElement.textContent =
        time || '';

    // Text
    const text =
        document.createElement('div');

    text.className =
        'message-text';

    text.textContent =
        message;

    // Build
    header.appendChild(
        senderName
    );

    header.appendChild(
        timeElement
    );

    content.appendChild(
        header
    );

    content.appendChild(
        text
    );

    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        content
    );

    messages.appendChild(
        wrapper
    );

    messages.scrollTop =
        messages.scrollHeight;
}

// ===============================
// SYSTEM MESSAGE
// ===============================

socket.on(
    'systemMessage',
    function(data) {
        if (!data) {
            return;
        }

        const text =
            data.message ||
            (
                (data.username ||
                    'Someone') +
                ' joined the room'
            );

        addSystemMessage(
            text
        );
    }
);

// ===============================
// ADD SYSTEM MESSAGE
// ===============================

function addSystemMessage(
    message
) {
    const element =
        document.createElement('div');

    element.className =
        'system-message';

    element.textContent =
        '✦ ' + message;

    messages.appendChild(
        element
    );

    messages.scrollTop =
        messages.scrollHeight;
}

// ===============================
// USER LIST
// ===============================

socket.on(
    'userList',
    function(userList) {
        if (!Array.isArray(userList)) {
            return;
        }

        updateUserLists(
            userList
        );
    }
);

// ===============================
// UPDATE USER LISTS
// ===============================

function updateUserLists(
    userList
) {
    leftUserList.innerHTML = '';
    rightUserList.innerHTML = '';
    staffUserList.innerHTML = '';

    userList.forEach(
        function(user) {
            const rank =
                getRank(user);

            // Left
            leftUserList.appendChild(
                createUserElement(
                    user,
                    rank
                )
            );

            // Right
            rightUserList.appendChild(
                createUserElement(
                    user,
                    rank
                )
            );

            // Staff
            if (
                rank.name === 'Owner' ||
                rank.name === 'Admin' ||
                rank.name === 'Moderator'
            ) {
                staffUserList.appendChild(
                    createUserElement(
                        user,
                        rank
                    )
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
    const item =
        document.createElement('div');

    item.className =
        'online-user';

    const left =
        document.createElement('div');

    left.className =
        'online-user-left';

    // Spider avatar
    const avatar =
        document.createElement('div');

    avatar.className =
        'user-avatar';

    avatar.title =
        user;

    // Online dot
    const dot =
        document.createElement('span');

    dot.className =
        'online-dot';

    // Name
    const name =
        document.createElement('span');

    name.className =
        'online-name';

    name.textContent =
        user;

    left.appendChild(
        avatar
    );

    left.appendChild(
        dot
    );

    left.appendChild(
        name
    );

    // Rank
    const badge =
        document.createElement('span');

    badge.className =
        'rank-badge ' +
        rank.className;

    badge.textContent =
        rank.icon +
        ' ' +
        rank.name;

    item.appendChild(
        left
    );

    item.appendChild(
        badge
    );

    // Private chat
    item.addEventListener(
        'click',
        function() {
            if (
                String(user).toLowerCase() ===
                username.toLowerCase()
            ) {
                return;
            }

            openPrivateChat(
                user
            );
        }
    );

    return item;
}

// ===============================
// OPEN PRIVATE CHAT
// ===============================

function openPrivateChat(
    user
) {
    if (!user) {
        return;
    }

    privateChatUser =
        String(user);

    privateUsername.textContent =
        privateChatUser;

    privateMessages.innerHTML =
        '';

    privateChatModal.classList.remove(
        'hidden'
    );

    privateMessageInput.focus();
}

// ===============================
// CLOSE PRIVATE CHAT
// ===============================

closePrivateChat.addEventListener(
    'click',
    function() {
        privateChatModal.classList.add(
            'hidden'
        );

        privateChatUser = '';

        privateMessages.innerHTML =
            '';
    }
);

// ===============================
// PRIVATE CHAT SEND
// ===============================

privateSendButton.addEventListener(
    'click',
    sendPrivateMessage
);

privateMessageInput.addEventListener(
    'keydown',
    function(event) {
        if (event.key === 'Enter') {
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
        'privateMessage', {
            to: privateChatUser,
            message: message
        }
    );

    privateMessageInput.value =
        '';

    privateMessageInput.focus();
}

// ===============================
// RECEIVE PRIVATE MESSAGE
// ===============================

socket.on(
    'privateMessage',
    function(data) {
        if (!data) {
            return;
        }

        const sender =
            String(
                data.from || ''
            );

        const receiver =
            String(
                data.to || ''
            );

        // Open automatically
        if (
            privateChatModal.classList.contains(
                'hidden'
            )
        ) {
            if (
                sender &&
                sender.toLowerCase() !==
                username.toLowerCase()
            ) {
                openPrivateChat(
                    sender
                );
            }
        }

        if (!privateChatUser) {
            return;
        }

        const currentChat =
            privateChatUser.toLowerCase();

        const fromMatches =
            sender.toLowerCase() ===
            currentChat;

        const toMatches =
            receiver.toLowerCase() ===
            currentChat;

        if (!fromMatches &&
            !toMatches
        ) {
            return;
        }

        addPrivateMessage(
            sender,
            data.message || '',
            data.time || ''
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
    const element =
        document.createElement('div');

    element.className =
        'private-message';

    const senderName =
        document.createElement('strong');

    senderName.textContent =
        sender;

    const text =
        document.createElement('span');

    text.textContent =
        ' ' + message;

    const timeElement =
        document.createElement('small');

    timeElement.textContent =
        time || '';

    element.appendChild(
        senderName
    );

    element.appendChild(
        text
    );

    element.appendChild(
        timeElement
    );

    privateMessages.appendChild(
        element
    );

    privateMessages.scrollTop =
        privateMessages.scrollHeight;
}

// ===============================
// PRIVATE ERROR
// ===============================

socket.on(
    'privateError',
    function(data) {
        if (!data) {
            return;
        }

        addSystemMessage(
            data.message ||
            'Private message could not be sent.'
        );
    }
);

// ===============================
// LOGOUT
// ===============================

logoutButton.addEventListener(
    'click',
    function() {
        localStorage.removeItem(
            'spidy_username'
        );

        username = '';
        privateChatUser = '';

        socket.emit(
            'logout'
        );

        showLogin();

        usernameInput.value = '';

        messages.innerHTML =
            '';

        privateMessages.innerHTML =
            '';

        privateChatModal.classList.add(
            'hidden'
        );
    }
);

// ===============================
// SOCKET DISCONNECT
// ===============================

socket.on(
    'disconnect',
    function() {
        console.log(
            'Disconnected from server.'
        );
    }
);

// ===============================
// SOCKET ERROR
// ===============================

socket.on(
    'connect_error',
    function(error) {
        console.error(
            'Socket connection error:',
            error
        );
    }
);
