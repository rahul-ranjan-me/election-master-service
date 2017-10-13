"use strict"

var uuid = require('node-uuid');
var randomstring = require("randomstring");
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var User = require('../models/neo4j/user');
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
        return session.run('CREATE (user:User {id: {id}, username: {username}, password: {password}, api_key: {api_key}, name: {name}, fatherName: {fatherName}, voterId: {voterId}, email: {email}, lokSabha: {lokSabha}, vidhanSabha: {vidhanSabha}, pinCode : {pinCode}, twitterId : {twitterId}, facebookId: {facebookId}, originParty: {originParty}}) RETURN user',
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
            voterId: dataToSend.voterId,
            email: dataToSend.email,
            lokSabha: dataToSend.lokSabha,
            vidhanSabha: dataToSend.vidhanSabha,
            pinCode: dataToSend.pinCode,
            twitterId: dataToSend.twitterId,
            facebookId: dataToSend.facebookId,
            originParty: dataToSend.originParty
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
    });
};

var login = function (session, username, password) {
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

module.exports = {
  register: register,
  me: me,
  login: login
};