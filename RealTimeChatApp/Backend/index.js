const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const dbConnect = require('./config/dbconnect');
const bodyParser = require('body-parser');
const authRoute = require('./routes/authRoute');
const chatRoute = require('./routes/chatRoute');
const statusRoute = require('./routes/statusRoute');
const initializeSocket = require('./services/socketService');
const http = require('http');
dotenv.config();

const app = express();
const PORT = process.env.PORT;

const corsOptions = {
    origin: process.env.FRONTEND_URL,
    Credential: true
}
app.use(cors(corsOptions));

//middlewares 
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true})); //handles form data

//db connection done
dbConnect.connectdb();


//creating io server 
const server = http.createServer(app);

const io = initializeSocket(server);

//apply socket middleware before routes
app.use( (req, res, next) => {
    req.io = io;
    req.socketUserMap = io.socketUserMap;
    next();
})


//routes
app.get("/", (req, res) => {
    res.send("Home route working");
});
app.use('/api/auth',authRoute);
app.use('/api/chat', chatRoute);
app.use('/api/status', statusRoute);


server.listen(PORT, () => {
    console.log(`server running at port no. ${PORT}`);
})