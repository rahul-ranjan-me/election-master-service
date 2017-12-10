"use strict"

var uuid = require('node-uuid');
var randomstring = require("randomstring");
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var User = require('../models/neo4j/user');
var Level = require('../models/neo4j/level');
var Role = require('../models/neo4j/role');
var Entity = require('../models/neo4j/entity');
var crypto = require('crypto');

var register = function (dataToSend) {
  var session = dataToSend.session
    , username = dataToSend.username
    , password = dataToSend.password
    
  return session.run('MATCH (user:User {username: {username}}) RETURN user', {username: dataToSend.username})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {error: 'username already in use', status: 400}
      }
      else {
        return session.run('CREATE (user:User {id: {id}, username: {username}, password: {password}, api_key: {api_key}, name: {name}, fatherName: {fatherName}, voterId: {voterId}, email: {email}, lokSabha: {lokSabha}, vidhanSabha: {vidhanSabha}, pinCode : {pinCode}, twitterId : {twitterId}, facebookId: {facebookId}, originParty: {originParty}, userActive:{userActive}}) RETURN user',
          {
            id: uuid.v4(),
            username: dataToSend.username,
            password : hashPassword(dataToSend.username, dataToSend.password),
            api_key : randomstring.generate({
              length: 20,
              charset: 'hex'
            }),
            name: dataToSend.name,
            fatherName: dataToSend.fatherName,
            address: dataToSend.address,
            voterId: dataToSend.voterId,
            email: dataToSend.email,
            lokSabha: dataToSend.lokSabha,
            vidhanSabha: dataToSend.vidhanSabha,
            pinCode: dataToSend.pinCode,
            twitterId: dataToSend.twitterId,
            facebookId: dataToSend.facebookId,
            originParty: dataToSend.originParty,
            userActive : dataToSend.userActive
          }
        ).then(results => {
            return new User(results.records[0].get('user'));
          }
        )
      }
    });
};

var me = function (session, apiKey) {
  return session.run('MATCH (user:User {api_key: {api_key}}) RETURN user', {api_key: apiKey})
    .then(results => {
      if (_.isEmpty(results.records)) {
        throw {message: 'invalid authorization key', status: 401};
      }
      return new User(results.records[0].get('user'));
    })
};

var login = function (session, username, password) {
  console.log(session, username, password)
  return session.run('MATCH (user:User {username: {username}}) RETURN user', {username: username})
    .then(results => {
        if (_.isEmpty(results.records)) {
          throw {error: 'Username does not exist', status: 400}
        }
        else {
          var dbUser = _.get(results.records[0].get('user'), 'properties');
          if (dbUser.password != hashPassword(username, password)) {
            throw {error: 'Username or password is wrong', status: 400}
          }
          return {token: _.get(dbUser, 'api_key')};
        }
      }
    );
};

function hashPassword(username, password) {
  var s = username + ':' + password;
  return crypto.createHash('sha256').update(s).digest('hex');
}

var createRelations = function(session, username, levelname, rolename, entityname){
  var query = 'Match (user:User {username:{username}})',
      levelRelation,
      roleRelation,
      entityRelation

  if(levelname){
    levelRelation = query + ', (level: Level {levelname: {levelname}}) Create (user)-[:HAS_LEVEL]->(level)'
  }
  if(rolename){
    roleRelation = query + ', (role: Role {rolename: {rolename}}) Create (user)-[:HAS_ROLE]->(role)'
  }
  if(entityname){
    entityRelation = query + ', (entity: Entity {entityname: {entityname}}) Create (user)-[:VOLUNTEER_OF]->(entity)'
  }

  return session.run(levelRelation + ' return user', {username: username, levelname: levelname})
    .then(result => {
      return session.run(roleRelation + ' return user', {username: username, rolename: rolename})
        .then(result => {
          return session.run(entityRelation + ' return user', {username: username, entityname: entityname})
            .then(result => {
              return new User(result.records[0].get('user'));
            })
            .catch(error => {
              throw {error: 'Error occured while creating entity relation', status: 400}
            })
        })
        .catch(error => {
          throw {error: 'Error occured while creating role relation', status: 400}
        })
    })
    .catch(error => {
      throw {error: 'Error occured while creating relation', status: 400}
    })
}

var inviteUser = function(dataToSend, token){
  var session = dataToSend.session
    , username = dataToSend.username
    
  return session.run('MATCH (user:User {username: {username}}) RETURN user', {username: dataToSend.username})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {error: 'Phone number already in use', status: 400}
      }
      else {
        return session.run('CREATE (user:User {id: {id}, username: {username}, api_key: {api_key}, name: {name}, fatherName: {fatherName}, voterId: {voterId}, email: {email}, lokSabha: {lokSabha}, vidhanSabha: {vidhanSabha}, pinCode : {pinCode}, twitterId : {twitterId}, facebookId: {facebookId}, originParty: {originParty}, userActive: {userActive}}) RETURN user',
          {
            id: uuid.v4(),
            username: dataToSend.username,
            api_key : randomstring.generate({
              length: 20,
              charset: 'hex'
            }),
            name: dataToSend.name,
            fatherName: dataToSend.fatherName,
            address: dataToSend.address,
            voterId: dataToSend.voterId,
            email: dataToSend.email,
            lokSabha: dataToSend.lokSabha,
            vidhanSabha: dataToSend.vidhanSabha,
            pinCode: dataToSend.pinCode,
            twitterId: dataToSend.twitterId,
            facebookId: dataToSend.facebookId,
            originParty: dataToSend.originParty,
            userActive : dataToSend.userActive
          }
        ).then(results => {
            return me(session, token).then(response => {
              return session.run('Match (user:User {username:{username}}), (inviteeUser:User {username: {inviteeUser} }) Create (user)-[:HAS_INVITED]->(inviteeUser) return inviteeUser', {username: response.username, inviteeUser: dataToSend.username})                
                .then(result => {
                  return new User(result.records[0].get('inviteeUser'));
                })
                .catch(error => {
                  throw {error: 'Error occured while creating invitee relation', status: 400}
                })
            })
        })
      }
    });
}

var getAllInvitee = function (session, apiKey, userActive) {
  return session.run('Match (:User {api_key:{api_key}})-[:HAS_INVITED]-(b) return b', {api_key: apiKey})
    .then(results => {
      var records = [];
      results.records.map((record) => {
        const userRecord = new User(record.get('b'));
        if(userActive){
          if(userRecord.userActive.toString() && userRecord.userActive.toString() == userActive){
            records.push(userRecord)
          }
        }else{
          records.push(userRecord)
        }
      })
      return records;
    })
};

module.exports = {
  register: register,
  me: me,
  login: login,
  createRelations: createRelations,
  inviteUser: inviteUser,
  getAllInvitee: getAllInvitee
};