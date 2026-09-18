const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===============================
// PUBLIC FOLDER
// ===============================

app.use(express.static(path.join(__dirname, "public")));

// ===============================
// ONLINE USERS
// ===============================

const users = new Map();

// ===============================
// CHAT HISTORY
// ===============================

// Keeps the latest 100 messages in server memory.
// This survives browser refreshes while the server is running.
const chatHistory = [];
const MAX_MESSAGES = 100;

// Final Owner username
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
            socket.emit(
                "joinError",
                "Please enter a username."
            );
            return;
        }

        // ===============================
        // DUPLICATE USERNAME CHECK
        // ===============================

        const usernameExists = [
            ...users.values()
        ].some(
            (user) =>
            normalizeUsername(user) ===
            normalizeUsername(username)
        );

        if (usernameExists) {
            socket.emit(
                "joinError",
                "This username is already online."
            );
            return;
        }

        // ===============================
        // SAVE USER
        // ===============================

        users.set(
            socket.id,
            username
        );

        console.log(
            `${username} joined the room.`
        );

        // ===============================
        // JOIN SUCCESS
        // ===============================

        socket.emit(
            "joinSuccess", {
                username: username
            }
        );

        // ===============================
        // SEND OLD CHAT HISTORY
        // ===============================

        socket.emit(
            "chatHistory",
            chatHistory
        );

        // ===============================
        // SYSTEM MESSAGE
        // ===============================

        io.emit(
            "systemMessage", {
                type: "join",
                username: username,
                message: `${username} joined the room`
            }
        );

        // ===============================
        // UPDATE ONLINE USERS
        // ===============================

        io.emit(
            "userList",
            [...users.values()]
        );
    });

    // ===============================
    // MAIN ROOM CHAT
    // ===============================

    socket.on(
        "chatMessage",
        (data) => {

            const username =
                users.get(socket.id);

            if (!username) {
                return;
            }

            let message = "";

            // Support object
            if (
                typeof data === "object" &&
                data !== null
            ) {
                message =
                    String(
                        data.message || ""
                    ).trim();
            }

            // Support string
            else {
                message =
                    String(
                        data || ""
                    ).trim();
            }

            if (!message) {
                return;
            }

            const chatData = {
                username: username,
                message: message,
                time: new Date().toLocaleTimeString(
                    [], {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )
            };

            // ===============================
            // SAVE MESSAGE TO HISTORY
            // ===============================

            chatHistory.push(
                chatData
            );

            // Keep only latest 100 messages
            if (
                chatHistory.length >
                MAX_MESSAGES
            ) {
                chatHistory.shift();
            }

            // ===============================
            // SEND MESSAGE TO EVERYONE
            // ===============================

            io.emit(
                "chatMessage",
                chatData
            );
        }
    );

    // ===============================
    // CLEAR MAIN ROOM
    // ===============================

    socket.on(
        "clearRoom",
        () => {

            const sender =
                users.get(socket.id);

            if (!sender) {
                return;
            }

            // ===============================
            // OWNER CHECK
            // ===============================

            if (
                normalizeUsername(sender) !==
                normalizeUsername(OWNER_USERNAME)
            ) {

                socket.emit(
                    "systemMessage", {
                        type: "error",
                        message:
                            "Only the Owner can clear the room."
                    }
                );

                return;
            }

            console.log(
                `${sender} cleared the main room.`
            );

            // ===============================
            // CLEAR STORED HISTORY
            // ===============================

            chatHistory.length = 0;

            // ===============================
            // CLEAR EVERYONE'S ROOM
            // ===============================

            io.emit(
                "clearRoom", {
                    by: sender
                }
            );
        }
    );

    // ===============================
    // PRIVATE MESSAGE
    // ===============================

    socket.on(
        "privateMessage",
        (data) => {

            const sender =
                users.get(socket.id);

            if (!sender) {
                return;
            }

            if (
                !data ||
                typeof data !== "object"
            ) {
                return;
            }

            const targetUsername =
                String(
                    data.to || ""
                )
                .trim()
                .replace(/\s+/g, " ");

            const message =
                String(
                    data.message || ""
                ).trim();

            if (
                !targetUsername ||
                !message
            ) {
                return;
            }

            // ===============================
            // FIND TARGET USER
            // ===============================

            let targetSocketId = null;

            for (
                const [
                    socketId,
                    username
                ] of users.entries()
            ) {

                if (
                    normalizeUsername(username) ===
                    normalizeUsername(targetUsername)
                ) {
                    targetSocketId =
                        socketId;

                    break;
                }
            }

            // ===============================
            // TARGET OFFLINE
            // ===============================

            if (!targetSocketId) {

                socket.emit(
                    "privateError", {
                        message:
                            `${targetUsername} is not online.`
                    }
                );

                return;
            }

            // ===============================
            // PRIVATE MESSAGE DATA
            // ===============================

            const privateData = {
                from: sender,
                to: targetUsername,
                message: message,
                time: new Date().toLocaleTimeString(
                    [], {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )
            };

            // ===============================
            // SEND TO RECEIVER
            // ===============================

            io.to(targetSocketId).emit(
                "privateMessage",
                privateData
            );

            // ===============================
            // SEND COPY TO SENDER
            // ===============================

            socket.emit(
                "privateMessage",
                privateData
            );
        }
    );

    // ===============================
    // LOGOUT
    // ===============================

    socket.on(
        "logout",
        () => {

            removeUser(socket);
        }
    );

    // ===============================
    // DISCONNECT
    // ===============================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "Disconnected:",
                socket.id
            );

            removeUser(socket);
        }
    );

    // ===============================
    // REMOVE USER
    // ===============================

    function removeUser(currentSocket) {

        const username =
            users.get(
                currentSocket.id
            );

        // Already removed
        if (!username) {
            return;
        }

        // Remove user
        users.delete(
            currentSocket.id
        );

        console.log(
            `${username} left the room.`
        );

        // ===============================
        // LEAVE SYSTEM MESSAGE
        // ===============================

        io.emit(
            "systemMessage", {
                type: "leave",
                username: username,
                message:
                    `${username} left the room`
            }
        );

        // ===============================
        // UPDATE USER LIST
        // ===============================

        io.emit(
            "userList",
            [...users.values()]
        );
    }
});

// ===============================
// START SERVER
// ===============================

const PORT =
    process.env.PORT || 3000;

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "-----------------------------------"
        );

        console.log(
            "Spidy.chat server started!"
        );

        console.log(
            `Local: http://localhost:${PORT}`
        );

        console.log(
            "-----------------------------------"
        );
    }
);
