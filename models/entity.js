"use strict"

var uuid = require('node-uuid');
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var Level = require('../models/neo4j/level');
var Entity = require('../models/neo4j/entity');

var checkExistingLevelRelations = function(session, entityname, levelname, checkExisting){
  if(!checkExisting){
    return 'Create (entity)-[:HAS_LEVEL]->(level) '
  }else{
    return session.run('MATCH (entity:Entity {entityname:{entityname}}), (level:Level {levelname:{levelname}}), (entity)-[:HAS_LEVEL]->(level) return entity', {entityname: entityname, levelname: levelname })
      .then(results => {
        if (_.isEmpty(results.records)) {
          return {query: 'Create (entity)-[:HAS_LEVEL]->(level) '}
        }
        else {
          return {query: ' '}
        }
      })
    .catch(err => {
      throw {error: "Relationship already exists", status: 400}
    })
  }
}

var checkExistingPartOfRelations = function(session, entityname, partOfEntityName, checkExisting){
  if(!checkExisting){
    return 'Create (entity)-[:PART_OF]->(partentity) '
  }else{
    return session.run('MATCH (entity:Entity {entityname:{entityname}}), (partentity:Entity {entityname:{partOfEntityName}}), (entity)-[:PART_OF]->(partentity) return entity', { entityname: entityname, partOfEntityName: partOfEntityName })
      .then(results => {
        if (_.isEmpty(results.records)) {
          return {query: 'Create (entity)-[:PART_OF]->(partentity) '}
        }
        else {
          return {query: ' '}
        }
      })
    .catch(err => {
      throw {error: "Relationship already exists", status: 400}
    })
  }
}

var createRelation = function(session, entityname, levelname, partOfEntityName, checkExisting){
  var query = 'MATCH (entity:Entity {entityname:{entityname}})',
      firstRelation,
      secondRelation;

  if(levelname){
    query += ', (level:Level {levelname:{levelname}})'
    //firstRelation = query + checkExistingLevelRelations(session, entityname, levelname, checkExisting)
    firstRelation = query + 'Create (entity)-[:HAS_LEVEL]->(level) '
  }
  
  if(partOfEntityName){
    query += ', (partentity:Entity {entityname:{partOfEntityName}}) '
    //secondRelation = query + checkExistingPartOfRelations(session, entityname, partOfEntityName, checkExisting)
    secondRelation = query + 'Create (entity)-[:PART_OF]->(partentity)'
  }

  return session.run(firstRelation + ' return entity', {entityname : entityname, levelname: levelname, partOfEntityName: partOfEntityName})
    .then(result => {
      return session.run(secondRelation + ' return entity', {entityname : entityname, levelname: levelname, partOfEntityName: partOfEntityName})
        .then(result => {
          return new Entity(result.records[0].get('entity'));
        })
    })
}

var createEntity = function (session, entityname, levelname, partOfEntityName) {
  return session.run('MATCH (entityname:Entity {entityname:{entityname}}) RETURN entityname', {entityname: entityname})
    .then(results => {
      if (_.isEmpty(results.records)) {
        return session.run('CREATE (entityname:Entity {id: {id}, entityname: {entityname}}) RETURN entityname',
          {
            id: uuid.v4(),
            entityname: entityname
          }
        ).then(result => {
          return createRelation(session, entityname, levelname, partOfEntityName);
        })
      }
      else {
        return createRelation(session, entityname, levelname, partOfEntityName, true);
      }
    });

};

var deleteEntityRelation = function(session, entityname, relationname) {
  session.run('Match(entity:Entity {entityname: {entityname}}), (entity)-[r:'+relationname+']->() delete r return entity', {entityname: entityname, relationname: relationname})
    .then(result => {
      return new Entity(result.records[0].get('entity'));
    })
}

var deleteEntityAllRelation = function(session, entityname) {
  session.run('Match(entity:Entity {entityname: {entityname}}), (entity)-[r:PART_OF]->() delete r , (entity)-[s:HAS_LEVEL]->() delete s return entity', {entityname: entityname})
    .then(result => {
      return new Entity(result.records[0].get('entity'));
    })
}

var getEntity = function(session, entityname, levelname, partOfEntityName){
  var query = 'Match(entity:Entity {entityname: {entityname}})'
  if(levelname){
    query += ' ,(level:Level {levelname: {levelname}})'
  }
  if(partOfEntityName){
    query += ' ,(partentity:Entity {entityname: {partOfEntityName}})'
  }
  if(levelname){
    query += ', (entity)-[:HAS_LEVEL]-(level)'
  }
  if(partOfEntityName){
    query += ', (entity)-[:PART_OF]-(partentity)'
  }

  return session.run(query+' return entity', {entityname: entityname, levelname: levelname, partOfEntityName: partOfEntityName})
    .then(results => {
      return results.records.map(r => new Entity(r.get('entity')));
    })
    .catch(error => {
      console.log(error)
      throw {error: "Some error occured", status: 400}
    })
}

var updateEntity = function(session, entityname, updateentityname){
  return session.run('Match (entity:Entity {entityname: {entityname}}) set entity+={entityname:{updateentityname}} return entity', {entityname: entityname, updateentityname: updateentityname})
    .then(result => {
      return new Entity(result.records[0].get('entity'));
    })
}

var deleteEntity =  function(session, entityname) {
  deleteEntityAllRelation(session, entityname)
    .then(result => {
      session.run('Match(entity:Entity {entityname: {entityname}})', {entityname: entityname})
        .then(result => {
          getEntity(session, entityname)
        })
    })
}

module.exports = {
  createEntity: createEntity,
  deleteEntityRelation: deleteEntityRelation,
  deleteEntityAllRelation: deleteEntityAllRelation,
  deleteEntity: deleteEntity,
  getEntity: getEntity,
  updateEntity: updateEntity
};