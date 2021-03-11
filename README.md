[![Docker Build Status](https://img.shields.io/docker/cloud/build/tg44/fronius-solar2mqtt?style=flat-square)](https://hub.docker.com/r/tg44/fronius-solar2mqtt)

# fronius-solar2mqtt

A small service to gather data from Fronius inverters an send them to MQTT.

## Running the app

### Local install / dev
You need node 12, start with `npm i` and then `node app.js`.
For setting the MQTT you need to `export MQTT_URL=mqtt://localhost:1883` and optionally `export MQTT_USER="user" && export MQTT_PWD="pass" && MQTT_TOPIC=tele/solar` before the service start.
Also you need to add `export INVERTER_HOST=""`.

### Docker and compose
For docker you can run;
```
docker run -e MQTT_URL="mqtt://localhost:1883" -e MQTT_TOPIC=tele/solar -e INVERTER_HOST="192.168.1.254" fronius-solar2mqtt
```
For docker compose;
```
version: '3.1'
services:
  fronius-solar2mqtt:
    image: tg44/fronius-solar2mqtt
    restart: unless-stopped
    environment:
      - MQTT_URL=mqtt://localhost:1883
      - INVERTER_HOST="192.168.1.254"
      - MQTT_TOPIC=tele/solar
      - MQTT_USER=user #optional
      - MQTT_PWD=pass #optional
      - MQTT_CLIENT_ID=myFS2MQTT_client #optional
      - REFRESH_RATE_SECONDS=30 #optionally you can override the api poll rate, default is 30
```

## Support

PRs are always welcome!
