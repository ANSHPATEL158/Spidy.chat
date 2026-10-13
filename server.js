
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===============================
// PUBLIC FOLDER
// ===============================

app.use(express.static(path.join(__dirname, "public")));

// ===============================
// MEDIA UPLOAD CONFIGURATION
// ===============================

const UPLOAD_DIR = path.join(__dirname, "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MEDIA = {
    ".jpg": { type: "image", mime: "image/jpeg" },
    ".jpeg": { type: "image", mime: "image/jpeg" },
    ".png": { type: "image", mime: "image/png" },
    ".webp": { type: "image", mime: "image/webp" },
    ".gif": { type: "image", mime: "image/gif" },
    ".mp4": { type: "video", mime: "video/mp4" },
    ".webm": { type: "video", mime: "video/webm" }
};

const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, crypto.randomUUID() + ext);
    }
});

const mediaUpload = multer({
    storage: uploadStorage,

    limits: {
        fileSize: 20 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowed = ALLOWED_MEDIA[ext];

        if (allowed && file.mimetype === allowed.mime) {
            return cb(null, true);
        }

        cb(new Error(
            "Allowed files: JPG, PNG, WEBP, GIF, MP4 and WEBM."
        ));
    }
});

// Serve uploaded media.
app.use("/uploads", express.static(UPLOAD_DIR, {
    dotfiles: "deny",
    index: false,
    setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
    }
}));

// Upload endpoint.
app.post("/upload", (req, res) => {
    mediaUpload.single("file")(req, res, (err) => {
        if (err) {
            const message =
                err.code === "LIMIT_FILE_SIZE"
                    ? "Maximum file size is 20 MB."
                    : err.message || "Upload failed.";

            return res.status(400).json({
                success: false,
                error: message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Please select a file."
            });
        }

        const ext = path.extname(req.file.filename).toLowerCase();
        const mediaInfo = ALLOWED_MEDIA[ext];

        return res.json({
            success: true,
            url: "/uploads/" + req.file.filename,
            type: mediaInfo.type,
            name: path.basename(req.file.originalname),
            size: req.file.size
        });
    });
});

// ===============================
// ONLINE USERS
// ===============================

const users = new Map();

// ===============================
// CHAT HISTORY
// ===============================

const chatHistory = [];
const MAX_MESSAGES = 100;

// ===============================
// MESSAGE ID
// ===============================

let messageIdCounter = 1;

// ===============================
// OWNER
// ===============================

const OWNER_USERNAME = "Spidy 007";

// ===============================
// USERNAME NORMALIZER
// ===============================

function normalizeUsername(name) {
    return String(name || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}

// ===============================
// SOCKET CONNECTION
// ===============================

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    // ===============================
    // USER JOIN
    // ===============================

    socket.on("join", (username) => {
        username = String(username || "")
            .trim()
            .replace(/\s+/g, " ");

        if (!username) {
            socket.emit("joinError", "Please enter a username.");
            return;
        }

        // Prevent duplicate usernames.
        const usernameExists = [...users.values()].some(
            (user) =>
                normalizeUsername(user) === normalizeUsername(username)
        );

        if (usernameExists) {
            socket.emit(
                "joinError",
                "This username is already online."
            );
            return;
        }

        users.set(socket.id, username);

        console.log(`${username} joined the room.`);

        socket.emit("joinSuccess", {
            username: username
        });

        // Send previous messages to the joining user.
        socket.emit("chatHistory", chatHistory);

        io.emit("systemMessage", {
            type: "join",
            username: username,
            message: `${username} joined the room`
        });

        io.emit("userList", [...users.values()]);
    });

    // ===============================
    // MAIN CHAT MESSAGE
    // ===============================

    socket.on("chatMessage", (data) => {
        const username = users.get(socket.id);

        if (!username) {
            return;
        }

        let message = "";

        if (typeof data === "object" && data !== null) {
            message = String(data.message || "").trim();
        } else {
            message = String(data || "").trim();
        }

        // ===============================
        // MEDIA DATA
        // ===============================

        let media = null;

        if (
            typeof data === "object" &&
            data !== null &&
            data.media &&
            typeof data.media === "object"
        ) {
            const candidate = data.media;

            if (
                typeof candidate.url === "string" &&
                /^\/uploads\/[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm)$/i.test(candidate.url)
            ) {
                const filename = path.basename(candidate.url);
                const ext = path.extname(filename).toLowerCase();
                const filePath = path.join(UPLOAD_DIR, filename);

                if (
                    ALLOWED_MEDIA[ext] &&
                    fs.existsSync(filePath)
                ) {
                    media = {
                        url: candidate.url,
                        type: ALLOWED_MEDIA[ext].type,
                        name: path.basename(
                            String(candidate.name || "Shared media")
                        )
                    };
                }
            }
        }

        // Allow text messages and media-only messages.
        if (!message && !media) {
            return;
        }

        // ===============================
        // CREATE MESSAGE ID
        // ===============================

        const messageId = String(messageIdCounter++);

        // ===============================
        // QUOTE DATA
        // ===============================

        let quote = null;

        if (
            typeof data === "object" &&
            data !== null &&
            data.quote &&
            typeof data.quote === "object"
        ) {
            quote = {
                id: String(data.quote.id || ""),
                username: String(data.quote.username || ""),
                message: String(data.quote.message || "")
            };
        }

        // ===============================
        // MESSAGE DATA
        // ===============================

        const chatData = {
            id: messageId,
            username: username,
            message: message,

            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),

            quote: quote,
            media: media
        };

        // Save message.
        chatHistory.push(chatData);

        // Keep latest 100 messages.
        if (chatHistory.length > MAX_MESSAGES) {
            chatHistory.shift();
        }

        // Broadcast to everyone.
        io.emit("chatMessage", chatData);
    });

    // ===============================
    // DELETE MESSAGE
    // ===============================

    socket.on("deleteMessage", (messageId) => {
        const username = users.get(socket.id);

        if (!username) {
            return;
        }

        const id = String(messageId || "");

        if (!id) {
            return;
        }

        const messageIndex = chatHistory.findIndex(
            (message) => String(message.id) === id
        );

        if (messageIndex === -1) {
            socket.emit("deleteError", {
                message: "Message not found."
            });
            return;
        }

        const targetMessage = chatHistory[messageIndex];

        // Users can delete only their own messages.
        if (
            normalizeUsername(targetMessage.username) !==
            normalizeUsername(username)
        ) {
            socket.emit("deleteError", {
                message: "You can only delete your own messages."
            });
            return;
        }

        chatHistory.splice(messageIndex, 1);

        console.log(`${username} deleted message ${id}`);

        io.emit("messageDeleted", {
            id: id,
            by: username
        });
    });

    // ===============================
    // CLEAR MAIN ROOM
    // ===============================

    socket.on("clearRoom", () => {
        const sender = users.get(socket.id);

        if (!sender) {
            return;
        }

        if (
            normalizeUsername(sender) !==
            normalizeUsername(OWNER_USERNAME)
        ) {
            socket.emit("systemMessage", {
                type: "error",
                message: "Only the Owner can clear the room."
            });
            return;
        }

        console.log(`${sender} cleared the main room.`);

        chatHistory.length = 0;

        io.emit("clearRoom", {
            by: sender
        });
    });

    // ===============================
    // PRIVATE MESSAGE
    // ===============================

    socket.on("privateMessage", (data) => {
        const sender = users.get(socket.id);

        if (!sender || !data || typeof data !== "object") {
            return;
        }

        const targetUsername = String(data.to || "")
            .trim()
            .replace(/\s+/g, " ");

        const message = String(data.message || "").trim();

        if (!targetUsername || !message) {
            return;
        }

        let targetSocketId = null;

        for (const [socketId, username] of users.entries()) {
            if (
                normalizeUsername(username) ===
                normalizeUsername(targetUsername)
            ) {
                targetSocketId = socketId;
                break;
            }
        }

        if (!targetSocketId) {
            socket.emit("privateError", {
                message: `${targetUsername} is not online.`
            });
            return;
        }

        const privateData = {
            from: sender,
            to: targetUsername,
            message: message,

            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        };

        io.to(targetSocketId).emit("privateMessage", privateData);
        socket.emit("privateMessage", privateData);
    });

    // ===============================
    // LOGOUT
    // ===============================

    socket.on("logout", () => {
        removeUser(socket);
    });

    // ===============================
    // DISCONNECT
    // ===============================

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
        removeUser(socket);
    });

    // ===============================
    // REMOVE USER
    // ===============================

    function removeUser(currentSocket) {
        const username = users.get(currentSocket.id);

        if (!username) {
            return;
        }

        users.delete(currentSocket.id);

        console.log(`${username} left the room.`);

        io.emit("systemMessage", {
            type: "leave",
            username: username,
            message: `${username} left the room`
        });

        io.emit("userList", [...users.values()]);
    }
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
    console.log("-----------------------------------");
    console.log("Spidy.chat server started!");
    console.log(`Local: http://localhost:${PORT}`);
    console.log("-----------------------------------");
});
