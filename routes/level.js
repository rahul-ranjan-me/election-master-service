var express = require('express')
  , router = express.Router()
  , Level = require('../models/level')
  , writeResponse = require('../helpers/response').writeResponse
  , writeError = require('../helpers/response').writeError
  , loginRequired = require('../middlewares/loginRequired')
  , dbUtils = require('../neo4j/dbUtils')
  , _ = require('lodash');
/**
* @swagger
* definition:
*   Level:
*     type: object
*     properties:
*       id:
*         type: string
*       levelname:
*         type: string
*/

/**
* @swagger
* /api/v0/level:
*   post:
*     tags:
*     - Level
*     description: Create the level node
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
*             levelname:
*               type: string
*     responses:
*       200:
*         description: Create the level of a party
*         schema:
*           $ref: '#/definitions/level'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Partyname or Levelname missing
*/

router.post('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var partyname = _.get(req.body, 'partyname');
    var levelname = _.get(req.body, 'levelname');

    if (!partyname) {
      throw {error: 'Party name is missing.', status: 400};
    }

    if (!levelname) {
      throw {error: 'Level is missing.', status: 400};
    }

    Level.createLevel(dbUtils.getSession(req), partyname, levelname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/level:
*   get:
*     tags:
*     - Level
*     description: Return all level
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
*         description: List of all level
*         schema:
*           $ref: '#/definitions/level'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Level not exists
*/
router.get('/', (req, res, next) => {
  loginRequired(req, res, () => {
    Level.getAllLevel(dbUtils.getSession(req))
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/level/deleteAllReleationsLevel:
*   delete:
*     tags:
*     - Level
*     description: DELETE all releationship of a Level with name as input 
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
*             levelname:
*               type: string
*     responses:
*       200:
*         description: List of all level
*         schema:
*           $ref: '#/definitions/level'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: level not exists
*/
router.delete('/deleteAllReleationsLevel', (req, res, next) => {
  var levelname = _.get(req.body, 'levelname');

  if (!levelname) {
    throw {error: 'Please select a level to delete.', status: 400};
  }

  loginRequired(req, res, () => {
    Level.deleteAllReleationsLevel(dbUtils.getSession(req), levelname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/level/deleteSingleLevel:
*   delete:
*     tags:
*     - Level
*     description: DELETE Level with name as input 
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
*             levelname:
*               type: string
*     responses:
*       200:
*         description: Delete a single level without relation
*         schema:
*           $ref: '#/definitions/level'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: level not exists
*/
router.delete('/deleteSingleLevel', (req, res, next) => {
  var levelname = _.get(req.body, 'levelname');

  if (!levelname) {
    throw {error: 'Please select a level to delete.', status: 400};
  }

  loginRequired(req, res, () => {
    Level.deleteSingleLevel(dbUtils.getSession(req), levelname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/level/deleteAllHasPartyRelation:
*   delete:
*     tags:
*     - Level
*     description: DELETE all has party relationship
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
*         description: List of all level
*         schema:
*           $ref: '#/definitions/level'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: level not exists
*/
router.delete('/deleteAllHasPartyRelation', (req, res, next) => {
  loginRequired(req, res, () => {
    Level.deleteAllHasPartyRelation(dbUtils.getSession(req))
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/level/deleteRelation:
*   delete:
*     tags:
*     - Level
*     description: DELETE relation between Level and party 
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
*             levelname:
*               type: string
*             partyname:
*               type: string
*     responses:
*       200:
*         description: List of all level
*         schema:
*           $ref: '#/definitions/level'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: level not exists
*/
router.delete('/deleteRelation', (req, res, next) => {
  var levelname = _.get(req.body, 'levelname');
  var partyname = _.get(req.body, 'partyname');

  loginRequired(req, res, () => {
    Level.deleteRelation(dbUtils.getSession(req), partyname, levelname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/level:
*   put:
*     tags:
*     - Level
*     description: Input name of level, name to be amended.
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
*             levelname:
*               type: string
*             updatename:
*               type: string
*     responses:
*       200:
*         description: Update a level
*         schema:
*           $ref: '#/definitions/level'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Level not exists
*/
router.put('/', (req, res, next) => {
  var levelname = _.get(req.body, 'levelname');
  var updatename = _.get(req.body, 'updatename');

  if (!levelname) {
    throw {error: 'Please select a level to delete.', status: 400};
  }

  loginRequired(req, res, () => {
    Level.updateLevel(dbUtils.getSession(req), levelname, updatename)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

module.exports = router;