"use strict"

var uuid = require('node-uuid');
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var Event = require('../models/neo4j/event');
var User = require('../models/neo4j/user');

var create = function (session, dataToSend) {
  return session.run('MATCH (event:Event {name: {name}}) RETURN event', {name: dataToSend.name})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {error: 'Event already exists', status: 400}
      }
      else {
        return session.run('CREATE (event:Event {id: {id}, name: {name}, eventLevel: {eventLevel}'+
          ' , eventOrganizer: {eventOrganizer}, eventVolunteerRequired: {eventVolunteerRequired}, eventVenue: {eventVenue}, eventDate: {eventDate} }) RETURN event',
          {
            id: uuid.v4()
          , name: dataToSend.name
          , eventLevel: dataToSend.eventLevel
          , eventOrganizer: dataToSend.eventOrganizer
          , eventVolunteerRequired: dataToSend.eventVolunteerRequired
          , eventVenue: dataToSend.eventVenue
          , eventDate: dataToSend.eventDate
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

var getEvents = function(session, token) {
  let events = {
    myEvents: []
  , parentEvents: {}
  , childEvents: {}
  }
  return session.run('Match (user:User {api_key:{token}})-[r:EVENT_CREATED]-(event:Event) return event', {token: token})
    .then(results => {
      events.myEvents.push(results.records.map(r => new Event(r.get('event'))))
      return session.run('Match (user:User {api_key:{token}})<-[r:HAS_INVITED*]-(n:User)-[k:EVENT_CREATED*]-(event:Event) return n, event', {token: token})
      .then(results => {
        results.records.map((r) => {
          var user = new User(r.get('n'))
            , event = new Event(r.get('event'))

          if(event) {
            if(!events.parentEvents[user.username]) events.parentEvents[user.username] = []
            events.parentEvents[user.username].push(_.extend({}, {organizer: user.name}, event))
          }
        })

        return session.run('Match (user:User {api_key:{token}})-[r:HAS_INVITED*]->(n:User)-[k:EVENT_CREATED*]-(event:Event) return n, event', {token: token})
          .then(results => {
            
          results.records.map((r) => {
            var childUser = new User(r.get('n'))
              , childEvent = new Event(r.get('event'))

            if(childEvent) {
              if(!events.childEvents[childUser.username]) events.childEvents[childUser.username] = []
              events.childEvents[childUser.username].push(_.extend({}, {organizer: childUser.name}, childEvent))
            }
          })
          return events
        })
      })
    })
}

module.exports = {
  create: create
, getEvents: getEvents
};