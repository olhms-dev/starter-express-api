const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const upload = require('../utils/multer');
const cloudinary = require('../utils/cloudinary');
const Product = require('../models/product');
const Request = require('../models/request');

dotenv.config();
const router = express.Router();

// endpoint to create product
router.post('/create_product', upload.single('product-images'), async (req, res) => {
    const { token, product_name, new_stock_level, current_stock_level, quantity_received, cost_price, selling_price, category, price } = req.body;

    // check for required fields
    if (!token || !product_name || !category || !price || !new_stock_level || !current_stock_level || !pricquantity_receivede || !cost_price || !selling_price)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });


    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // // upload profile picture
        let img_url = '';
        let img_id = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { folder: 'product-images' });
            console.log(result);
            img_url = result.secure_url;
            img_id = result.public_id;
        }

        // create a new product document and populate it
        let product = new Product;
        product.product_name = product_name;
        product.category = category;
        product.price = price;
        product.cost_price = cost_price;
        product.selling_price = selling_price;
        product.quantity_received = quantity_received;
        product.current_stock_level = current_stock_level;
        product.new_stock_level = new_stock_level;
        product.img_id = img_id || '';
        product.img_url = img_url || '';
        product.timestamp = Date.now();

        await product.save();

        return res.status(200).send({ status: 'ok', msg: 'success', product });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to edit product
router.post('/edit_product', upload.single('profile-pic'), async (req, res) => {
    const { token, new_stock_level, current_stock_level, quantity_received, cost_price, selling_price, product_name, category, price, product_id } = req.body;

    // check for required fields
    if (!token || !product_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch product document
        let product = await Product.findById({ _id: product_id }).lean();

        // // upload profile picture
        let img_url = '';
        let img_id = '';
        if (req.file) {
            if (product.img_id != '') {
                await cloudinary.uploader.destroy(product.img_id);
            }
            const result = await cloudinary.uploader.upload(req.file.path, { folder: 'product-profile-pictures' });
            console.log(result);
            img_url = result.secure_url;
            img_id = result.public_id;
        }

        product = await Product.findByIdAndUpdate(
            { _id: product_id },
            {
                product_name: product_name || product.product_name,
                category: category || product.category,
                cost_price: cost_price || product.cost_price,
                selling_price: selling_price || product.selling_price,
                quantity_received: quantity_received || product.quantity_received,
                current_stock_level: current_stock_level || product.current_stock_level,
                new_stock_level: new_stock_level || product.new_stock_level,
                price: price || product.price,
                img_url: img_url || product.img_url,
                img_id: img_id || product.img_id,
            },
            { new: true }
        ).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', product });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view product
router.post('/view_product', async (req, res) => {
    const { token, product_id } = req.body;

    // check for required fields
    if (!token || !product_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch product document
        const product = await Product.findById({ _id: product_id }).lean();

        return res.status(200).send({ status: 'ok', msg: 'success', product });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view products
router.post('/view_products', async (req, res) => {
    const { token } = req.body;

    // check for required fields
    if (!token)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        jwt.verify(token, process.env.JWT_SECRET);

        // fetch product document
        const products = await Product.find({ is_deleted: false }, { is_deleted: 0, timestamp: 0, img_id: 0 }).lean();

        // check if products exist
        if (products.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no products at the moment', count: 0 });

        return res.status(200).send({ status: 'ok', msg: 'success', products, count: products.length });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to delete product
router.post('/delete_product', async (req, res) => {
    const { token, product_id } = req.body;

    // check for required fields
    if (!token || !product_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch product document
        await Product.updateOne({ _id: product_id }, { is_deleted: true }).lean();

        return res.status(200).send({ status: 'ok', msg: 'success' });


    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

module.exports = router;