"use strict"

var uuid = require('node-uuid');
var _ = require('lodash');
var dbUtils = require('../neo4j/dbUtils');
var Role = require('../models/neo4j/role');

var create = function (session, rolename, type) {
  return session.run('MATCH (role:Role {rolename: {rolename}}) RETURN role', {rolename: rolename})
    .then(results => {
      if (!_.isEmpty(results.records)) {
        throw {error: 'role already exists', status: 400}
      }
      else {
        return session.run('CREATE (role:Role {id: {id}, rolename: {rolename}, type: {type}}) RETURN role',
          {
            id: uuid.v4(),
            rolename: rolename,
            type: type ? type : null
          }
        ).then(results => {
          return new Role(results.records[0].get('role'));
        })
      }
    });
};

var getAllRoles = function (session) {
  return session.run('MATCH (rolename:Role {}) RETURN rolename')
    .then(results => {
      if (_.isEmpty(results)) {
        throw {error: 'No role exists', status: 400}
      }
      else {
        return results.records.map(r => new Role(r.get('rolename')));
      }
    });
};

var deleteRole = function (session, rolename) {
  return session.run('MATCH (role:Role {rolename:{rolename}}) delete role', {rolename: rolename})
    .then(result => {
      return getAllRoles(session)
    });
};

var updateRole = function (session, rolename, updatename, updatetype) {
  var query = '';
  if(updatename) {
    query += '{rolename:{updatename}}'
  }
  if(updatetype){
     query += '{type:{updatetype}}'
  }

  return session.run('MATCH (role:Role {rolename:{rolename}}) set role+='+query+' return role', {rolename: rolename, updatename: updatename ? updatename : null, updatetype: updatetype ? updatetype : null})
    .then(result => {
      if (_.isEmpty(result.records)) {
        throw {error: 'No role exists', status: 400}
      }else{
        return new Role(result.records[0].get('role'));
      }
    });
};

module.exports = {
  create: create
, getAllRoles: getAllRoles
, deleteRole: deleteRole
, updateRole: updateRole
};