const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Public folder
app.use(express.static(path.join(__dirname, "public")));

// Online users
const users = new Map();

// ===============================
// SOCKET CONNECTION
// ===============================

io.on("connection", (socket) => {

    console.log("New connection:", socket.id);

    // ===============================
    // USER JOIN
    // ===============================

    socket.on("join", (username) => {

        username = String(username || "").trim();

        if (!username) {
            socket.emit("joinError", "Please enter a username.");
            return;
        }

        // Check duplicate username
        const usernameExists = [...users.values()].some(
            (user) => user.toLowerCase() === username.toLowerCase()
        );

        if (usernameExists) {
            socket.emit("joinError", "This username is already online.");
            return;
        }

        // Save user
        users.set(socket.id, username);

        console.log(`${username} joined the room.`);

        // Send successful join
        socket.emit("joinSuccess", {
            username: username
        });

        // Tell EVERYONE that this person joined
        io.emit("systemMessage", {
            type: "join",
            username: username,
            message: `${username} joined the room`
        });

        // Update online users
        io.emit("userList", [...users.values()]);
    });


    // ===============================
    // MAIN ROOM CHAT
    // ===============================

    socket.on("chatMessage", (data) => {

        const username = users.get(socket.id);

        if (!username) {
            return;
        }

        let message = "";

        // Support object
        if (typeof data === "object" && data !== null) {
            message = String(data.message || "").trim();
        }

        // Support string
        else {
            message = String(data || "").trim();
        }

        if (!message) {
            return;
        }

        const chatData = {
            username: username,
            message: message,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        };

        // Send message to everyone
        io.emit("chatMessage", chatData);
    });


    // ===============================
    // PRIVATE MESSAGE
    // ===============================

    socket.on("privateMessage", (data) => {

        const sender = users.get(socket.id);

        if (!sender) {
            return;
        }

        if (!data || typeof data !== "object") {
            return;
        }

        const targetUsername = String(data.to || "").trim();
        const message = String(data.message || "").trim();

        if (!targetUsername || !message) {
            return;
        }

        // Find target user
        let targetSocketId = null;

        for (const [socketId, username] of users.entries()) {

            if (
                username.toLowerCase() ===
                targetUsername.toLowerCase()
            ) {
                targetSocketId = socketId;
                break;
            }
        }

        // Target offline
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

        // Send to receiver
        io.to(targetSocketId).emit(
            "privateMessage",
            privateData
        );

        // Send copy back to sender
        socket.emit(
            "privateMessage",
            privateData
        );
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
    // REMOVE USER FUNCTION
    // ===============================

    function removeUser(socket) {

        const username = users.get(socket.id);

        // User already removed
        if (!username) {
            return;
        }

        // Remove from online users
        users.delete(socket.id);

        console.log(`${username} left the room.`);

        // Tell everyone
        io.emit("systemMessage", {
            type: "leave",
            username: username,
            message: `${username} left the room`
        });

        // Update online users
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