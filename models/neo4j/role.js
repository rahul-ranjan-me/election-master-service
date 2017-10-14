// extracts just the data from the query results

var _ = require('lodash');

var Role = module.exports = function (_node) {
  _.extend(this, {
    'id': _node.properties['id'],
    'rolename' : _node.properties['rolename']
  });
};