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

var getEvents = function(session, token) {
  let events = {
    myEvents: []
  , parentEvents: []
  , childEvents: []
  }
  return session.run('Match (user:User {api_key:{token}})-[r:EVENT_CREATED]-(event:Event) return event', {token: token})
    .then(results => {
      events.myEvents.push(results.records.map(r => new Event(r.get('event'))))
      return session.run('Match (user:User {api_key:{token}})<-[r:HAS_INVITED*]-(parentUser:User) return parentUser', {token: token})
      .then(results => {
        for (var i=0; i<results.records.length; i++){
          var curRecord = results.records[i]
          var curUser = new User(curRecord.get('parentUser'))
          return session.run('Match (user:User {username:{username}})-[r:EVENT_CREATED]-(myEvent:Event) return myEvent', {username: curUser.username})
            .then(results => {
              console.log(results.records, curUser)
              events.parentEvents.push({[curUser.username]: []})
              //events.parentEvents[curUser.username].push(results.records.map(r => new Event(r.get('event'))))
            })
        }
        return events

        
        // results.records.each(r => {
        //   var curUser = new User(r.get('parentUser'))
        //   return session.run('Match (user:User {username:{username}})-[r:EVENT_CREATED]-(myEvent:Event) return myEvent', {username: curUser.username})
        //     .then(results => {
        //       //-[r:EVENT_CREATED]-(event:Event) 
        //       console.log(curUser)
        //       events.parentEvents.push({[parentUser.username]: []})
        //       //events.parentEvents[parentUser.username].push(results.records.map(r => new Event(r.get('event'))))
              
        //     })
        //     .catch(err => console.log(err))
        // })
        
      })
    })
}

module.exports = {
  create: create
, getEvents: getEvents
};