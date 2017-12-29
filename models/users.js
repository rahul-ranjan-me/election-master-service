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
var sendSMS = require('../helpers/senders').sendSMS;
var sendEmail = require('../helpers/senders').sendEmail;

function dataToSendRegistration(dataToSend, whetherRegistration, isFinal){
  const initData = {
        username: dataToSend.username,
        password : hashPassword(dataToSend.username, dataToSend.password),
        name: dataToSend.name,
        fatherName: dataToSend.fatherName,
        address: dataToSend.address ? dataToSend.address : '',
        voterId: dataToSend.voterId,
        email: dataToSend.email,
        lokSabha: dataToSend.lokSabha,
        vidhanSabha: dataToSend.vidhanSabha,
        pinCode: dataToSend.pinCode,
        twitterId: dataToSend.twitterId,
        facebookId: dataToSend.facebookId,
        originParty: dataToSend.originParty,
        userActive: dataToSend.userActive
      },
      registration = {
        creationDate: new Date().valueOf(),
        loginOTP: dataToSend.loginOTP
      },
      finalRegistration = {
          id: uuid.v4(),
          api_key : randomstring.generate({
            length: 20,
            charset: 'hex'
          })
        }
  if(whetherRegistration && isFinal){
    return _.extend({}, finalRegistration, initData, registration)
  }else if(whetherRegistration){
    return _.extend({}, initData, registration)
  }else if(!whetherRegistration){
    return _.extend({}, finalRegistration, initData)
  }
  return initData;
}

var register = function (dataToSend) {
  var session = dataToSend.session
    , username = dataToSend.username
    , password = dataToSend.password
    , successMessage = 'Your OTP for registration is '+dataToSend.loginOTP
    , errorMessage = 'Error while sending OTP. Please try again'
    , subject = 'Election Master India : OTP'
  return session.run('MATCH (user:User {username: {username}}) RETURN user', {username: dataToSend.username})
    .then(results => {
      if (!_.isEmpty(results.records) && new User(results.records[0].get('user')).userActive) {
        throw {error: 'username already in use', status: 400}
      }else if(!_.isEmpty(results.records)){
        return session.run('MATCH (user:User {username: {username}}) set user.password={password}, user.name={name}, ' +
           'user.fatherName={fatherName}, user.address={address}, user.voterId={voterId}, user.email={email}, user.lokSabha={lokSabha}, '+
           'user.vidhanSabha={vidhanSabha}, user.pinCode={pinCode}, user.twitterId={twitterId}, user.facebookId={facebookId}, user.originParty={originParty}, '+
           'user.creationDate={creationDate}, user.loginOTP={loginOTP} RETURN user', dataToSendRegistration(dataToSend, true))
          .then(results => {
            
            sendSMS(dataToSend.username, successMessage, errorMessage)
            if(dataToSend.email){
              sendEmail(dataToSend.email, subject, successMessage, errorMessage)
            }
            return  {api_key: _.get(results.records[0].get('user'), 'properties').api_key}
          }
        )
      }else {
        return session.run('CREATE (user:User {id: {id}, username: {username}, password: {password}, api_key: {api_key}, '+
        'name: {name}, fatherName: {fatherName}, voterId: {voterId}, email: {email}, lokSabha: {lokSabha}, vidhanSabha: {vidhanSabha}, '+
        'pinCode : {pinCode}, twitterId : {twitterId}, facebookId: {facebookId}, originParty: {originParty}, userActive:{userActive}, '+
        'creationDate:{creationDate}, loginOTP: {loginOTP}, userActive:{userActive}}) RETURN user', dataToSendRegistration(dataToSend, true, true))
         .then(results => {
            sendSMS(dataToSend.username, successMessage, errorMessage)
            if(dataToSend.email){
              sendEmail(dataToSend.email, subject, successMessage, errorMessage)
            }
            return  {api_key: _.get(results.records[0].get('user'), 'properties').api_key}
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
      let user = new User(results.records[0].get('user'))
      if(typeof user.creationDate !== 'number' && user.creationDate){
        user.creationDate = user.creationDate.toNumber()
      }
      delete user.loginOTP
      return user;
    })
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
          if(!dbUser.userActive){
            throw {error: 'User is not activated', status: 400}
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
        return session.run('CREATE (user:User {id: {id}, username: {username}, api_key: {api_key}, name: {name}, fatherName: {fatherName}, '+
        'voterId: {voterId}, email: {email}, lokSabha: {lokSabha}, vidhanSabha: {vidhanSabha}, pinCode : {pinCode}, twitterId : {twitterId}, '+
        'facebookId: {facebookId}, originParty: {originParty}, userActive: {userActive} }) RETURN user', dataToSendRegistration(dataToSend))
        .then(results => {
            return me(session, token).then(response => {
              return session.run('Match (user:User {username:{username}}), (inviteeUser:User {username: {inviteeUser} }) '+
              'Create (user)-[:HAS_INVITED]->(inviteeUser) return inviteeUser', {username: response.username, inviteeUser: dataToSend.username})                
                .then(result => {
                  var curUser = new User(results.records[0].get('user')),
                      inviteeUser = new User(result.records[0].get('inviteeUser')),
                      apiKey = _.get(result.records[0].get('inviteeUser'), 'properties').api_key,
                      subject = "Election Master India: Invitation",
                      successMessage = 'You have been invited to join our election master application by '+response.name+'. Please follow url: https://election-master.herokuapp.com/signup/'+apiKey,
                      errorMessage = 'Error occured while sending invite. You can manually ask invitee to use following link http://localhost:3000/signup/'+apiKey

                  sendSMS(inviteeUser.username, successMessage, errorMessage)

                  if(inviteeUser.email){
                    sendEmail(inviteeUser.email, subject, successMessage, errorMessage)
                  }
                  
                  return inviteeUser
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
        delete userRecord.loginOTP
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

var verify = function(dataToSend, apiKey){
  var session = dataToSend.session
    , loginOTP = dataToSend.loginOTP
  
  return session.run('MATCH (user:User {api_key: {api_key}}) RETURN user', {api_key: apiKey})
    .then(results => {
      if (_.isEmpty(results.records)) {
        throw {message: 'Invalid user', status: 400};
      }
      let savedLoginOTP = _.get(results.records[0].get('user'), 'properties').loginOTP
      
      if(savedLoginOTP === loginOTP){
        return session.run('MATCH (user:User {api_key: {api_key}}) remove user.loginOTP set user.userActive=true RETURN user', {api_key: apiKey})
          .then((res) => { return {message:'OTP Verified', status: 'success' } })
      }

      throw {message: 'Invalid OTP', status: 400};
    })
}

var searchPeople = function(session, query){
  let queryToSearch = query.toLowerCase()
  return session.run(`Match (user:User) where toLower(user.name) =~'.*${queryToSearch}.*' return user`, {query: query})
    .then(results => {
      return results.records.map(curUser => {
        var curUserDetail = new User(curUser.get('user'));
        if(typeof curUserDetail.creationDate !== 'number' && curUserDetail.creationDate){
          curUserDetail.creationDate = curUserDetail.creationDate.toNumber()
        }
        return curUserDetail
      })
    })
}

var getUserDetails  = function(session, query){
  return session.run(`Match (user:User {username: {query}}) return user`, {query: query})
    .then(results => {
      var user = new User(results.records[0].get('user'))
      if(typeof user.creationDate !== 'number' && user.creationDate){
        user.creationDate = user.creationDate.toNumber()
      }
      return user
    })
}

module.exports = {
  register: register,
  me: me,
  login: login,
  createRelations: createRelations,
  inviteUser: inviteUser,
  getAllInvitee: getAllInvitee,
  verify: verify,
  searchPeople: searchPeople,
  getUserDetails: getUserDetails
};