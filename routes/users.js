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
  , voterId : _.get(req.body, 'voterId')
  , email : _.get(req.body, 'email')
  , lokSabha : _.get(req.body, 'lokSabha')
  , vidhanSabha : _.get(req.body, 'vidhanSabha')
  , pinCode : _.get(req.body, 'pinCode')
  , twitterId : _.get(req.body, 'twitterId')
  , facebookId : _.get(req.body, 'facebookId')
  , originParty : _.get(req.body, 'originParty')
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

module.exports = router;
