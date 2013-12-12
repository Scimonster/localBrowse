/**
 * @file Entrypoint to localBrowse
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */

var express = require('express'),
	routes = require('./routes'),
	info = require('./info'),
	search = require('./search'),
	mod = require('./mod'),
	http = require('http'),
	path = require('path'),
	params = require('express-params'),
	app = express();

params.extend(app);

// all environments
app.set('port', process.env.PORT || 8000);
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
app.get('/browserify/text.js', routes.browserify.text);

// info for parsing
app.get('/info/:action/*', info.routes.get);
app.get('/info/localbrowseCWD', info.localbrowseCWD);
app.post('/info/:action', info.routes.post);
app.post('/search', search.search);
app.post('/mod', mod.master);

app.get('/programs/:program/:action', routes.programs);
app.get('/programs/editors', routes.programs);

// pages to render
app.post('/render/dir', routes.dir);
app.post('/render/ctxMenu', routes.ctxMenu);

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});
