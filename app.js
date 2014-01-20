/**
 * @file Entrypoint to localBrowse
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */

var express = require('express'),
	routes = require('./routes'),
	mod = require('./mod'),
	http = require('http'),
	path = require('path'),
	config = require('./config'),
	app = express();

// all environments
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

// end user's page
app.get('/', routes.index);

// JS files
app.get('/ugly.js', routes.uglify);
app.get('/browserify/File.js', routes.browserify.File);
app.get('/browserify/Object.js', routes.browserify.Object);
app.get('/browserify/text.js', routes.browserify.text);
app.get('/browserify/jade.js', routes.browserify.jade);

// info for parsing
app.get('/info/:action/*', routes.info.routes.get);
app.get('/info/localbrowseCWD', routes.info.cwd);
app.post('/info/:action', routes.info.routes.post);
app.post('/search', routes.search);
app.post('/mod', mod.master);

// programs
app.get('/programs/:program/:action', routes.programs);
app.get('/programs/editors', routes.programs);
app.get('/programs/alleditors', routes.programs);
app.post('/programs/:program/:action', routes.programs);
app.post('/programs/editors', routes.programs);
app.post('/programs/alleditors', routes.programs);

// config
app.get('/config', routes.config.get);
app.post('/config', routes.config.post);

app.post('/download', routes.download);

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
