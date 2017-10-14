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

module.exports = router;