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
let quotedMessage = null;

const OWNER_USERNAME = 'Spidy 007';

// ===============================
// QUOTE UI STYLE
// ===============================

const quoteStyle = document.createElement('style');

quoteStyle.textContent = `
    .message-actions {
        display: flex;
        gap: 6px;
        margin-top: 7px;
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .message:hover .message-actions {
        opacity: 1;
    }

    .message-action-btn {
        border: 0;
        border-radius: 8px;
        padding: 4px 9px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        background: rgba(255,255,255,0.08);
        color: #ffffff;
    }

    .message-action-btn:hover {
        background: rgba(255,255,255,0.18);
    }

    .delete-message-btn {
        color: #ff6b6b;
    }

    .quote-message-btn {
        color: #8ecbff;
    }

    .quoted-message {
        margin-bottom: 8px;
        padding: 7px 10px;
        border-left: 3px solid #007bff;
        border-radius: 6px;
        background: rgba(255,255,255,0.07);
        font-size: 12px;
        opacity: 0.9;
    }

    .quoted-message-user {
        font-weight: 700;
        margin-bottom: 2px;
    }

    .quoted-message-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .quote-preview {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 9px 12px;
        margin-bottom: 8px;
        border-left: 3px solid #007bff;
        border-radius: 7px;
        background: rgba(0,123,255,0.10);
        color: #ffffff;
    }

    .quote-preview-content {
        min-width: 0;
        flex: 1;
    }

    .quote-preview-title {
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 2px;
    }

    .quote-preview-text {
        font-size: 12px;
        opacity: 0.8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .cancel-quote-btn {
        border: 0;
        background: transparent;
        color: #ff6b6b;
        cursor: pointer;
        font-size: 18px;
        padding: 2px 6px;
    }

    .message-deleted {
        opacity: 0.4;
    }
`;

document.head.appendChild(
    quoteStyle
);

// ===============================
// USERNAME NORMALIZER
// ===============================

function normalizeUsername(name) {

    return String(name || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

// ===============================
// GET RANK
// ===============================

function getRank(user) {

    if (
        normalizeUsername(user) ===
        normalizeUsername(OWNER_USERNAME)
    ) {

        return {
            name: 'Owner',
            icon: '👑',
            className: 'owner'
        };
    }

    return {
        name: 'User',
        icon: '👤',
        className: 'user'
    };
}

// ===============================
// SHOW CHAT
// ===============================

function showChat() {

    loginScreen.classList.add('hidden');

    chatScreen.classList.remove('hidden');

    setTimeout(function() {

        messageInput.focus();

    }, 100);
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

    username =
        enteredUsername;

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

            username =
                savedUsername;

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

        if (
            !data ||
            !data.username
        ) {
            return;
        }

        username =
            data.username;

        localStorage.setItem(
            'spidy_username',
            username
        );

        showChat();

        console.log(
            'Login restored:',
            username
        );
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
// MAIN ROOM EVENTS
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
// SEND MAIN MESSAGE
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

    if (
        message.toLowerCase() ===
        '/clear'
    ) {

        if (
            normalizeUsername(username) !==
            normalizeUsername(OWNER_USERNAME)
        ) {

            addSystemMessage(
                'Only the Owner can clear the room.'
            );

            messageInput.value = '';

            messageInput.focus();

            return;
        }

        socket.emit(
            'clearRoom'
        );

        messageInput.value = '';

        messageInput.focus();

        return;
    }

    // ===============================
    // MESSAGE DATA
    // ===============================

    const messageData = {
        message: message
    };

    // ===============================
    // ADD QUOTE
    // ===============================

    if (quotedMessage) {

        messageData.quote = {

            id:
                quotedMessage.id,

            username:
                quotedMessage.username,

            message:
                quotedMessage.message
        };
    }

    // ===============================
    // SEND
    // ===============================

    socket.emit(
        'chatMessage',
        messageData
    );

    // ===============================
    // CLEAR INPUT
    // ===============================

    messageInput.value = '';

    clearQuote();

    messageInput.focus();
}

// ===============================
// RECEIVE NEW MAIN MESSAGE
// ===============================

socket.on(
    'chatMessage',
    function(data) {

        if (
            !data ||
            typeof data !== 'object'
        ) {
            return;
        }

        addMessage(data);
    }
);

// ===============================
// RESTORE CHAT HISTORY
// ===============================

socket.on(
    'chatHistory',
    function(history) {

        if (!Array.isArray(history)) {

            console.log(
                'No chat history received.'
            );

            return;
        }

        console.log(
            'Chat history received:',
            history.length,
            'messages'
        );

        messages.innerHTML = '';

        history.forEach(
            function(data) {

                if (
                    !data ||
                    !data.message
                ) {
                    return;
                }

                addMessage(data);
            }
        );

        messages.scrollTop =
            messages.scrollHeight;
    }
);

// ===============================
// YOUTUBE VIDEO ID DETECTOR
// ===============================

function getYouTubeVideoId(message) {

    if (!message) {
        return null;
    }

    const text =
        String(message).trim();

    const patterns = [

        // youtube.com/watch?v=XXXXXXXXXXX
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^\s#]*&)?v=([A-Za-z0-9_-]{11})(?:[^\s]*)?/i,

        // youtu.be/XXXXXXXXXXX
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&#][^\s]*)?/i,

        // youtube.com/shorts/XXXXXXXXXXX
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})(?:[?&#][^\s]*)?/i
    ];

    for (
        const pattern of patterns
    ) {

        const match =
            text.match(pattern);

        if (
            match &&
            match[1]
        ) {

            return match[1];
        }
    }

    return null;
}

// ===============================
// CREATE YOUTUBE PREVIEW
// ===============================

function createYouTubePreview(videoId) {

    if (!videoId) {
        return null;
    }

    const preview =
        document.createElement('div');

    preview.className =
        'youtube-preview';

    const iframe =
        document.createElement('iframe');

    iframe.src =
        'https://www.youtube.com/embed/' +
        encodeURIComponent(videoId) +
        '?rel=0';

    iframe.title =
        'YouTube video';

    iframe.loading =
        'lazy';

    iframe.referrerPolicy =
        'strict-origin-when-cross-origin';

    iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

    iframe.allowFullscreen =
        true;

    preview.appendChild(
        iframe
    );

    return preview;
}

// ===============================
// ADD MAIN MESSAGE
// ===============================

function addMessage(data) {

    if (!data) {
        return;
    }

    const sender =
        data.username || 'User';

    const message =
        data.message || '';

    const time =
        data.time || '';

    const messageId =
        data.id || '';

    // ===============================
    // MESSAGE WRAPPER
    // ===============================

    const wrapper =
        document.createElement('div');

    if (
        normalizeUsername(sender) ===
        normalizeUsername(username)
    ) {

        wrapper.className =
            'message mine';

    } else {

        wrapper.className =
            'message';
    }

    // ===============================
    // STORE MESSAGE ID
    // ===============================

    if (messageId) {

        wrapper.dataset.messageId =
            messageId;
    }

    // ===============================
    // AVATAR
    // ===============================

    const avatar =
        document.createElement('div');

    avatar.className =
        'message-avatar';

    avatar.title =
        sender;

    // ===============================
    // CONTENT
    // ===============================

    const content =
        document.createElement('div');

    content.className =
        'message-content';

    // ===============================
    // HEADER
    // ===============================

    const header =
        document.createElement('div');

    header.className =
        'message-header';

    // ===============================
    // USERNAME
    // ===============================

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

    // ===============================
    // TIME
    // ===============================

    const timeElement =
        document.createElement('span');

    timeElement.className =
        'message-time';

    timeElement.textContent =
        time;

    // ===============================
    // QUOTED MESSAGE
    // ===============================

    if (
        data.quote &&
        data.quote.message
    ) {

        const quotedBox =
            document.createElement('div');

        quotedBox.className =
            'quoted-message';

        const quotedUser =
            document.createElement('div');

        quotedUser.className =
            'quoted-message-user';

        quotedUser.textContent =
            data.quote.username ||
            'User';

        const quotedText =
            document.createElement('div');

        quotedText.className =
            'quoted-message-text';

        quotedText.textContent =
            data.quote.message;

        quotedBox.appendChild(
            quotedUser
        );

        quotedBox.appendChild(
            quotedText
        );

        content.appendChild(
            quotedBox
        );
    }

    // ===============================
    // MESSAGE TEXT
    // ===============================

    const text =
        document.createElement('div');

    text.className =
        'message-text';

    // ===============================
    // YOUTUBE DETECTION
    // ===============================

    const youtubeVideoId =
        getYouTubeVideoId(message);

    const youtubePreview =
        createYouTubePreview(
            youtubeVideoId
        );

    // ===============================
    // HIDE YOUTUBE LINK
    // ===============================

    if (youtubeVideoId) {

        // YouTube URL hide rahega
        text.style.display =
            'none';

    } else {

        // Normal message show hoga
        text.textContent =
            message;
    }

    // ===============================
    // MESSAGE ACTIONS
    // ===============================

    const actions =
        document.createElement('div');

    actions.className =
        'message-actions';

    // ===============================
    // QUOTE BUTTON
    // ===============================

    if (
        normalizeUsername(sender) !==
        normalizeUsername(username)
    ) {

        const quoteButton =
            document.createElement('button');

        quoteButton.type =
            'button';

        quoteButton.className =
            'message-action-btn quote-message-btn';

        quoteButton.textContent =
            '↩ Quote';

        quoteButton.addEventListener(
            'click',
            function(event) {

                event.stopPropagation();

                if (!messageId) {
                    return;
                }

                setQuote({

                    id:
                        messageId,

                    username:
                        sender,

                    message:
                        message
                });
            }
        );

        actions.appendChild(
            quoteButton
        );
    }

    // ===============================
    // DELETE BUTTON
    // ===============================

    if (
        normalizeUsername(sender) ===
        normalizeUsername(username)
    ) {

        const deleteButton =
            document.createElement('button');

        deleteButton.type =
            'button';

        deleteButton.className =
            'message-action-btn delete-message-btn';

        deleteButton.textContent =
            '🗑 Delete';

        deleteButton.addEventListener(
            'click',
            function(event) {

                event.stopPropagation();

                if (!messageId) {
                    return;
                }

                socket.emit(
                    'deleteMessage',
                    messageId
                );
            }
        );

        actions.appendChild(
            deleteButton
        );
    }

    // ===============================
    // BUILD HEADER
    // ===============================

    header.appendChild(
        senderName
    );

    header.appendChild(
        timeElement
    );

    // ===============================
    // BUILD CONTENT
    // ===============================

    content.appendChild(
        header
    );

    content.appendChild(
        text
    );

    // ===============================
    // ADD YOUTUBE PREVIEW
    // ===============================

    if (youtubePreview) {

        content.appendChild(
            youtubePreview
        );
    }

    if (
        actions.children.length > 0
    ) {

        content.appendChild(
            actions
        );
    }

    // ===============================
    // BUILD WRAPPER
    // ===============================

    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        content
    );

    messages.appendChild(
        wrapper
    );

    // ===============================
    // AUTO SCROLL
    // ===============================

    messages.scrollTop =
        messages.scrollHeight;
}

// ===============================
// SET QUOTE
// ===============================

function setQuote(messageData) {

    if (!messageData) {
        return;
    }

    quotedMessage =
        messageData;

    // Remove old preview

    const oldPreview =
        document.getElementById(
            'quotePreview'
        );

    if (oldPreview) {
        oldPreview.remove();
    }

    // ===============================
    // CREATE PREVIEW
    // ===============================

    const preview =
        document.createElement('div');

    preview.id =
        'quotePreview';

    preview.className =
        'quote-preview';

    const previewContent =
        document.createElement('div');

    previewContent.className =
        'quote-preview-content';

    const title =
        document.createElement('div');

    title.className =
        'quote-preview-title';

    title.textContent =
        '↩ Replying to ' +
        messageData.username;

    const previewText =
        document.createElement('div');

    previewText.className =
        'quote-preview-text';

    previewText.textContent =
        messageData.message;

    previewContent.appendChild(
        title
    );

    previewContent.appendChild(
        previewText
    );

    // ===============================
    // CANCEL BUTTON
    // ===============================

    const cancelButton =
        document.createElement('button');

    cancelButton.type =
        'button';

    cancelButton.className =
        'cancel-quote-btn';

    cancelButton.textContent =
        '×';

    cancelButton.title =
        'Cancel quote';

    cancelButton.addEventListener(
        'click',
        clearQuote
    );

    preview.appendChild(
        previewContent
    );

    preview.appendChild(
        cancelButton
    );

    // ===============================
    // INSERT BEFORE INPUT
    // ===============================

    const inputParent =
        messageInput.parentElement;

    if (inputParent) {

        inputParent.parentElement.insertBefore(
            preview,
            inputParent
        );
    }

    messageInput.focus();
}

// ===============================
// CLEAR QUOTE
// ===============================

function clearQuote() {

    quotedMessage =
        null;

    const preview =
        document.getElementById(
            'quotePreview'
        );

    if (preview) {
        preview.remove();
    }
}

// ===============================
// MESSAGE DELETED
// ===============================

socket.on(
    'messageDeleted',
    function(data) {

        if (
            !data ||
            !data.id
        ) {
            return;
        }

        const messageId =
            String(data.id);

        const messageElement =
            messages.querySelector(
                '[data-message-id="' +
                messageId +
                '"]'
            );

        if (messageElement) {

            messageElement.remove();
        }

        // If currently selected quote was deleted

        if (
            quotedMessage &&
            String(quotedMessage.id) ===
            messageId
        ) {

            clearQuote();
        }
    }
);

// ===============================
// DELETE ERROR
// ===============================

socket.on(
    'deleteError',
    function(data) {

        if (!data) {
            return;
        }

        addSystemMessage(
            data.message ||
            'Message could not be deleted.'
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

        clearQuote();

        const clearedBy =
            data && data.by
                ? data.by
                : 'Owner';

        addSystemMessage(
            'Main room cleared by ' +
            clearedBy
        );
    }
);

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
        '✦ ' +
        message;

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

        if (
            !Array.isArray(userList)
        ) {
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

            // LEFT

            leftUserList.appendChild(
                createUserElement(
                    user,
                    rank
                )
            );

            // RIGHT

            rightUserList.appendChild(
                createUserElement(
                    user,
                    rank
                )
            );

            // STAFF

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

    // ===============================
    // AVATAR
    // ===============================

    const avatar =
        document.createElement('div');

    avatar.className =
        'user-avatar';

    avatar.title =
        user;

    // ===============================
    // ONLINE DOT
    // ===============================

    const dot =
        document.createElement('span');

    dot.className =
        'online-dot';

    // ===============================
    // NAME
    // ===============================

    const name =
        document.createElement('span');

    name.className =
        'online-name';

    name.textContent =
        user;

    // ===============================
    // BUILD LEFT
    // ===============================

    left.appendChild(
        avatar
    );

    left.appendChild(
        dot
    );

    left.appendChild(
        name
    );

    // ===============================
    // RANK
    // ===============================

    const badge =
        document.createElement('span');

    badge.className =
        'rank-badge ' +
        rank.className;

    badge.textContent =
        rank.icon +
        ' ' +
        rank.name;

    // ===============================
    // BUILD USER
    // ===============================

    item.appendChild(
        left
    );

    item.appendChild(
        badge
    );

    // ===============================
    // PRIVATE CHAT
    // ===============================

    item.addEventListener(
        'click',
        function() {

            if (
                normalizeUsername(user) ===
                normalizeUsername(username)
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
// PRIVATE CHAT EVENTS
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

    if (
        !message ||
        !privateChatUser
    ) {
        return;
    }

    socket.emit(
        'privateMessage',
        {
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

        // ===============================
        // AUTO OPEN
        // ===============================

        if (
            privateChatModal.classList.contains(
                'hidden'
            )
        ) {

            if (
                sender &&
                normalizeUsername(sender) !==
                normalizeUsername(username)
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
            normalizeUsername(
                privateChatUser
            );

        const fromMatches =
            normalizeUsername(sender) ===
            currentChat;

        const toMatches =
            normalizeUsername(receiver) ===
            currentChat;

        if (
            !fromMatches &&
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
        ' ' +
        message;

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

        clearQuote();

        socket.emit(
            'logout'
        );

        showLogin();

        usernameInput.value =
            '';

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
