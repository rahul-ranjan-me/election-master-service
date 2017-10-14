var express = require('express')
  , path = require('path')
  , routes = require('./routes/index')
  , nconf = require('./config')
  , swaggerJSDoc = require('swagger-jsdoc')
  , methodOverride = require('method-override')
  , errorHandler = require('errorhandler')
  , bodyParser = require('body-parser')
  , setAuthUser = require('./middlewares/setAuthUser')
  , neo4jSessionCleanup = require('./middlewares/neo4jSessionCleanup')
  , writeError = require('./helpers/response').writeError;

var users = require('./routes/users')
  , party = require('./routes/party')
  , level = require('./routes/level')
  , role = require('./routes/role')
  , entity = require('./routes/entity')

var app = express()
  , api = express();

app.use(nconf.get('api_path'), api);

var swaggerDefinition = {
  info: {
    title: 'Election master App',
    version: '1.0.0',
    description: '',
  },
  host: 'election-master-service.herokuapp.com', //'localhost:4000', //'election-master-service.herokuapp.com',
  basePath: '/',
  schemes: 'https'
};

// options for the swagger docs
var options = {
  // import swaggerDefinitions
  swaggerDefinition: swaggerDefinition,
  // path to the API docs
  apis: ['./routes/*.js'],
};

// initialize swagger-jsdoc
var swaggerSpec = swaggerJSDoc(options);

// serve swagger
api.get('/swagger.json', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/docs', express.static(path.join(__dirname, 'swaggerui')));
app.set('port', nconf.get('PORT'));

api.use(bodyParser.json());
api.use(methodOverride());

//enable CORS
api.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, api_key");
  next();
});

//api custom middlewares:
api.use(setAuthUser);
api.use(neo4jSessionCleanup);

//api routes
api.use('/users', users)
api.use('/party', party)
api.use('/level', level)
api.use('/role', role)
api.use('/entity', entity)

//api error handler
api.use(function(err, req, res, next) {
  if(err && err.status) {
    writeError(res, err);
  }
  else next(err);
});

app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port') + ' see docs at /docs');
});