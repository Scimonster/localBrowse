/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	info = require('./info'),
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

// info for parsing
app.get('/info/:action/*', info.master.get);
app.get('/info/localbrowseCWD', info.localbrowseCWD);
app.post('/info/:action', info.master.post);

// pages to render

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
