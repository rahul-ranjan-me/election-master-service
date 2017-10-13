var express = require('express')
  , router = express.Router()
  , Party = require('../models/party')
  , writeResponse = require('../helpers/response').writeResponse
  , writeError = require('../helpers/response').writeError
  , loginRequired = require('../middlewares/loginRequired')
  , dbUtils = require('../neo4j/dbUtils')
  , _ = require('lodash');

/**
* @swagger
* /api/v0/party:
*   post:
*     tags:
*     - party
*     description: Create party
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
*             partyname:
*               type: string
*     responses:
*       200:
*         description: the party
*         schema:
*           $ref: '#/definitions/party'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Partyname exist or missing
*/
router.post('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var partyname = _.get(req.body, 'partyname');

    if (!partyname) {
      throw {error: 'Party name is missing.', status: 400};
    }

    Party.create(dbUtils.getSession(req), partyname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/party:
*   get:
*     tags:
*     - party
*     description: Get all parties
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
*         description: List of all parties
*         schema:
*           $ref: '#/definitions/party'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Party not exists
*/
router.get('/', (req, res, next) => {
  loginRequired(req, res, () => {
    Party.getAllParties(dbUtils.getSession(req))
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/party:
*   delete:
*     tags:
*     - party
*     description: Delete selected party
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
*             partyname:
*               type: string
*     responses:
*       200:
*         description: List of all parties
*         schema:
*           $ref: '#/definitions/party'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Party not exists
*/
router.delete('/', (req, res, next) => {
  var partyname = _.get(req.body, 'partyname');

  if (!partyname) {
    throw {error: 'Please select a party to delete.', status: 400};
  }

  loginRequired(req, res, () => {
    Party.deleteParty(dbUtils.getSession(req), partyname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/party:
*   put:
*     tags:
*     - party
*     description: Delete selected party
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
*             partyname:
*               type: string
*             updatename:
*               type: string
*     responses:
*       200:
*         description: Update a party
*         schema:
*           $ref: '#/definitions/party'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Party not exists
*/
router.put('/', (req, res, next) => {
  var partyname = _.get(req.body, 'partyname');
  var updatename = _.get(req.body, 'updatename');

  if (!partyname) {
    throw {error: 'Please select a party to delete.', status: 400};
  }

  loginRequired(req, res, () => {
    Party.updateParty(dbUtils.getSession(req), partyname, updatename)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

module.exports = router;