'use strict';

var nconf = require('nconf');

nconf.env(['PORT', 'NODE_ENV'])
  .argv({
    'e': {
      alias: 'NODE_ENV',
      describe: 'Set production or development mode.',
      demand: false,
      default: 'development'
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
    'USERNAME': 'app77251898-uwVpwB',
    'PASSWORD' : 'b.LnHauo0IZ4rT.rTedr9L2YxSZVftq',
    'neo4j': 'local',
    'neo4j-local': 'bolt://localhost:7687',
    'neo4j-remote': 'bolt://hobby-dhklhpfkojekgbkeomighcpl.dbs.graphenedb.com:24786',
    'base_url': 'http://app77251898-uwVpwB:b.LnHauo0IZ4rT.rTedr9L2YxSZVftq@hobby-dhklhpfkojekgbkeomighcpl.dbs.graphenedb.com:24789',
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