const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const jimp = require('jimp'); // resize images
const uuid = require('uuid') // unique identifier for each image uploaded

const multer = require('multer');
const multerOptions = {
    storage: multer.memoryStorage(), // read photo into storage 
    fileFilter(req, file, next) {
        // file is allowed
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({ message: 'That fileype is not allowed!' }, false); // file not allowed
        }
    }
};


exports.homePage = (req, res) => {
    console.log(req.name);
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
        next(); // skip to next middleware
        return;
    }
    const extension = req.file.mimetype.split('/')[1]; // split file name and grab only file type.
    req.body.photo = `${uuid.v4()}.${extension}`; // name file with unique identifier + extension
    // now we resize 
    const photo = await jimp.read(req.file.buffer); // jimp reads uploaded image
    await photo.resize(800, jimp.AUTO); // resize photo
    await photo.write(`./public/uploads/${req.body.photo}`); // write resized photo to filesystem
    // once we've written resized photo to filesystem, move on
    next();
};

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    await store.save();
    req.flash('success', `Successfully created ${store.name}, care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    // 1. query database for list of ALL stores
    const stores = await Store.find();

    res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
    // 1. Find the store given the id
    const store = await Store.findOne({ _id: req.params.id });
    // 2. Confirm user is owner of store 
    // **TODO**
    // 3. Render out edit form so user can update store 
    res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
    // set updated location data to be a point
    req.body.location.type = 'Point';

    // find store in database and update 
    const store = await Store.findOneAndUpdate(
        { _id: req.params.id },
        req.body,
        {
            new: true, // return the updated store instead of the old one.
            runValidators: true
        }
    ).exec();

    // redirect user to store and tell them it worked
    req.flash('success', `Successfully updated <strong>${store.name}</strong> <a href="/stores/${store.slug}"> View store </a>`)
    res.redirect(`/stores/${store._id}/edit`)

};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug }); // get slug from URL
    if (!store) return next(); // if invalid store, skip. 
    res.render('store', { store, title: store.name }); // if valid, render store page. 
};

exports.getStoresByTag = async (req, res) => {
    // get list of all stores
    const tags = await Store.getTagsList(); // custom method in models/Store.js Schema
    const tag = req.params.tag;

    res.render('tag', { tags, title: 'Tags', tag });
};