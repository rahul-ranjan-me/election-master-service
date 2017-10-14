"use strict"

var uuid = require('node-uuid');
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var Party = require('../models/neo4j/party');
var Level = require('../models/neo4j/level');

var createRelation = function(session, partyname, levelname) {
  return session.run('MATCH (party:Party {partyname:{partyname}}), (level:Level {levelname:{levelname}}) Create(level)-[:HAS_PARTY]->(party) return party', { partyname: partyname, levelname: levelname })
    .then(results => {
      if (_.isEmpty(results.records)) {
        throw {error: "Party doesn't exists", status: 400}
      }
      else {
        return new Party(results.records[0].get('party'));
      }
    })
}

var isRelationExists = function(session, partyname, levelname) {
  return session.run('MATCH (party:Party {partyname:{partyname}}), (level:Level {levelname:{levelname}}), (level)-[:HAS_PARTY]->(party) return party', { partyname: partyname, levelname: levelname })
    .then(results => {
      if (_.isEmpty(results.records)) {
        return createRelation(session, partyname, levelname);
      }
      else {
        throw {error: 'Relationship already exists.', status: 400}
      }
    })
}

var createLevel = function (session, partyname, levelname) {
  return session.run('MATCH (levelname:Level {levelname:{levelname}}) RETURN levelname', {levelname: levelname})
    .then(results => {
      if (_.isEmpty(results.records)) {
        return session.run('CREATE (levelname:Level {id: {id}, levelname: {levelname}}) RETURN levelname',
          {
            id: uuid.v4(),
            levelname: levelname
          }
        ).then(result => {
          return createRelation(session, partyname, levelname);
        })
      }
      else {
        return isRelationExists(session, partyname, levelname);
      }
    });

};

var getAllLevel = function (session) {
  return session.run('MATCH (levelname:Level {}) RETURN levelname')
    .then(results => {
      if (_.isEmpty(results)) {
        throw {error: 'No level exists', status: 400}
      }
      else {
        return results.records.map(r => new Level(r.get('levelname')));
      }
    });
};

var deleteAllReleationsLevel = function (session, levelname) {
  return session.run('MATCH (level:Level {levelname:{levelname}}) -[r:HAS_PARTY]- () delete r', {levelname: levelname})
    .then(result => {
      return {success: 'All relationshiop of level "'+levelname+'" have been deleted'}
    });
};

var deleteSingleLevel = function (session, levelname) {
  return session.run('MATCH (level:Level {levelname:{levelname}}) delete level', {levelname: levelname})
    .then(result => {
      return getAllLevel(session)
    })
    .catch(error => {
      console.log(error)
      throw {error: 'Cannot delete node, because it still has relationships. To delete this node, you must first delete its relationships.', status: 400}
    });
};

var deleteAllHasPartyRelation = function (session) {
  return session.run('MATCH () -[r:HAS_PARTY]- () delete r')
    .then(result => {
      return getAllLevel(session)
    });
};

var deleteRelation = function (session, partyname, levelname) {
  return session.run('MATCH (:Party {partyname:{partyname}}) - [r:HAS_PARTY] - (:Level {levelname:{levelname}}) delete r', {partyname: partyname, levelname: levelname})
    .then(result => {
      return getAllLevel(session)
    })
    .catch(error => {
      throw {error: 'Related nodes not found.', status: 400}
    }) 
};

var updateLevel = function (session, levelname, updatename) {
  return session.run('MATCH (level:Level {levelname:{levelname}}) set level+={levelname:{updatename}} return level', {levelname: levelname, updatename: updatename})
    .then(result => {
      if (_.isEmpty(result.records)) {
        throw {error: 'No level exists', status: 400}
      }else{
        return new Level(result.records[0].get('level'));
      }
    });
};

module.exports = {
  createLevel: createLevel
, getAllLevel: getAllLevel
, deleteAllReleationsLevel: deleteAllReleationsLevel
, updateLevel: updateLevel
, deleteSingleLevel: deleteSingleLevel
, deleteAllHasPartyRelation: deleteAllHasPartyRelation
, deleteRelation: deleteRelation
};