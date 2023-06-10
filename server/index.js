const express = require("express");
const http = require("http");
// const socketIO = require("socket.io");
const app = express();

const cors = require("cors");
const { Server } = require("socket.io");
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const chatRooms = new Map();

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinChatRoom", ({ chatRoomId, username }) => {
    socket.join(chatRoomId);

    socket.username = username;

    if (chatRooms.has(chatRoomId)) {
      chatRooms.get(chatRoomId).members.add(username);
    } else {
      chatRooms.set(chatRoomId, { members: new Set([username]), messages: [] });
    }

    io.to(chatRoomId).emit("updateMemberCount", {
      chatRoomId,
      memberCount: chatRooms.get(chatRoomId).members.size,
    });
  });

  socket.on("sendMessage", ({ chatRoomId, message }) => {
    // Add the message to the chat room's messages
    chatRooms.get(chatRoomId).messages.push({
      username: socket.username,
      message,
    });

    io.to(chatRoomId).emit("receiveMessage", {
      chatRoomId,
      username: socket.username,
      message,
    });
  });

  socket.on("getChatRooms", () => {
    const chatRoomsArray = Array.from(chatRooms, ([chatRoomId, chatRoom]) => ({
      chatRoomId,
      memberCount: chatRoom.members.size,
      unreadCount: 0,
      messages: chatRoom.messages,
    }));

    socket.emit("chatRooms", chatRoomsArray);
  });

  socket.on("createChatRoom", ({ chatRoomId }) => {
    if (chatRooms.has(chatRoomId)) {
      socket.emit(
        "createChatRoomError",
        `Chat room ${chatRoomId} already exists`
      );
    } else {
      chatRooms.set(chatRoomId, { members: new Set(), messages: [] });
      console.log(chatRoomId);
      socket.emit(
        "createChatRoomSuccess",
        `Chat room ${chatRoomId} created successfully`
      );
      io.emit("newChatRoom", chatRoomId);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");

    chatRooms.forEach((room) => {
      if (room.members.has(socket.username)) {
        room.members.delete(socket.username);

        io.to(room.chatRoomId).emit("updateMemberCount", {
          chatRoomId: room.chatRoomId,
          memberCount: room.members.size,
        });
      }
    });
  });
});

const port = 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
