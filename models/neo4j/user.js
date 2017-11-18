// extracts just the data from the query results

var _ = require('lodash');
var md5 = require('md5');

var Volunteer = module.exports = function (_node) {
  var username = _node.properties['username'];

  _.extend(this, {
    'id': _node.properties['id'],
    'username': username,
    'address': _node.properties['address'],
    'name' : _node.properties['name'],
    'fatherName' : _node.properties['fatherName'],
    'voterId' : _node.properties['voterId'],
    'email' : _node.properties['email'],
    'lokSabha' : _node.properties['lokSabha'],
    'vidhanSabha' : _node.properties['vidhanSabha'],
    'pinCode' : _node.properties['pinCode'],
    'twitterId' : _node.properties['twitterId'],
    'facebookId' : _node.properties['facebookId'],
    'originParty' : _node.properties['originParty'],
    'userActive' : _node.properties['userActive'],
    'avatar': {
      'full_size': 'https://www.gravatar.com/avatar/' + md5(username) + '?d=retro'
    }
  });
};