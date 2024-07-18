import mongoose from "mongoose";

const DbConnect = () => {
    mongoose
        .connect(`${process.env.MONGO_URI}/ecom`)
        .then(() => console.log('Db connected'))
        .catch((err) => console.log(err))
}
export default DbConnect;