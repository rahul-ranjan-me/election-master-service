// extracts just the data from the query results

var _ = require('lodash');

var Level = module.exports = function (_node) {
  _.extend(this, {
    'id': _node.properties['id'],
    'name' : _node.properties['name'],
    'eventLevel' : _node.properties['eventLevel'],
    'eventOrganizer' : _node.properties['eventOrganizer'],
    'eventVolunteerRequired' : _node.properties['eventVolunteerRequired'],
    'eventVenue' : _node.properties['eventVenue'],
    'eventDate' : _node.properties['eventDate']
  });
};