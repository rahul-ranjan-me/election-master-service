var express = require('express')
  , router = express.Router()
  , Entity = require('../models/entity')
  , writeResponse = require('../helpers/response').writeResponse
  , writeError = require('../helpers/response').writeError
  , loginRequired = require('../middlewares/loginRequired')
  , dbUtils = require('../neo4j/dbUtils')
  , _ = require('lodash');

/**
* @swagger
* definition:
*   Entity:
*     type: object
*     properties:
*       id:
*         type: string
*       entityname:
*         type: string
*/

/**
* @swagger
* /api/v0/entity:
*   post:
*     tags:
*     - Entity
*     description: Create the entity node with given relationship
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
*             entityname:
*               type: string
*             levelname:
*               type: string
*             partOfEntityName:
*               type: string
*     responses:
*       200:
*         description: Create the entity with given relationship
*         schema:
*           $ref: '#/definitions/Entity'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: entityname or typeofentity missing
*/

router.post('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var entityname = _.get(req.body, 'entityname')
      , levelname = _.get(req.body, 'levelname')
      , partOfEntityName = _.get(req.body, 'partOfEntityName')

    if (!entityname) {
      throw {error: 'Entity name is missing.', status: 400};
    }

    Entity.createEntity(dbUtils.getSession(req), entityname, levelname, partOfEntityName)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/entity:
*   delete:
*     tags:
*     - Entity
*     description: Delete the entity
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
*             entityname:
*               type: string
*     responses:
*       200:
*         description: Delete the entity's all relation
*         schema:
*           $ref: '#/definitions/Entity'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: entityname missing
*/

router.delete('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var entityname = _.get(req.body, 'entityname')

    if (!entityname) {
      throw {error: 'Entity name is missing.', status: 400};
    }

    Entity.deleteEntity(dbUtils.getSession(req), entityname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/entity/getentity:
*   post:
*     tags:
*     - Entity
*     description: Get the entity/entities
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
*             entityname:
*               type: string
*             levelname:
*               type: string
*             partOfEntityName:
*               type: string
*     responses:
*       200:
*         description: Get the entity/entities
*         schema:
*           $ref: '#/definitions/Entity'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: entityname missing
*/

router.post('/getentity', (req, res, next) => {
  loginRequired(req, res, () => {
    var entityname = _.get(req.body, 'entityname')
      , levelname = _.get(req.body, 'levelname')
      , partOfEntityName = _.get(req.body, 'partOfEntityName')

    if (!entityname) {
      throw {error: 'Entity name is missing.', status: 400};
    }

    Entity.getEntity(dbUtils.getSession(req), entityname, levelname, partOfEntityName)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/entity:
*   put:
*     tags:
*     - Entity
*     description: Update entity and its relations
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
*             entityname:
*               type: string
*             updateentityname:
*               type: string
*     responses:
*       200:
*         description: Update entity and its relations
*         schema:
*           $ref: '#/definitions/Entity'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: entityname missing
*/

router.put('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var entityname = _.get(req.body, 'entityname')
      , updateentityname = _.get(req.body, 'updateentityname')

    if (!entityname) {
      throw {error: 'Entity name is missing.', status: 400};
    }

    if (!updateentityname) {
      throw {error: 'To update entity name is missing.', status: 400};
    }

    Entity.updateEntity(dbUtils.getSession(req), entityname, updateentityname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/entity/deleteEntityRelation:
*   delete:
*     tags:
*     - Entity
*     description: Delete the entity's specified relation
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
*             entityname:
*               type: string
*             relationname:
*               type: string
*     responses:
*       200:
*         description: Delete the entity's specified relation
*         schema:
*           $ref: '#/definitions/Entity'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: entityname or relationname missing
*/

router.delete('/deleteEntityRelation', (req, res, next) => {
  loginRequired(req, res, () => {
    var entityname = _.get(req.body, 'entityname')
      , relationname = _.get(req.body, 'relationname')

    if (!entityname) {
      throw {error: 'Entity name is missing.', status: 400};
    }

    if (!relationname) {
      throw {error: 'Relation name to delete is missing.', status: 400};
    }

    Entity.deleteEntityRelation(dbUtils.getSession(req), entityname, relationname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/entity/deleteEntityAllRelation:
*   delete:
*     tags:
*     - Entity
*     description: Delete the entity's all relations
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
*             entityname:
*               type: string
*     responses:
*       200:
*         description: Delete the entity's all relation
*         schema:
*           $ref: '#/definitions/Entity'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: entityname missing
*/

router.delete('/deleteEntityAllRelation', (req, res, next) => {
  loginRequired(req, res, () => {
    var entityname = _.get(req.body, 'entityname')

    if (!entityname) {
      throw {error: 'Entity name is missing.', status: 400};
    }

    Entity.deleteEntityAllRelation(dbUtils.getSession(req), entityname)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

module.exports = router;