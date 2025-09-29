
const session = require('express-session')
const express = require('express');
const app = express();
const socketIo = require('socket.io');
const http = require('http');
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);
const mongoose = require('mongoose');
const User = require('./models/user');

// Middleware to parse JSON and URL-encoded data      
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "catluck", // change to env var in prod
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
}));


app.get('/', (req, res) => {
  res.render('index');
}   );

let userProfile = {};

app.get("/session", (req, res) => {
  if (req.session.userProfile) {
    return res.json({ connected: true, userProfile: req.session.userProfile });
  }
  res.json({ connected: false });
});

//mongodb connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));


io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When this user sends location
  socket.on("send-location", (data) => {
    console.log("Location from", socket.id, data);
    // Send it to all *other* users
    socket.broadcast.emit("receive-location", { id: socket.id, ...data });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Notify others to remove this user’s marker
    socket.broadcast.emit("user-disconnected", socket.id);
  });
});

app.set('view engine', 'ejs');
app.use(express.static("public"))

app.post("/disconnect", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.post("/saveDevice", async (req, res) => {

  const { username,devicename, markerColor } = req.body;
  console.log("Received data:", username,devicename, markerColor); 
   if (!username) {
    return res.status(400).json({ error: "Username and marker color are required" });
  }

  // Save to MongoDB
  try {
    const newUser = new User({ username, devicename, markerColor });  
    await newUser.save(); 
    console.log("User saved to DB:", newUser);
  } catch (err) {
    console.error("Error saving user to DB:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
  req.session.userProfile = { username,devicename, markerColor };
  res.json({ success: true });  
});




server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

