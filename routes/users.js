var express = require('express')
  , router = express.Router()
  , Users = require('../models/users')
  , writeResponse = require('../helpers/response').writeResponse
  , writeError = require('../helpers/response').writeError
  , loginRequired = require('../middlewares/loginRequired')
  , dbUtils = require('../neo4j/dbUtils')
  , _ = require('lodash');

/**
* @swagger
* definition:
*   User:
*     type: object
*     properties:
*       id:
*         type: string
*       username:
*         type: string
*       avatar:
*         type: object
*       name:
*         type: string
*       fatherName:
*         type: string
*       address:
*         type: string
*       voterId:
*         type: string
*       email:
*         type: string
*       lokSabha:
*         type: string
*       vidhanSabha:
*         type: string
*       pinCode:
*         type: string
*       twitterId:
*         type: string
*       facebookId:
*         type: string
*       originParty:
*         type: string
*/

/**
* @swagger
* /api/v0/users/register:
*   post:
*     tags:
*     - users
*     description: Register a new user
*     produces:
*       - application/json
*     parameters:
*       - name: body
*         in: body
*         type: object
*         schema:
*           properties:
*             username:
*               type: string
*             password:
*               type: string
*             name:
*               type: string
*             fatherName:
*               type: string
*             address:
*               type: string
*             voterId:
*               type: string
*             email:
*               type: string
*             lokSabha:
*               type: string
*             vidhanSabha:
*               type: string
*             pinCode:
*               type: string
*             twitterId:
*               type: string
*             facebookId:
*               type: string
*             originParty:
*               type: string
*     responses:
*       201:
*         description: Your new user
*         schema:
*           $ref: '#/definitions/User'
*       400:
*         description: Error message(s)
*/
router.post('/register', (req, res, next) => {
  const dataToSend = {
    session : dbUtils.getSession(req)
  , username : _.get(req.body, 'username')
  , password : _.get(req.body, 'password')
  , name : _.get(req.body, 'name')
  , fatherName : _.get(req.body, 'fatherName')
  , address : _.get(req.body, 'address')
  , voterId : _.get(req.body, 'voterId')
  , email : _.get(req.body, 'email')
  , lokSabha : _.get(req.body, 'lokSabha')
  , vidhanSabha : _.get(req.body, 'vidhanSabha')
  , pinCode : _.get(req.body, 'pinCode')
  , twitterId : _.get(req.body, 'twitterId')
  , facebookId : _.get(req.body, 'facebookId')
  , originParty : _.get(req.body, 'originParty')
  , userActive: false
  , loginOTP: Math.floor(100000 + Math.random() * 900000)
  }

  if (!dataToSend.username) {
    throw {error: 'Username is required.', status: 400};
  }
  if (!dataToSend.password) {
    throw {error: 'Password field is required.', status: 400};
  }
  Users.register(dataToSend)
    .then(response => writeResponse(res, response, 201))
    .catch(next);
});

/**
* @swagger
* /api/v0/users/login:
*   post:
*     tags:
*     - users
*     description: Login
*     produces:
*       - application/json
*     parameters:
*       - name: body
*         in: body
*         type: object
*         schema:
*           properties:
*             username:
*               type: string
*             password:
*               type: string
*     responses:
*       200:
*         description: succesful login
*         schema:
*           properties:
*             token:
*               type: string
*       400:
*         description: invalid credentials
*/
router.post('/login', (req, res, next) => {
  var username = _.get(req.body, 'username');
  var password = _.get(req.body, 'password');

  if (!username) {
    throw {error: 'Username is required.', status: 400};
  }
  if (!password) {
    throw {error: 'Password is required.', status: 400};
  }

  Users.login(dbUtils.getSession(req), username, password)
    .then(response => writeResponse(res, response))
    .catch(next);
});

/**
* @swagger
* /api/v0/users/createRelations:
*   post:
*     tags:
*     - users
*     description: Login
*     produces:
*       - application/json
*     parameters:
*       - name: Authorization
*         in: header
*         type: string
*         required: true
*         description: Token (token goes here)
*       - name: body
*         in: body
*         type: object
*         schema:
*           properties:
*             username:
*               type: string
*             levelname:
*               type: string
*             rolename:
*               type: string
*             entityname:
*               type: string
*     responses:
*       200:
*         description: Volunteer relation added
*         schema:
*           properties:
*             token:
*               type: string
*       400:
*         description: invalid credentials
*/

router.post('/createRelations', (req, res, next) => {
  loginRequired(req, res, () => {
    var username = _.get(req.body, 'username')
      , levelname = _.get(req.body, 'levelname')
      , rolename = _.get(req.body, 'rolename')
      , entityname = _.get(req.body, 'entityname');

    if (!username) {
      throw {error: 'Volunteer name is missing.', status: 400};
    }
    
    Users.createRelations(dbUtils.getSession(req), username, levelname, rolename, entityname)
      .then(response => writeResponse(res, response))
      .catch(next);
    
  })
})

/**
* @swagger
* /api/v0/users/me:
*   get:
*     tags:
*     - users
*     description: Get your user
*     produces:
*       - application/json
*     parameters:
*       - name: Authorization
*         in: header
*         type: string
*         required: true
*         description: Token (token goes here)
*     responses:
*       200:
*         description: the user
*         schema:
*           $ref: '#/definitions/User'
*       401:
*         description: invalid / missing authentication
*/
router.get('/me', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization'];
    var match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1];
    Users.me(dbUtils.getSession(req), token)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});


/* ***************************************************
   Invite user 
   ************************************************** */

/**
* @swagger
* /api/v0/users/invite:
*   post:
*     tags:
*     - users
*     description: invite a new user
*     produces:
*       - application/json
*     parameters:
*       - name: Authorization
*         in: header
*         type: string
*         required: true
*         description: Token (token goes here)
*       - name: body
*         in: body
*         type: object
*         schema:
*           properties:
*             phoneNumber:
*               type: string
*             name:
*               type: string
*             fatherName:
*               type: string
*             address:
*               type: string
*             voterId:
*               type: string
*             email:
*               type: string
*             lokSabha:
*               type: string
*             vidhanSabha:
*               type: string
*             pinCode:
*               type: string
*             twitterId:
*               type: string
*             facebookId:
*               type: string
*             originParty:
*               type: string
*     responses:
*       201:
*         description: Your new invitation
*         schema:
*           $ref: '#/definitions/User'
*       400:
*         description: Error message(s)
*/
router.post('/invite', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization'];
    var match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1];
  
    const dataToSend = {
      session : dbUtils.getSession(req)
    , username : _.get(req.body, 'phoneNumber')
    , name : _.get(req.body, 'name')
    , fatherName : _.get(req.body, 'fatherName')
    , address : _.get(req.body, 'address')
    , voterId : _.get(req.body, 'voterId')
    , email : _.get(req.body, 'email')
    , lokSabha : _.get(req.body, 'lokSabha')
    , vidhanSabha : _.get(req.body, 'vidhanSabha')
    , pinCode : _.get(req.body, 'pinCode')
    , twitterId : _.get(req.body, 'twitterId')
    , facebookId : _.get(req.body, 'facebookId')
    , originParty : _.get(req.body, 'originParty')
    , userActive: false
    }

    if (!dataToSend.username) {
      throw {error: 'Phone number is required.', status: 400};
    }
    
    Users.inviteUser(dataToSend, token)
      .then(response => writeResponse(res, response, 201))
      .catch(next);
  });
});


/* ***************************************************
   Verify user 
   ************************************************** */

/**
* @swagger
* /api/v0/users/verify/{id}:
*   post:
*     tags:
*     - users
*     description: Verify a new user
*     produces:
*       - application/json
*     parameters:
*       - in: path
*         name: id
*         required: true
*         description: api key user to get
*       - name: body
*         in: body
*         type: object
*         schema:
*           properties:
*             loginOTP:
*               type: number
*     responses:
*       201:
*         description: Verification successful
*         schema:
*           $ref: '#/definitions/User'
*       400:
*         description: Error message(s)
*/
router.post('/verify/:id', (req, res, next) => {
    var token = req.params.id;

    const dataToSend = {
      session : dbUtils.getSession(req)
    , loginOTP : _.get(req.body, 'loginOTP')
    }

    if (!dataToSend.loginOTP) {
      throw {error: 'OTP is required.', status: 400};
    }
    
    Users.verify(dataToSend, token)
      .then(response => writeResponse(res, response, 201))
      .catch(next);
});

/**
* @swagger
* /api/v0/users/invite:
*   get:
*     tags:
*     - users
*     description: Get all the invited users
*     produces:
*       - application/json
*     parameters:
*       - name: Authorization
*         in: header
*         type: string
*         required: true
*         description: Token (token goes here)
*       - name: userActive
*         in: query
*         type: boolean
*         required: false
*         description: userActive
*     responses:
*       200:
*         description: the user
*         schema:
*           $ref: '#/definitions/User'
*       401:
*         description: invalid / missing authentication
*/
router.get('/invite', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization'];
    var match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'Invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1];
    Users.getAllInvitee(dbUtils.getSession(req), token, req.query.userActive)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});


/**
* @swagger
* /api/v0/users/searchPeople/{query}:
*   get:
*     tags:
*     - users
*     description: Get your user
*     produces:
*       - application/json
*     parameters:
*       - name: Authorization
*         in: header
*         type: string
*         required: true
*         description: Token (token goes here)
*       - in: path
*         name: query
*         required: true
*         description: search query to find
*     responses:
*       200:
*         description: the user
*         schema:
*           $ref: '#/definitions/User'
*       401:
*         description: invalid / missing authentication
*/
router.get('/searchPeople/:query', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization']
      , match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1]
      , query = req.params.query;

    Users.searchPeople(dbUtils.getSession(req), query)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});


/**
* @swagger
* /api/v0/users/getUserDetails/{query}:
*   get:
*     tags:
*     - users
*     description: Get your user
*     produces:
*       - application/json
*     parameters:
*       - name: Authorization
*         in: header
*         type: string
*         required: true
*         description: Token (token goes here)
*       - in: path
*         name: query
*         required: true
*         description: search query to find
*     responses:
*       200:
*         description: the user
*         schema:
*           $ref: '#/definitions/User'
*       401:
*         description: invalid / missing authentication
*/
router.get('/getUserDetails/:query', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization']
      , match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1]
      , query = req.params.query;

    Users.getUserDetails(dbUtils.getSession(req), query)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});


/**
* @swagger
* /api/v0/users/getHierarchy/{query}:
*   get:
*     tags:
*     - users
*     description: Get users hierarchy
*     produces:
*       - application/json
*     parameters:
*       - name: Authorization
*         in: header
*         type: string
*         required: true
*         description: Token (token goes here)
*       - in: path
*         name: query
*         required: true
*         description: search query to find
*     responses:
*       200:
*         description: the user
*         schema:
*           $ref: '#/definitions/User'
*       401:
*         description: invalid / missing authentication
*/
router.get('/getHierarchy/:query', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization']
      , match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1]
      , query = req.params.query;

    Users.getHierarchy(dbUtils.getSession(req), query)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

module.exports = router;