const fronius = require('node-fronius-solar')
//const util = require('util')
const mqtt = require('mqtt')
const client = require('prom-client')
const Gauge = client.Gauge
const express = require('express')
const parser = require('fast-xml-parser');
const he = require('he');
const axios = require('axios')

const mqttEnabled = process.env.MQTT_ENALED || false
const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883'
const mqttUser = process.env.MQTT_USER
const mqttPassword = process.env.MQTT_PW
const mqttClientId = process.env.MQTT_CLIENT_ID
const mqttTopic = process.env.MQTT_TOPIC || 'tele/solar'

const httpEnabled = process.env.HTTP_ENALED || false
const port = process.env.HTTP_PORT || 3000
const nodeMetricsPrefix = process.env.NODE_METRICS_PREFIX || ''
const prefix = process.env.METRICS_PREFIX || 'fronius_'

const refreshRateSeconds = process.env.REFRESH_RATE_SECONDS || 30
const inverterHost = process.env.INVERTER_HOST
const heaterHost = process.env.HEATER_HOST

const inverterOptions = {
  host: inverterHost,
  port: 80,
  deviceId: 1,
  version: 1
}

const additionalMqttParams = {
  username: mqttUser,
  clientId: mqttClientId,
  password: mqttPassword
}

const xmlParseOptions = {
  attributeNamePrefix : "",
  attrNodeName: false, //default is 'false'
  textNodeName : "text",
  ignoreAttributes : false,
  ignoreNameSpace : true,
  allowBooleanAttributes : false,
  parseNodeValue : true,
  parseAttributeValue : true,
  trimValues: true,
  cdataTagName: "__cdata", //default is 'false'
  cdataPositionChar: "\\c",
  parseTrueNumberOnly: false,
  arrayMode: false, //"strict"
  attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
  tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
  stopNodes: ["parse-me-as-string"]
};

let mqttClient = null

console.info('App started')

if(mqttEnabled) {
  mqttClient = mqtt.connect(mqttUrl, additionalMqttParams)
  mqttClient.on('connect', () => {
    console.info('MQTT connected to ' + mqttUrl)
  })
}

let totalWatt = null
let actualGrid = null
let actualLoad = null
let actualPV = null
let heaterTemp = null
let heaterHeatPower = null
let heaterReglerOut = null

if(httpEnabled) {
  const app = express()

  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({prefix: nodeMetricsPrefix})

  const register = client.register;

  totalWatt = new Gauge({
    name: prefix +'total_watt',
    help: 'totalWatt',
  });

  actualGrid = new Gauge({
    name: prefix +'actual_grid',
    help: 'actualGrid',
  });

  actualLoad = new Gauge({
    name: prefix +'actual_load',
    help: 'actualLoad',
  });

  actualPV = new Gauge({
    name: prefix +'actual_pv',
    help: 'actualPV',
  });

  heaterTemp = new Gauge({
    name: prefix +'heater_temp',
    help: 'heaterTemp',
  });

  heaterHeatPower = new Gauge({
    name: prefix +'heater_heat_power',
    help: 'heaterHeatPower',
  });

  heaterReglerOut = new Gauge({
    name: prefix +'heater_regler_out',
    help: 'heaterReglerOut',
  });

  app.get('/', (req, res) => {
    res.send('This is an empty index, you want to go to the <a href="/metrics">metrics</a> endpoint for data!')
  })

  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      res.status(500).end(ex);
    }
  })

  // Start the things
  app.listen(port, () => {
    console.log(`Exporter app listening at http://localhost:${port}`)
  })
}


async function getData() {
  let inverterStats = {}
  if(inverterHost) {
    const inverterJson = await fronius.GetPowerFlowRealtimeDataData(inverterOptions)
    inverterStats = {
      total_watt: inverterJson.Body.Data.Site.E_Total,
      actual_grid: inverterJson.Body.Data.Site.P_Grid,
      actual_load: inverterJson.Body.Data.Site.P_Load,
      actual_pv: inverterJson.Body.Data.Site.P_PV,
    }
  }
  let heaterstats = {}
  if(heaterHost) {
    const heaterResp = await axios.get("http://" + heaterHost + "/values.xml")
    const heaterJson = parser.parse(heaterResp.data, xmlParseOptions);
    heaterstats = {
      heater_temp: +heaterJson.values.value.find(x => x.id === `valTemperatur`).text.split(" ")[0],
      heater_heat_power: +heaterJson.values.value.find(x => x.id === `valHeatPower`).text.split(" ")[0],
      heater_regler_out: +heaterJson.values.value.find(x => x.id === `valreglerout`).text.split(" ")[0],
    }
  }
  return {
    ...inverterStats,
    ...heaterstats,
  }
}

async function getAndSend() {
  const data = await getData()
  //console.log(data)
  if(mqttEnabled) {
    await mqttClient.publish(mqttTopic, JSON.stringify(data))
  }
  if(httpEnabled) {
    if(inverterHost) totalWatt.set(data.total_watt)
    if(inverterHost) actualGrid.set(data.actual_grid)
    if(inverterHost) actualLoad.set(data.actual_load)
    if(inverterHost) actualPV.set(data.actual_pv)
    if(heaterHost) heaterHeatPower.set(data.heater_heat_power)
    if(heaterHost) heaterTemp.set(data.heater_temp)
    if(heaterHost) heaterReglerOut.set(data.heater_regler_out)
  }
}


getAndSend()

setInterval(() => {
  getAndSend();
}, refreshRateSeconds*1000);

