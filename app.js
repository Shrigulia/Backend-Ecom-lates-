// .env config ---- 
import { config } from 'dotenv';
config({ path: './config/.env' });

// import packages
import cookieParser from 'cookie-parser';
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import DbConnect from './config/database.js';
import userRouter from './routes/userRoutes.js';
import productRouter from './routes/productRoutes.js';

const server = express();

// connecting db
DbConnect();
// middlewares :-
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser());
server.set('view engine', 'ejs')

// path to static file - public foler
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename);
server.use(express.static(path.join(__dirname, 'public')));
// router prefix
server.use('/api/v1/users', userRouter);
server.use('/api/v1/products', productRouter);

// initial server
server.get('/', (req, res) => {
    res.send('server is working');
}).listen(process.env.PORT)
