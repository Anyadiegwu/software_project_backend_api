const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

// ✅ 1. CREATE APP FIRST
const app = express();

// ✅ 2. MIDDLEWARE
app.use(express.json());
app.use(cors());

// ✅ 3. ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/protected", require("./routes/protectedRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/reporter", require("./routes/reporterRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/security", require("./routes/securityRoutes"));
// Add this line with other routes
app.use("/api/townhalls", require("./routes/townhallRoutes"));

// ✅ 4. DB CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

// ✅ 5. CREATE SERVER AFTER APP
const server = http.createServer(app);

// ✅ 6. SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ✅ 7. MAKE IO AVAILABLE
app.set("io", io);

// ✅ 8. SOCKET LOGIC
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ✅ 9. START SERVER
// server.listen(5000, () => {
//   console.log("Server running with WebSocket");
// });\
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});