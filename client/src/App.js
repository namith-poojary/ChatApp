import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState("");
  const [message, setMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    socket.on("chatRooms", (rooms) => {
      setChatRooms(rooms);
    });

    socket.on("receiveMessage", ({ chatRoomId, username }) => {
      setUnreadCounts((prevState) => ({
        ...prevState,
        [chatRoomId]: prevState[chatRoomId] ? prevState[chatRoomId] + 1 : 1,
      }));
    });

    socket.on("createChatRoomSuccess", (message) => {
      console.log(message);
    });

    socket.on("createChatRoomError", (error) => {
      console.log(error);
    });

    return () => {
      socket.off("chatRooms");
      socket.off("receiveMessage");
      socket.off("createChatRoomSuccess");
      socket.off("createChatRoomError");
    };
  }, []);

  const handleJoinChatRoom = (chatRoomId) => {
    socket.emit("joinChatRoom", { chatRoomId, username });
    setSelectedChatRoom(chatRoomId);
    setMessage("");
    setUnreadCounts((prevState) => ({
      ...prevState,
      [chatRoomId]: 0,
    }));
  };

  const handleSendMessage = () => {
    if (message.trim() === "") return;
    socket.emit("sendMessage", { chatRoomId: selectedChatRoom, message });
    setMessage("");
  };

  const handleCreateChatRoom = (chatRoomId) => {
    socket.emit("createChatRoom", { chatRoomId });
  };

  return (
    <div className="app">
      {!showChat ? (
        <div className="login-container">
          <h1>Welcome to the Chat App</h1>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
          <button
            disabled={!username}
            onClick={() => {
              setShowChat(true);
              socket.emit("getChatRooms");
            }}
          >
            Enter Chat
          </button>
        </div>
      ) : (
        <div className="chat-container">
          <div className="chat-rooms">
            <h2>Chat Rooms</h2>
            <ul>
              {chatRooms.map((room) => (
                <li
                  key={room.chatRoomId}
                  onClick={() => handleJoinChatRoom(room.chatRoomId)}
                >
                  Room ID:{room.chatRoomId},{room.memberCount} members{" "}
                  {unreadCounts[room.chatRoomId] > 0 && (
                    <span className="unread-count">
                      {unreadCounts[room.chatRoomId]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Enter chat room ID"
              onChange={(e) => setSelectedChatRoom(e.target.value)}
            />
            <button onClick={() => handleCreateChatRoom(selectedChatRoom)}>
              Create Chat Room
            </button>
          </div>
          {selectedChatRoom &&
            chatRooms.find((room) => room.chatRoomId === selectedChatRoom) && (
              <div className="chat-room">
                <h2> Room ID: {selectedChatRoom}</h2>
                <div className="messages">
                  {chatRooms
                    .find((room) => room.chatRoomId === selectedChatRoom)
                    .messages.map((message, index) => (
                      <div className="message" key={index}>
                        <span className="username">{message.username}: </span>
                        <span className="content">{message.message}</span>
                      </div>
                    ))}
                </div>
                <div className="message-input">
                  <input
                    type="text"
                    placeholder="Type your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button onClick={handleSendMessage}>Send</button>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default App;
