// .env config ---- 
import { config } from 'dotenv';
config({ path: './config/.env' });

// import packages
import cookieParser from 'cookie-parser';
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import DbConnect from './config/database.js';
import { Server } from 'socket.io';
import http from 'http';
import userRouter from './routes/userRoutes.js';
import productRouter from './routes/productRoutes.js';
import orderRouter from './routes/orderRoutes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// connecting db
DbConnect();
// middlewares :-
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

// path to static file - public foler
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
// router prefix
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/orders', orderRouter);

// socket io
io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('set-user-id', (userId) => {
        socket.userId = userId;
    })

    socket.on('disconnect', () => {
        console.log('a user disconencted');
    });
});


export { io };

// initial server
app.get('/', (req, res) => {
    res.send('server is working');
})
server.listen(process.env.PORT)
