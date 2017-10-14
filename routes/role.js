var express = require('express')
  , router = express.Router()
  , Role = require('../models/role')
  , writeResponse = require('../helpers/response').writeResponse
  , writeError = require('../helpers/response').writeError
  , loginRequired = require('../middlewares/loginRequired')
  , dbUtils = require('../neo4j/dbUtils')
  , _ = require('lodash');

/**
* @swagger
* /api/v0/role:
*   post:
*     tags:
*     - role
*     description: Create role
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
*             rolename:
*               type: string
*             type:
*               type: string    
*     responses:
*       200:
*         description: the role
*         schema:
*           $ref: '#/definitions/role'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Role exist or missing
*/
router.post('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var rolename = _.get(req.body, 'rolename');
    var type = _.get(req.body, 'type');

    if (!rolename) {
      throw {error: 'Role name is missing.', status: 400};
    }

    Role.create(dbUtils.getSession(req), rolename, type)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/role:
*   get:
*     tags:
*     - role
*     description: Get all roles
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
*         description: List of all Roles
*         schema:
*           $ref: '#/definitions/role'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Role not exists
*/
router.get('/', (req, res, next) => {
  loginRequired(req, res, () => {
    Role.getAllRoles(dbUtils.getSession(req))
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/role:
*   delete:
*     tags:
*     - role
*     description: Delete selected role
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
*             rolename:
*               type: string
*     responses:
*       200:
*         description: List of all Roles
*         schema:
*           $ref: '#/definitions/role'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Role not exists
*/
router.delete('/', (req, res, next) => {
  var rolename = _.get(req.body, 'rolename');

  if (!rolename) {
    throw {error: 'Please select a role to delete.', status: 400};
  }

  loginRequired(req, res, () => {
    Role.deleteRole(dbUtils.getSession(req), rolename)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/role:
*   put:
*     tags:
*     - role
*     description: Delete selected role
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
*             rolename:
*               type: string
*             updatename:
*               type: string
*             updatetype:
*               type: string
*     responses:
*       200:
*         description: Update a role
*         schema:
*           $ref: '#/definitions/role'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Role not exists
*/
router.put('/', (req, res, next) => {
  var rolename = _.get(req.body, 'rolename');
  var updatename = _.get(req.body, 'updatename');
  var updatetype = _.get(req.body, 'updatetype');

  if (!rolename) {
    throw {error: 'Please select a role to delete.', status: 400};
  }

  if(!updatetype && !updateRole){
    throw {error: 'Please update atlease on of role name or role type.', status: 400}; 
  }

  loginRequired(req, res, () => {
    Role.updateRole(dbUtils.getSession(req), rolename, updatename, updatetype)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

module.exports = router;