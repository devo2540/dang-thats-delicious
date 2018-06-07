const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

// homepage/stores tab routes
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));

// add store tab route 
router.get('/add', storeController.addStore);

// add store with image route
router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore)
);

// edit store route 
router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore)
);

// edit store route 
router.get('/stores/:id/edit', catchErrors(storeController.editStore));

// view store route 
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

// routes for tags page
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

// login routes
router.get('/login', userController.loginForm);

// register routes 
router.get('/register', userController.registerForm);

// 1. validate the registration data
// 2. register the user 
// 3. log user in after registration
router.post('/register',
    userController.validateRegister,
    userController.register,
    authController.login
);

module.exports = router;
