//  OpenShift sample Node application
var express    = require('express'),
    app        = express(),
    morgan     = require('morgan'),
    request    = require('request');
    
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

app.get('/healthz', function (req, res) {
  // FIXME - Should check health somehow ...
  res.send('Healthy')
});

app.get('/metrics', function (req, res) {
  // FIXME - Should actually show metrics
  res.send('# Not implemented')
});

app.post('/alert', function (req, res) {
  if (!req.body) return res.sendStatus(400)
  //console.log(JSON.stringify(req.body))
  var bigPandaAlerts = []
  for (alertNumber in req.body.alerts) {
    var alertData = req.body.alerts[alertNumber]
    if (process.env.DEBUG == 'true' ) {
      console.log('DEBUG prometheus alert: ', JSON.stringify(alertData))
    }
    //console.log(JSON.stringify(alertData))
    console.log(
      "Reporting on " + alertData.labels.alertname +
      " is " + alertData['status']
    )
    var bigPandaAlert = {
      "host": alertData.labels.job,
      "check": alertData.labels.alertname,
      "description": alertData.annotations.message,
      "cluster": alertData.labels.cluster,
      "startsAt": alertData.startsAt,
      "endsAt": alertData.endsAt,
      "generatorURL": alertData.generatorURL
    }
    if (alertData['status'] == 'firing') {
      if (alertData['labels']['severity'] == 'critical') {
        bigPandaAlert['status'] = 'critical'
      } else {
        bigPandaAlert['status'] = 'warning'
      }
    } else {
      bigPandaAlert['status'] = 'ok'
    }
    if (process.env.DEBUG == 'true' ) {
      console.log('DEBUG bigpanda alert: ', JSON.stringify(bigPandaAlert))
    }
    bigPandaAlerts.push(bigPandaAlert)
  }
  request.post({
    "url": process.env.BIGPANDA_URL,
    "headers": {
      "Authorization": "Bearer " + process.env.BIGPANDA_TOKEN,
      "Content-Type": "application/json"
    },
    "body": JSON.stringify({
      "app_key": process.env.BIGPANDA_APP_KEY,
      "alerts": bigPandaAlerts
    })
  }, (error, response, body) => {
    if (error) {
      console.log('error:', error)
    } else if(response.statusCode == 200) {
      if (process.env.DEBUG == 'true' ) {
        console.log('DEBUG received 200 OK response from bigpanda')
      }
    } else if(response.statusCode == 201) {
      if (process.env.DEBUG == 'true' ) {
        console.log('DEBUG received 201 Created response from bigpanda')
      }
    } else if(response.statusCode == 204) {
      if (process.env.DEBUG == 'true' ) {
        console.log('DEBUG received 201 No Content (deduplicated) response from bigpanda')
      }
    } else {
      console.log('send failed: ' + JSON.stringify({
        "statusCode": response.statusCode,
        "body": body
      }))
    }
  })
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
