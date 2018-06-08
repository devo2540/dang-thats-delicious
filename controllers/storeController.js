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
    req.body.author = req.user._id; // take currently logged in user by ID and set as author.
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

// Confirm user is owner of store before editing 
const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it!')
    }
};

exports.editStore = async (req, res) => {
    // 1. Find the store given the id
    const store = await Store.findOne({ _id: req.params.id });
    // 2. Confirm user is owner of store 
    confirmOwner(store, req.user);
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
    const store = await Store.findOne({ slug: req.params.slug }).populate('author'); // get slug from URL, and populate author field with info
    if (!store) return next(); // if invalid store, skip. 
    res.render('store', { store, title: store.name }); // if valid, render store page. 
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true } // give me every store with at least one tag on it 

    const tagsPromise = Store.getTagsList(); // custom method in models/Store.js Schema
    const storesPromise = Store.find({ tags: tagQuery }); // if store contains specific tag, will filter out for us
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]); // wait for both promises to resolve, destructure into respective variables
    
    res.render('tag', { tags, title: 'Tags', tag, stores });
};

// search stores, sort by text score, highest to lowest 
exports.searchStores = async (req, res) => {
    const stores = await Store
        // first find stores that match    
        .find({
            $text: {
                $search: req.query.q
            }
        }, {
            score: { $meta: 'textScore' }
        })
        // then sort them
        .sort({
            score: { $meta: 'textScore' }
        })
        // limit to only 5 results 
        .limit(5);
    
    res.json(stores);
};