'use strict';

var nconf = require('nconf');

nconf.env(['PORT', 'NODE_ENV'])
  .argv({
    'e': {
      alias: 'NODE_ENV',
      describe: 'Set production or development mode.',
      demand: false,
      default: 'production'
    },
    'p': {
      alias: 'PORT',
      describe: 'Port to run on.',
      demand: false,
      default: 4000
    },
    'n': {
      alias: "neo4j",
      describe: "Use local or remote neo4j instance",
      demand: false,
      default: "remote"
    }
  })
  .defaults({
    'USERNAME': 'election-master', //'election-master', //'neo4j'
    'PASSWORD' : 'b.5CiCwMlzWaeQ.TfVHLxzjmcU1X3ag', //'b.5CiCwMlzWaeQ.TfVHLxzjmcU1X3ag', '123'
    'neo4j': 'local',
    'neo4j-local': 'bolt://localhost:7687',
    'neo4j-remote': 'bolt://hobby-pbkeelmchinmgbkemkoagepl.dbs.graphenedb.com:24786',
    'base_url': 'http://hobby-pbkeelmchinmgbkemkoagepl.dbs.graphenedb.com:24789/db/data/',
    'api_path': '/api/v0'
  });
  // .defaults({
  //   'USERNAME': 'neo4j',
  //   'PASSWORD' : '123',
  //   'neo4j': 'local',
  //   'neo4j-local': 'bolt://localhost:7687',
  //   'neo4j-remote': 'bolt:http://162.243.100.222:7687',
  //   'base_url': 'http://localhost:4000',
  //   'api_path': '/api/v0'
  // });

module.exports = nconf;