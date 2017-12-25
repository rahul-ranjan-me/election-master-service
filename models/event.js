"use strict"

var uuid = require('node-uuid');
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var Event = require('../models/neo4j/event');

var create = function (session, dataToSend) {
  return session.run('MATCH (event:Event {name: {name}}) RETURN event', {name: dataToSend.name})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {error: 'Event already exists', status: 400}
      }
      else {
        return session.run('CREATE (event:Event {id: {id}, name: {name}, eventLevel: {eventLevel}'+
          ' , eventOrganizer: {eventOrganizer}, eventVolunteerRequired: {eventVolunteerRequired}, eventVenue: {eventVenue} }) RETURN event',
          {
            id: uuid.v4()
          , name: dataToSend.name
          , eventLevel: dataToSend.eventLevel
          , eventOrganizer: dataToSend.eventOrganizer
          , eventVolunteerRequired: dataToSend.eventVolunteerRequired
          , eventVenue: dataToSend.eventVenue
          }
        ).then(results => {
          return session.run('MATCH (user:User {api_key:{api_key}}), (event:Event {name: {name}}) Create (user)-[:EVENT_CREATED]->(event) RETURN event', {api_key: dataToSend.token, name: dataToSend.name})
            .then(res => {
              return new Event(results.records[0].get('event'));
            })
        })
      }
    });
};

module.exports = {
  create: create
};