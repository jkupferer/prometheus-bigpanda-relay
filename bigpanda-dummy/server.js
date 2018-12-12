//  OpenShift sample Node application
var express    = require('express'),
    app        = express(),
    morgan     = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))
app.use(express.json())

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'

app.get('/', function (req, res) {
  // FIXME - Should show useful information...
  res.send('Hello, World')
});

app.post('/alert', function (req, res) {
  if (!req.body) return res.sendStatus(400)
  console.log(JSON.stringify(req.body))
  res.send('"ok"')
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
