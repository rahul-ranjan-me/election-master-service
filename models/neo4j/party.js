// extracts just the data from the query results

var _ = require('lodash');

var Party = module.exports = function (_node) {
  _.extend(this, {
    'id': _node.properties['id'],
    'partyname' : _node.properties['partyname']
  });
};