import mongoose, { mongo } from "mongoose";
import { getImageExtension } from "../config/multerConfig.js";
import { productModel } from "../models/productModel.js";
import { catchError, sendResponse } from "../utils/utils.js";
import multer from "multer";


export const getAllProducts = async (req, res) => {

    try {

        const { keyword, minprice, maxprice, rating, category, page } = req.query;

        let query = {};

        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }
        if (minprice) {
            query.price = { $gte: minprice }
        }
        if (maxprice) {
            query.price = { $lte: maxprice }
        }
        if (rating) {
            query.rating = { $gte: rating }
        }
        if (category) {
            query.category = { $regex: category, $options: 'i' }
        }

        // pagination
        const resultPerPage = 10;

        const currentPage = Number(page) || 1;

        const skip = resultPerPage * (currentPage - 1);

        const totalProducts = await productModel.countDocuments(query);

        const products = await productModel.find(query).limit(resultPerPage).skip(skip);

        return sendResponse(res, 200, true, `${products.length ? 'Products fetched' : 'No product available'}`, { page: currentPage, resultPerPage: resultPerPage, fetchedProducts: products.length, totalFetchedProducts: totalProducts, products });

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in getAllProducts');
    }
};

export const createProduct = async (req, res) => {
    try {

        const { name, description, price, category } = req.body;

        if (!name || !description || !price || !category) return catchError(res, 400, false, 'Fields are empty');

        if (!req.files) return catchError(res, 400, false, 'Image are require')

        const files = req.files;

        const images = files.map(e => ({
            image: e.buffer,
            mimType: e.mimetype,
            extension: getImageExtension(e.mimetype)
        }));

        const product = await productModel.create({
            name,
            description,
            price,
            category,
            images
        })

        return sendResponse(res, 201, true, 'Product Created', product);


    } catch (error) {
        console.log(error);
        return catchError(res, 500, false, 'error in createProduct');
    }
};

export const updateProduct = async (req, res) => {
    try {

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        let product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        const { name, description, price, category } = req.body;

        product = await productModel.findByIdAndUpdate(productId, {
            name,
            description,
            price,
            category
        }, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        }
        );

        return sendResponse(res, 200, true, 'Product Updated', product);

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in updateProduct');
    }
};

export const deleteProductImage = async (req, res) => {
    try {

        const { productId, imageId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        if (!mongoose.Types.ObjectId.isValid(imageId)) return catchError(res, 400, false, 'invalid image id');

        const product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        const image = product.images.find(e => e._id.toString() === imageId);

        if (!image) return catchError(res, 404, false, 'No img found');

        product.images = product.images.filter(e => e._id.toString() !== imageId);

        await product.save();

        return sendResponse(res, 200, true, 'Image deleted', product);

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error deleteProductImage');
    }
}

export const addProductImage = async (req, res) => {
    try {

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        let product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        if (product.images.length >= 5) return catchError(res, 400, false, 'Only 5 images are allowed and u have uploaded 5 images');

        if (!req.files || !req.files.length) return catchError(res, 400, false, 'Upload imag files');

        // Check if multer threw a MulterError (too many files)
        if (req.fileValidationError instanceof multer.MulterError) return catchError(res, 400, false, 'Only 5 images are allowed');

        if (req.files.length > 5) return catchError(res, 400, false, 'Only 5 images are allowed');

        if ((product.images.length + req.files.length) > 5) return catchError(res, 400, false, 'Only 5 images are allowed');

        const files = req.files;

        const images = files.map(e => ({
            image: e.buffer,
            mimType: e.mimetype,
            extension: getImageExtension(e.mimetype)
        }));

        images.forEach(e => {
            product.images.push({
                _id: new mongoose.Types.ObjectId(),
                image: e.image,
                mimType: e.mimType,
                extension: e.extension
            })
        });

        await product.save();

        return sendResponse(res, 200, true, 'Img added');


    } catch (error) {
        console.log(error);
        return catchError(res, 500, false, 'error in addProductImage')
    }
}

export const getProductDetail = async (req, res) => {
    try {

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        const product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        return sendResponse(res, 200, true, 'Product Fetched', product)

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in getProductDetail');
    }
}

export const deleteProduct = async (req, res) => {
    try {

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        const product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        await product.deleteOne();

        return sendResponse(res, 200, true, 'Product deleted');

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in deleteProduct');
    }
}

export const createReview = async (req, res) => {
    try {

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        const product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        const { comment, rating } = req.body;

        // if (!comment || !rating) return catchError(res, 400, false, 'fields are required');

        const userId = req.user._id;
        const name = req.user.fullName;

        const isReviewed = product.review.find(e => e.userId.toString() === req.user._id.toString());

        if (isReviewed) {

            isReviewed.comment = comment;
            isReviewed.rating = rating;

        } else {

            product.review.push({
                userId,
                name,
                comment,
                rating
            });

            product.totalReview = product.review.length

        }

        let avg = 0;

        product.review.forEach(e => avg += e.rating);

        product.rating = avg / product.review.length;

        await product.save();

        return sendResponse(res, 200, true, `${isReviewed ? 'Review Updated' : 'Review added'}`, product);

    } catch (error) {
        console.log(error);
        return catchError(res, 500, false, 'error in creating Review');
    }
}

export const allReviewOfProduct = async (req, res) => {
    try {

        const { productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        const product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        return sendResponse(res, 200, true, "all review fetched", product.review);


    } catch (error) {
        console.log(error);
        return catchError(res, 500, false, 'error in deleteReview');
    }
}

export const deleteReview = async (req, res) => {
    try {
        const { productId, reviewId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'invalid product id');

        if (!mongoose.Types.ObjectId.isValid(reviewId)) return catchError(res, 400, false, 'invalid review id');

        const product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        const reviewIndex = product.review.findIndex(e => e._id.toString() === reviewId.toString());

        if (reviewIndex === -1) return catchError(res, 404, false, 'review not found')

        product.review = product.review.filter(e => e._id.toString() !== reviewId.toString());

        let avg = 0;

        product.review.forEach(e => avg += e.rating);

        product.rating = product.review.length ? avg / product.review.length : 0;

        product.totalReview = product.review.length ? product.review.length : 0;

        await product.save();

        return sendResponse(res, 200, true, 'Review deleted', product);

    } catch (error) {
        console.log(error);

        return catchError(res, 500, false, 'error in deleteReview');
    }
}

export const addToCart = async (req, res) => {
    try {

        const { productId } = req.params;

        const { qty, action } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) return catchError(res, 400, false, 'Invalid productid');

        if (!qty || Number(qty) <= 0) return catchError(res, 400, false, 'qty required');


        const product = await productModel.findById(productId);

        if (!product) return catchError(res, 404, false, 'Product not found');

        const isProductInCart = req.user.cart.findIndex(e => e.product.toString() === productId.toString());

        if (isProductInCart === -1) {
            req.user.cart.push({ product: productId, qty: Number(qty) });
        } else {
            action === 'increment' ? req.user.cart[isProductInCart].qty += Number(qty) : req.user.cart[isProductInCart].qty -= qty;
        }

        await req.user.save();

        return sendResponse(res, 200, true, `${isProductInCart === -1 ? 'Product qty increased in' : 'Product added in cart'}`, req.user);


    } catch (error) {
        console.log(res);

        return catchError(res, 500, false, 'error in addToCart');
    }
}
