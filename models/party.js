"use strict"

var uuid = require('node-uuid');
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var Party = require('../models/neo4j/party');

var create = function (session, partyname) {
  return session.run('MATCH (party:Party {partyname: {partyname}}) RETURN party', {partyname: partyname})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {error: 'Party already exists', status: 400}
      }
      else {
        return session.run('CREATE (party:Party {id: {id}, partyname: {partyname}}) RETURN party',
          {
            id: uuid.v4(),
            partyname: partyname
          }
        ).then(results => {
          return new Party(results.records[0].get('party'));
        });
      }
    });
};

var getAllParties = function (session) {
  return session.run('MATCH (partyname:Party {}) RETURN partyname')
    .then(results => {
      if (_.isEmpty(results)) {
        throw {error: 'No party exists', status: 400}
      }
      else {
        return results.records.map(r => new Party(r.get('partyname')));
      }
    });
};

var deleteParty = function (session, partyname) {
  return session.run('MATCH (party:Party {partyname:{partyname}}) delete party', {partyname: partyname})
    .then(result => {
      return getAllParties(session)
    });
};

var updateParty = function (session, partyname, updatename) {
  return session.run('MATCH (party:Party {partyname:{partyname}}) set party+={partyname:{updatename}} return party', {partyname: partyname, updatename: updatename})
    .then(result => {
      if (_.isEmpty(result.records)) {
        throw {error: 'No party exists', status: 400}
      }else{
        return new Party(result.records[0].get('party'));
      }
    });
};

module.exports = {
  create: create
, getAllParties: getAllParties
, deleteParty: deleteParty
, updateParty: updateParty
};