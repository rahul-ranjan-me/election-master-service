// extracts just the data from the query results

var _ = require('lodash');

var Level = module.exports = function (_node) {
  _.extend(this, {
    'id': _node.properties['id'],
    'levelname' : _node.properties['levelname']
  });
};