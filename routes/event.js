var express = require('express')
  , router = express.Router()
  , Events = require('../models/event')
  , writeResponse = require('../helpers/response').writeResponse
  , writeError = require('../helpers/response').writeError
  , loginRequired = require('../middlewares/loginRequired')
  , dbUtils = require('../neo4j/dbUtils')
  , _ = require('lodash');

/**
* @swagger
* definition:
*   Event:
*     type: object
*     properties:
*       id:
*         type: string
*       name:
*         type: string
*       eventLevel:
*         type: string
*       eventOrganizer:
*         type: string
*       eventVolunteerRequired:
*         type: string
*       eventVenue:
*         type: string
*/

/**
* @swagger
* /api/v0/event:
*   post:
*     tags:
*     - event
*     description: Create event
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
*             name:
*               type: string
*             eventLevel:
*               type: string
*             eventOrganizer:
*               type: string
*             eventVolunteerRequired:
*               type: string
*             eventVenue:
*               type: string   
*     responses:
*       200:
*         description: the event
*         schema:
*           $ref: '#/definitions/event'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Event exist or missing
*/

router.post('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization'];
    var match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1];

    const dataToSend = {
      token: token
    , name: _.get(req.body, 'name')
    , eventLevel: _.get(req.body, 'eventLevel')
    , eventOrganizer: _.get(req.body, 'eventOrganizer')
    , eventVolunteerRequired: _.get(req.body, 'eventVolunteerRequired')
    , eventVenue: _.get(req.body, 'eventVenue')
    , eventDate: _.get(req.body, 'eventDate')
    }

    if (!dataToSend.name) {
      throw {error: 'Event name is missing.', status: 400};
    } else if (!dataToSend.eventLevel) {
      throw {error: 'Event level is missing.', status: 400};
    } else if (!dataToSend.eventOrganizer) {
      throw {error: 'Event organizer is missing.', status: 400};
    } else if (!dataToSend.eventVolunteerRequired) {
      throw {error: 'Event volunteer is missing.', status: 400};
    } else if (!dataToSend.eventVenue) {
      throw {error: 'Event venue is missing.', status: 400};
    } else if (!dataToSend.eventDate) {
      throw {error: 'Event date is missing.', status: 400};
    }

    Events.create(dbUtils.getSession(req), dataToSend)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

/**
* @swagger
* /api/v0/event:
*   get:
*     tags:
*     - event
*     description: Get events
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
*         description: the event
*         schema:
*           $ref: '#/definitions/event'
*       401:
*         description: invalid / missing authentication
*       400:
*         description: Event exist or missing
*/

router.get('/', (req, res, next) => {
  loginRequired(req, res, () => {
    var authHeader = req.headers['authorization'];
    var match = authHeader.match(/^Token (\S+)/);
    if (!match || !match[1]) {
      throw {message: 'invalid authorization format. Follow `Token <token>`', status: 401};
    }

    var token = match[1];

    Events.getEvents(dbUtils.getSession(req), token)
      .then(response => writeResponse(res, response))
      .catch(next);
  })
});

module.exports = router;