const fronius = require('node-fronius-solar')
//const util = require('util')
const mqtt = require('mqtt')

const mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883'
const mqttUser = process.env.MQTT_USER
const mqttPassword = process.env.MQTT_PW
const mqttClientId = process.env.MQTT_CLIENT_ID
const mqttTopic = process.env.MQTT_TOPIC || 'tele/solar'

const refreshRateSeconds = process.env.REFRESH_RATE_SECONDS || 30
const inverterHost = process.env.INVERTER_HOST

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

const client = mqtt.connect(mqttUrl, additionalMqttParams)

console.info('App started')

client.on('connect', () => {
  console.info('MQTT connected to ' + mqttUrl)
})

async function getData() {
  const json = await fronius.GetPowerFlowRealtimeDataData(inverterOptions)
  //console.log(util.inspect(json, {depth: 4, colors: true}));
  return {
    total_watt: json.Body.Data.Site.E_Total,
    actual_grid: json.Body.Data.Site.P_Grid,
    actual_load: json.Body.Data.Site.P_Load,
    actual_pv: json.Body.Data.Site.P_PV,
  }
}

async function getAndSend() {
  const data = await getData()
  await client.publish(mqttTopic, JSON.stringify(data))
}


getAndSend()

setInterval(() => {
  getAndSend();
}, refreshRateSeconds*1000);

