
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
// UPLOAD ELEMENTS
// ===============================

const uploadInput = document.getElementById('uploadInput');
const uploadButton = document.getElementById('uploadButton');
const uploadStatus = document.getElementById('uploadStatus');

// ===============================
// PRIVATE CHAT ELEMENTS
// ===============================

const privateChatModal = document.getElementById('privateChatModal');
const privateUsername = document.getElementById('privateUsername');
const privateMessages = document.getElementById('privateMessages');
const privateMessageInput = document.getElementById('privateMessageInput');
const privateSendButton = document.getElementById('privateSendButton');
const closePrivateChat = document.getElementById('closePrivateChat');

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
    display:flex;
    gap:6px;
    margin-top:7px;
    opacity:0;
    transition:opacity .2s ease;
    flex-wrap:wrap;
}

.message:hover .message-actions {
    opacity:1;
}

.message-action-btn {
    border:0;
    border-radius:8px;
    padding:4px 9px;
    cursor:pointer;
    font-size:12px;
    font-weight:600;
    background:rgba(255,255,255,.08);
    color:#fff;
}

.message-action-btn:hover {
    background:rgba(255,255,255,.18);
}

.delete-message-btn { color:#ff6b6b; }
.quote-message-btn { color:#8ecbff; }

.quoted-message {
    margin-bottom:8px;
    padding:7px 10px;
    border-left:3px solid #007bff;
    border-radius:6px;
    background:rgba(255,255,255,.07);
    font-size:12px;
    opacity:.9;
}

.quoted-message-user {
    font-weight:700;
    margin-bottom:2px;
}

.quoted-message-text {
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
}

.quote-preview {
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:10px;
    padding:9px 12px;
    margin-bottom:8px;
    border-left:3px solid #007bff;
    border-radius:7px;
    background:rgba(0,123,255,.10);
    color:#fff;
}

.quote-preview-content {
    min-width:0;
    flex:1;
}

.quote-preview-title {
    font-size:12px;
    font-weight:700;
    margin-bottom:2px;
}

.quote-preview-text {
    font-size:12px;
    opacity:.8;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
}

.cancel-quote-btn {
    border:0;
    background:transparent;
    color:#ff6b6b;
    cursor:pointer;
    font-size:18px;
    padding:2px 6px;
}

.message-deleted { opacity:.4; }

.chat-upload-media {
    display:block;
    width:auto;
    max-width:min(360px,100%);
    max-height:320px;
    margin-top:8px;
    border:1px solid rgba(0,234,255,.35);
    border-radius:12px;
    object-fit:contain;
}

video.chat-upload-media {
    width:min(360px,100%);
    background:#000;
}

.youtube-preview {
    width:min(360px,100%);
    aspect-ratio:16/9;
    margin-top:8px;
    overflow:hidden;
    border:1px solid rgba(255,0,217,.4);
    border-radius:12px;
    background:#080812;
}

.youtube-preview iframe {
    display:block;
    width:100%;
    height:100%;
    border:0;
}

.message-text a {
    color:#00eaff;
    overflow-wrap:anywhere;
}

@media (max-width:600px) {
    .message-actions { opacity:1; }
    .chat-upload-media,
    .youtube-preview { max-width:100%; }
}
`;

document.head.appendChild(quoteStyle);

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

    setTimeout(function () {
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
    const enteredUsername = usernameInput.value.trim();

    if (!enteredUsername) {
        usernameInput.focus();
        return;
    }

    username = enteredUsername;

    localStorage.setItem('spidy_username', username);

    socket.emit('join', username);
}

// ===============================
// LOGIN EVENTS
// ===============================

joinButton.addEventListener('click', joinChat);

usernameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        joinChat();
    }
});

// ===============================
// SOCKET CONNECT
// ===============================

socket.on('connect', function () {
    console.log('Connected to server:', socket.id);

    const savedUsername = localStorage.getItem('spidy_username');

    if (savedUsername) {
        username = savedUsername;
        socket.emit('join', savedUsername);
    }
});

// ===============================
// JOIN SUCCESS
// ===============================

socket.on('joinSuccess', function (data) {
    if (!data || !data.username) return;

    username = data.username;

    localStorage.setItem('spidy_username', username);

    showChat();

    console.log('Login restored:', username);
});

// ===============================
// JOIN ERROR
// ===============================

socket.on('joinError', function (message) {
    console.log('Join error:', message);

    localStorage.removeItem('spidy_username');

    username = '';

    alert(message || 'Unable to join chat.');

    showLogin();
    usernameInput.focus();
});

// ===============================
// MAIN ROOM EVENTS
// ===============================

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// ===============================
// SEND MAIN MESSAGE
// ===============================

function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    // OWNER CLEAR COMMAND
    if (message.toLowerCase() === '/clear') {
        if (
            normalizeUsername(username) !==
            normalizeUsername(OWNER_USERNAME)
        ) {
            addSystemMessage('Only the Owner can clear the room.');

            messageInput.value = '';
            messageInput.focus();
            return;
        }

        socket.emit('clearRoom');

        messageInput.value = '';
        messageInput.focus();
        return;
    }

    const messageData = {
        message: message
    };

    // ADD QUOTE
    if (quotedMessage) {
        messageData.quote = {
            id: quotedMessage.id,
            username: quotedMessage.username,
            message: quotedMessage.message || '📎 Media'
        };
    }

    socket.emit('chatMessage', messageData);

    messageInput.value = '';

    clearQuote();

    messageInput.focus();
}

// ===============================
// RECEIVE NEW MAIN MESSAGE
// ===============================

socket.on('chatMessage', function (data) {
    if (!data || typeof data !== 'object') return;
    addMessage(data);
});

// ===============================
// RESTORE CHAT HISTORY
// ===============================

socket.on('chatHistory', function (history) {
    if (!Array.isArray(history)) {
        console.log('No chat history received.');
        return;
    }

    console.log('Chat history received:', history.length);

    messages.innerHTML = '';

    history.forEach(function (data) {
        // Allow text messages AND media-only messages.
        if (!data || (!data.message && !data.media)) return;
        addMessage(data);
    });

    messages.scrollTop = messages.scrollHeight;
});

// ===============================
// YOUTUBE VIDEO ID DETECTOR
// ===============================

function getYouTubeVideoId(message) {
    if (!message) return null;

    const text = String(message).trim();

    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^\s#]*&)?v=([A-Za-z0-9_-]{11})(?:[^\s]*)?/i,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&#][^\s]*)?/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})(?:[?&#][^\s]*)?/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

// ===============================
// CREATE YOUTUBE PREVIEW
// ===============================

function createYouTubePreview(videoId) {
    if (!videoId) return null;

    const preview = document.createElement('div');
    preview.className = 'youtube-preview';

    const iframe = document.createElement('iframe');

    iframe.src =
        'https://www.youtube.com/embed/' +
        encodeURIComponent(videoId) +
        '?rel=0';

    iframe.title = 'YouTube video';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    iframe.allow =
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

    iframe.allowFullscreen = true;

    preview.appendChild(iframe);

    return preview;
}

// ===============================
// DIRECT GIF / IMAGE LINK
// ===============================

function getDirectMediaUrl(message) {
    const value = String(message || '').trim();

    // The message must contain only a URL.
    if (!/^https?:\/\/\S+$/i.test(value)) return null;

    try {
        const url = new URL(value);

        if (!['http:', 'https:'].includes(url.protocol)) {
            return null;
        }

        if (/\.(gif|png|jpe?g|webp)(?:$|[?#])/i.test(url.href)) {
            return url.href;
        }
    } catch (_) {
        return null;
    }

    return null;
}

// ===============================
// CREATE UPLOADED MEDIA PREVIEW
// ===============================

function createChatMedia(media) {
    if (!media || typeof media.url !== 'string') return null;

    // Accept only URLs matching this site's upload path.
    if (
        !/^\/uploads\/[a-f0-9-]+\.(?:jpg|jpeg|png|webp|gif|mp4|webm)$/i.test(
            media.url
        )
    ) {
        return null;
    }

    const isVideo = /\.(mp4|webm)$/i.test(media.url);

    const element = document.createElement(
        isVideo ? 'video' : 'img'
    );

    element.className = 'chat-upload-media';
    element.src = media.url;

    if (isVideo) {
        element.controls = true;
        element.preload = 'metadata';
    } else {
        element.alt = 'Shared image or GIF';
        element.loading = 'lazy';
    }

    element.addEventListener('error', function () {
        element.alt = 'Media could not be loaded';
    });

    return element;
}

// ===============================
// CREATE DIRECT GIF PREVIEW
// ===============================

function createDirectMediaPreview(url) {
    const element = document.createElement('img');

    element.className = 'chat-upload-media';
    element.src = url;
    element.alt = 'Shared GIF or image';
    element.loading = 'lazy';
    element.referrerPolicy = 'no-referrer';

    element.addEventListener('error', function () {
        element.remove();
    }, { once: true });

    return element;
}

// ===============================
// ADD MAIN MESSAGE
// ===============================

function addMessage(data) {
    if (!data) return;

    const sender = data.username || 'User';
    const message = data.message || '';
    const time = data.time || '';
    const messageId = data.id || '';

    // MESSAGE WRAPPER
    const wrapper = document.createElement('div');

    if (
        normalizeUsername(sender) ===
        normalizeUsername(username)
    ) {
        wrapper.className = 'message mine';
    } else {
        wrapper.className = 'message';
    }

    if (messageId) {
        wrapper.dataset.messageId = messageId;
    }

    // AVATAR
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.title = sender;

    // CONTENT
    const content = document.createElement('div');
    content.className = 'message-content';

    // HEADER
    const header = document.createElement('div');
    header.className = 'message-header';

    // USERNAME
    const senderName = document.createElement('span');
    const rank = getRank(sender);

    senderName.className =
        'message-username ' + rank.className;

    senderName.textContent = rank.icon + ' ' + sender;

    // TIME
    const timeElement = document.createElement('span');
    timeElement.className = 'message-time';
    timeElement.textContent = time;

    // QUOTED MESSAGE
    if (data.quote && data.quote.message) {
        const quotedBox = document.createElement('div');
        quotedBox.className = 'quoted-message';

        const quotedUser = document.createElement('div');
        quotedUser.className = 'quoted-message-user';
        quotedUser.textContent = data.quote.username || 'User';

        const quotedText = document.createElement('div');
        quotedText.className = 'quoted-message-text';
        quotedText.textContent = data.quote.message;

        quotedBox.appendChild(quotedUser);
        quotedBox.appendChild(quotedText);

        content.appendChild(quotedBox);
    }

    // MESSAGE TEXT
    const text = document.createElement('div');
    text.className = 'message-text';

    // DETECT YOUTUBE AND DIRECT GIF LINKS
    const youtubeVideoId = getYouTubeVideoId(message);
    const youtubePreview = createYouTubePreview(youtubeVideoId);

    const directMediaUrl = getDirectMediaUrl(message);

    const directMediaPreview = directMediaUrl
        ? createDirectMediaPreview(directMediaUrl)
        : null;

    // UPLOADED MEDIA
    const mediaPreview = createChatMedia(data.media);

    // Hide link text when it can be replaced by a preview.
    if (youtubeVideoId || directMediaPreview) {
        text.style.display = 'none';
    } else {
        text.textContent = message;
    }

    // MESSAGE ACTIONS
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    // QUOTE BUTTON
    if (
        normalizeUsername(sender) !==
        normalizeUsername(username)
    ) {
        const quoteButton = document.createElement('button');

        quoteButton.type = 'button';
        quoteButton.className =
            'message-action-btn quote-message-btn';

        quoteButton.textContent = '↩ Quote';

        quoteButton.addEventListener('click', function (event) {
            event.stopPropagation();

            if (!messageId) return;

            setQuote({
                id: messageId,
                username: sender,
                message: message || (data.media ? '📎 Media' : '')
            });
        });

        actions.appendChild(quoteButton);
    }

    // DELETE BUTTON
    if (
        normalizeUsername(sender) ===
        normalizeUsername(username)
    ) {
        const deleteButton = document.createElement('button');

        deleteButton.type = 'button';
        deleteButton.className =
            'message-action-btn delete-message-btn';

        deleteButton.textContent = '🗑 Delete';

        deleteButton.addEventListener('click', function (event) {
            event.stopPropagation();

            if (!messageId) return;

            socket.emit('deleteMessage', messageId);
        });

        actions.appendChild(deleteButton);
    }

    // BUILD HEADER
    header.appendChild(senderName);
    header.appendChild(timeElement);

    // BUILD CONTENT
    content.appendChild(header);
    content.appendChild(text);

    // ADD YOUTUBE PREVIEW
    if (youtubePreview) {
        content.appendChild(youtubePreview);
    }

    // ADD UPLOADED MEDIA
    if (mediaPreview) {
        content.appendChild(mediaPreview);
    } else if (directMediaPreview) {
        content.appendChild(directMediaPreview);
    }

    if (actions.children.length > 0) {
        content.appendChild(actions);
    }

    // BUILD WRAPPER
    wrapper.appendChild(avatar);
    wrapper.appendChild(content);

    messages.appendChild(wrapper);

    // AUTO SCROLL
    messages.scrollTop = messages.scrollHeight;
}

// ===============================
// SET QUOTE
// ===============================

function setQuote(messageData) {
    if (!messageData) return;

    quotedMessage = messageData;

    const oldPreview = document.getElementById('quotePreview');

    if (oldPreview) oldPreview.remove();

    const preview = document.createElement('div');

    preview.id = 'quotePreview';
    preview.className = 'quote-preview';

    const previewContent = document.createElement('div');
    previewContent.className = 'quote-preview-content';

    const title = document.createElement('div');
    title.className = 'quote-preview-title';

    title.textContent = '↩ Replying to ' + messageData.username;

    const previewText = document.createElement('div');
    previewText.className = 'quote-preview-text';

    previewText.textContent = messageData.message || '📎 Media';

    previewContent.appendChild(title);
    previewContent.appendChild(previewText);

    const cancelButton = document.createElement('button');

    cancelButton.type = 'button';
    cancelButton.className = 'cancel-quote-btn';
    cancelButton.textContent = '×';
    cancelButton.title = 'Cancel quote';

    cancelButton.addEventListener('click', clearQuote);

    preview.appendChild(previewContent);
    preview.appendChild(cancelButton);

    const inputParent = messageInput.parentElement;

    if (inputParent && inputParent.parentElement) {
        inputParent.parentElement.insertBefore(preview, inputParent);
    }

    messageInput.focus();
}

// ===============================
// CLEAR QUOTE
// ===============================

function clearQuote() {
    quotedMessage = null;

    const preview = document.getElementById('quotePreview');

    if (preview) preview.remove();
}

// ===============================
// MESSAGE DELETED
// ===============================

socket.on('messageDeleted', function (data) {
    if (!data || !data.id) return;

    const messageId = String(data.id);

    const messageElement = messages.querySelector(
        '[data-message-id="' + messageId + '"]'
    );

    if (messageElement) {
        messageElement.remove();
    }

    if (
        quotedMessage &&
        String(quotedMessage.id) === messageId
    ) {
        clearQuote();
    }
});

// ===============================
// DELETE ERROR
// ===============================

socket.on('deleteError', function (data) {
    if (!data) return;

    addSystemMessage(
        data.message || 'Message could not be deleted.'
    );
});


/* ==========================================
   SPIDY.CHAT — FUTURISTIC CLEAR SOUND
========================================== */

let clearAudioContext = null;

async function playClearSound() {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!clearAudioContext) {
            clearAudioContext = new AudioContextClass();
        }

        if (clearAudioContext.state === "suspended") {
            await clearAudioContext.resume();
        }

        const audio = clearAudioContext;
        const now = audio.currentTime;

        function tone(freq, delay, duration, type, volume) {
            const oscillator = audio.createOscillator();
            const gain = audio.createGain();
            const start = now + delay;

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(
                volume,
                start + 0.025
            );
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                start + duration
            );

            oscillator.connect(gain);
            gain.connect(audio.destination);

            oscillator.start(start);
            oscillator.stop(start + duration + 0.03);
        }

        // Sci-fi descending digital sweep
        const sweep = audio.createOscillator();
        const sweepGain = audio.createGain();

        sweep.type = "sawtooth";
        sweep.frequency.setValueAtTime(720, now);
        sweep.frequency.exponentialRampToValueAtTime(
            140,
            now + 0.35
        );

        sweepGain.gain.setValueAtTime(0.0001, now);
        sweepGain.gain.exponentialRampToValueAtTime(
            0.035,
            now + 0.04
        );
        sweepGain.gain.exponentialRampToValueAtTime(
            0.0001,
            now + 0.36
        );

        sweep.connect(sweepGain);
        sweepGain.connect(audio.destination);

        sweep.start(now);
        sweep.stop(now + 0.4);

        // Futuristic confirmation tones
        tone(880, 0.22, 0.16, "sine", 0.10);
        tone(587.33, 0.38, 0.25, "sine", 0.12);
        tone(1174.66, 0.48, 0.16, "triangle", 0.05);

    } catch (error) {
        console.warn("Clear sound could not play:", error);
    }
}

/* ==========================================
   ROOM CLEARED EVENT
========================================== */

socket.on("clearRoom", function(data) {
    messages.innerHTML = "";

    clearQuote();

    // Play sound on every connected user's browser
    playClearSound();

    const clearedBy =
        data && data.by ? data.by : "Owner";

    addSystemMessage(
        "Main room cleared by " + clearedBy
    );
});


// ===============================
// SYSTEM MESSAGE
// ===============================

socket.on('systemMessage', function (data) {
    if (!data) return;

    const text = data.message ||
        ((data.username || 'Someone') + ' joined the room');

    addSystemMessage(text);
});

// ===============================
// ADD SYSTEM MESSAGE
// ===============================

function addSystemMessage(message) {
    const element = document.createElement('div');

    element.className = 'system-message';
    element.textContent = '✦ ' + message;

    messages.appendChild(element);

    messages.scrollTop = messages.scrollHeight;
}

// ===============================
// USER LIST
// ===============================

socket.on('userList', function (userList) {
    if (!Array.isArray(userList)) return;

    updateUserLists(userList);
});

// ===============================
// UPDATE USER LISTS
// ===============================

function updateUserLists(userList) {
    leftUserList.innerHTML = '';
    rightUserList.innerHTML = '';
    staffUserList.innerHTML = '';

    userList.forEach(function (user) {
        const rank = getRank(user);

        leftUserList.appendChild(
            createUserElement(user, rank)
        );

        rightUserList.appendChild(
            createUserElement(user, rank)
        );

        if (
            rank.name === 'Owner' ||
            rank.name === 'Admin' ||
            rank.name === 'Moderator'
        ) {
            staffUserList.appendChild(
                createUserElement(user, rank)
            );
        }
    });
}

// ===============================
// CREATE USER ELEMENT
// ===============================

function createUserElement(user, rank) {
    const item = document.createElement('div');
    item.className = 'online-user';

    const left = document.createElement('div');
    left.className = 'online-user-left';

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.title = user;

    const dot = document.createElement('span');
    dot.className = 'online-dot';

    const name = document.createElement('span');
    name.className = 'online-name';
    name.textContent = user;

    left.appendChild(avatar);
    left.appendChild(dot);
    left.appendChild(name);

    const badge = document.createElement('span');

    badge.className = 'rank-badge ' + rank.className;
    badge.textContent = rank.icon + ' ' + rank.name;

    item.appendChild(left);
    item.appendChild(badge);

    item.addEventListener('click', function () {
        if (
            normalizeUsername(user) ===
            normalizeUsername(username)
        ) {
            return;
        }

        openPrivateChat(user);
    });

    return item;
}

// ===============================
// OPEN PRIVATE CHAT
// ===============================

function openPrivateChat(user) {
    if (!user) return;

    privateChatUser = String(user);

    privateUsername.textContent = privateChatUser;
    privateMessages.innerHTML = '';

    privateChatModal.classList.remove('hidden');

    privateMessageInput.focus();
}

// ===============================
// CLOSE PRIVATE CHAT
// ===============================

closePrivateChat.addEventListener('click', function () {
    privateChatModal.classList.add('hidden');

    privateChatUser = '';

    privateMessages.innerHTML = '';
});

// ===============================
// PRIVATE CHAT EVENTS
// ===============================

privateSendButton.addEventListener('click', sendPrivateMessage);

privateMessageInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendPrivateMessage();
    }
});

// ===============================
// SEND PRIVATE MESSAGE
// ===============================

function sendPrivateMessage() {
    const message = privateMessageInput.value.trim();

    if (!message || !privateChatUser) return;

    socket.emit('privateMessage', {
        to: privateChatUser,
        message: message
    });

    privateMessageInput.value = '';

    privateMessageInput.focus();
}

// ===============================
// RECEIVE PRIVATE MESSAGE
// ===============================

socket.on('privateMessage', function (data) {
    if (!data) return;

    const sender = String(data.from || '');
    const receiver = String(data.to || '');

    if (privateChatModal.classList.contains('hidden')) {
        if (
            sender &&
            normalizeUsername(sender) !==
            normalizeUsername(username)
        ) {
            openPrivateChat(sender);
        }
    }

    if (!privateChatUser) return;

    const currentChat = normalizeUsername(privateChatUser);

    const fromMatches =
        normalizeUsername(sender) === currentChat;

    const toMatches =
        normalizeUsername(receiver) === currentChat;

    if (!fromMatches && !toMatches) return;

    addPrivateMessage(
        sender,
        data.message || '',
        data.time || ''
    );
});

// ===============================
// ADD PRIVATE MESSAGE
// ===============================

function addPrivateMessage(sender, message, time) {
    const element = document.createElement('div');
    element.className = 'private-message';

    const senderName = document.createElement('strong');
    senderName.textContent = sender;

    const text = document.createElement('span');
    text.textContent = ' ' + message;

    const timeElement = document.createElement('small');
    timeElement.textContent = time || '';

    element.appendChild(senderName);
    element.appendChild(text);
    element.appendChild(timeElement);

    privateMessages.appendChild(element);

    privateMessages.scrollTop = privateMessages.scrollHeight;
}

// ===============================
// PRIVATE ERROR
// ===============================

socket.on('privateError', function (data) {
    if (!data) return;

    addSystemMessage(
        data.message || 'Private message could not be sent.'
    );
});

// ===============================
// MEDIA UPLOAD
// ===============================

if (uploadInput && uploadButton && uploadStatus) {

    uploadButton.addEventListener('click', function () {
        if (!username) {
            alert('Please log in first.');
            return;
        }

        uploadInput.click();
    });

    uploadInput.addEventListener('change', async function () {
        const file = uploadInput.files[0];

        if (!file) return;

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/webm'
        ];

        if (!allowedTypes.includes(file.type)) {
            uploadStatus.textContent =
                'Choose JPG, PNG, WEBP, GIF, MP4 or WEBM.';

            uploadInput.value = '';
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            uploadStatus.textContent =
                'Maximum file size is 20 MB.';

            uploadInput.value = '';
            return;
        }

        uploadButton.disabled = true;
        uploadStatus.textContent = 'Uploading...';

        try {
            const formData = new FormData();

            formData.append('file', file);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (
                !response.ok ||
                !result.success ||
                !result.url
            ) {
                throw new Error(
                    result.error || 'Upload failed.'
                );
            }

            // The server must support media in chatMessage.
            socket.emit('chatMessage', {
                message: '',
                media: result
            });

            uploadStatus.textContent = 'Media shared!';
        } catch (error) {
            uploadStatus.textContent =
                error.message || 'Upload failed.';
        } finally {
            uploadButton.disabled = false;
            uploadInput.value = '';
        }
    });
}

// ===============================
// LOGOUT
// ===============================

logoutButton.addEventListener('click', function () {
    localStorage.removeItem('spidy_username');

    username = '';
    privateChatUser = '';

    clearQuote();

    socket.emit('logout');

    showLogin();

    usernameInput.value = '';

    messages.innerHTML = '';
    privateMessages.innerHTML = '';

    privateChatModal.classList.add('hidden');

    if (uploadStatus) {
        uploadStatus.textContent = '';
    }
});

// ===============================
// SOCKET DISCONNECT
// ===============================

socket.on('disconnect', function () {
    console.log('Disconnected from server.');
});

// ===============================
// SOCKET ERROR
// ===============================

socket.on('connect_error', function (error) {
    console.error('Socket connection error:', error);
});
