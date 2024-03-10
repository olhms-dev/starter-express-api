const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");

const StoreItem = require("../models/store_item");
const Statistics = require("../models/statistics");
//const {replyGetInTouch} = require('../utils/nodemailer');

dotenv.config();
const router = express.Router();

// create get in touch
router.post("/add_product", upload.single("image"), async (req, res) => {
  const { token, product_name, cost_price, sell_price, category, quant_receive } = req.body;

  // check for required fields
  if (!token || !product_name || !cost_price || !sell_price || !category || !quant_receive)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {

    // verify token
    jwt.verify(token, process.env.JWT_SECRET);

    let img_url = "";
    let img_id = "";
    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "product-images",
        });
        img_url = result.secure_url;
        img_id = result.public_id;
    }

    const timestamp = Date.now();
    
    let storeItem = new StoreItem();

    storeItem.product_name = product_name;
    storeItem.img_url = img_url;
    storeItem.img_id = img_id;
    storeItem.cost_price = cost_price;
    storeItem.sell_price = sell_price;
    storeItem.category = category;
    storeItem.timestamp = timestamp;
    storeItem.stock_level = quant_receive;

    storeItem = await storeItem.save();

    //increase stats
    await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_of_store_items: 1}});

    return res.status(200).send({ status: "ok", msg: "Success", storeItem });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

router.post("/edit_product", upload.single("image"), async (req, res) => {
    const { token, store_item_id, product_name, cost_price, sell_price, category, quant_receive} = req.body;
  
    // check for required fields
    if (!token || !store_item_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });
  
    try {
  
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      const found = await StoreItem.findOne({_id: store_item_id}).lean();
        
      if(!found){
        return res
        .status(400)
        .send({ status: "error", msg: `No Product with id: ${store_item_id} found` });
      }

      if(found.img_id != 'a'){
        await cloudinary.uploader.destroy(found.img_id);
      }


      let img_url = "";
      let img_id = "";

      if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
              folder: "product-images",
          });
          img_url = result.secure_url;
          img_id = result.public_id;
      }
  
      const timestamp = Date.now();
      
      let storeItem = await StoreItem.findOneAndUpdate({_id: store_item_id}, {
        product_name: product_name || found.product_name,
        img_url: req.file ? img_url : found.img_url,
        img_id: req.file ? img_id : found.img_id,
        cost_price: cost_price || found.cost_price,
        sell_price: sell_price || found.sell_price,
        category: category || found.category,
        stock_level: quant_receive || found.stock_level
      }, {new: true}).lean();

  
      return res.status(200).send({ status: "ok", msg: "Success", storeItem });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  });


  router.post("/delete_product", async (req, res) => {
    const { token, store_item_id} = req.body;
  
    // check for required fields
    if (!token || !store_item_id)
      return res
        .status(400)
        .send({ status: "error", msg: "all fields must be filled" });
  
    try {
  
      // verify token
      jwt.verify(token, process.env.JWT_SECRET);

      const found = await StoreItem.findOne({_id: store_item_id}).lean();
        
      if(!found){
        return res
        .status(400)
        .send({ status: "error", msg: `No Product with id: ${store_item_id} found` });
      }

      if(found.img_id != 'a'){
        await cloudinary.uploader.destroy(found.img_id);
      }
      
      await StoreItem.deleteOne({_id: store_item_id});

      await Statistics.updateOne({doc_type: 'statistics'}, {$inc: {no_of_store_items: -1}});

  
      return res.status(200).send({ status: "ok", msg: "Success" });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: "error", msg: "some error occurred", e });
    }
  });


// endpoint to view product
router.post("/view_product", async (req, res) => {
  const { token, store_item_id } = req.body;

  // check for required fields
  if (!token || !store_item_id)
    return res
      .status(400)
      .send({ status: "error", msg: "all fields must be filled" });

  try {
    const storeItem = await StoreItem.findById({ _id: store_item_id }).lean();

    return res.status(200).send({ status: "ok", msg: "Success", storeItem });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to view get in touches
// filter: all/ category (exact category)
router.post("/get_products", async (req, res) => {

    const {token, filter} = req.body;

    if(!token || !filter){
        return res.status(400).json({status: 'error', msg: 'All fields must be entered'});
    }

    try{

    jwt.verify(token, process.env.JWT_SECRET);

    let storeItems;
    if(filter == 'all'){
        storeItems = await StoreItem.find().sort({timestamp: "desc"}).lean();
    }else{
        storeItems = await StoreItem.find({category: filter}).sort({timestamp: "desc"}).lean();
    }

    if (storeItems.length === 0)
      return res
        .status(200)
        .send({ status: "ok", msg: "no products at the moment", count: 0, storeItems: [] });

    return res
      .status(200)
      .send({ status: "ok", msg: "success", storeItems, count: storeItems.length });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: "error", msg: "some error occurred", e });
  }
});

// endpoint to search through store items
router.post('/search_items', async (req, res) => {
    const {token, search_string, pagec} = req.body;

    if(!token || !search_string || search_string == '' || search_string == undefined){
        return res.status(400).send({status: 'error', msg: 'All fields must be entered'});
    }

    try{
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 1000;
        let page = pagec >= 1 ? pagec : 1;
        page = page -1;

        // exclude other fields in the document

        const storeItems = await StoreItem.find({
            '$or': [
            {product_name: new RegExp(search_string, 'i')},
            {category: new RegExp(search_string, 'i')}
        ]})
        .sort({timestamp: "desc"})
        .limit(resultsPerPage)
        .skip(resultsPerPage * page)
        .lean();

        if(storeItems.length === 0){
            return res.status(200).send({status: 'ok', msg: 'No store items found', count: storeItems.length, storeItems});
        }

        return res.status(200).send({status: 'ok', msg: 'Success', count: storeItems.length, storeItems});

    }catch (e){
        console.log(e);
        return res.status(400).send({status: 'error', msg: e});
    }

});

module.exports = router;