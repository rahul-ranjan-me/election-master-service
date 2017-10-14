var _ = require('lodash');

var Entity = module.exports = function (_node) {
  _.extend(this, {
    'id': _node.properties['id'],
    'entityname' : _node.properties['entityname']
  });
};