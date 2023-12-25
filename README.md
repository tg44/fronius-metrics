[![Docker Build Status](https://img.shields.io/docker/cloud/build/tg44/fronius-metrics?style=flat-square)](https://hub.docker.com/r/tg44/fronius-metrics)

# fronius-metrics

A small service to gather data from Fronius inverters/ohmpilot an send them to MQTT or export as prometheus metrics.

## Running the app

### Local install / dev
You need node 12, start with `npm i` and then `node app.js`.

For setting the MQTT you need to `export MQTT_URL=mqtt://localhost:1883` and `export MQTT_ENABLED=true` optionally `export MQTT_USER="user" && export MQTT_PWD="pass" && MQTT_TOPIC=tele/solar` before the service start.

For setting the HTTP you need to `export HTTP_ENABLED=true`.

Also you need to add `export INVERTER_HOST=""`.

### Docker and compose
For docker you can run;
```
docker run -e MQTT_ENABLED=true -e MQTT_URL="mqtt://localhost:1883" -e MQTT_TOPIC=tele/solar -e INVERTER_HOST="192.168.1.254" ghcr.io/tg44/fronius-metrics
```
For docker compose;
```
version: '3.1'
services:
  fronius-solar2mqtt:
    image: ghcr.io/tg44/fronius-metrics
    restart: unless-stopped
    environment:
      - INVERTER_HOST="192.168.1.254" #inverter ip, can be left out
      - HEATER_HOST="192.168.1.253" #ohmpilot ip, can be left out
      - REFRESH_RATE_SECONDS=30 #optionally you can override the api poll rate, default is 30
      - MQTT_ENALED=true #enables mqtt default false
      - MQTT_URL=mqtt://localhost:1883 #required for mqtt
      - MQTT_TOPIC=tele/solar #required for mqtt
      - MQTT_USER=user #optional
      - MQTT_PWD=pass #optional
      - MQTT_CLIENT_ID=myFS2MQTT_client #optional
      - HTTP_ENALED=true #enables prometheus default false
      - HTTP_PORT=3000 #optional
      - NODE_METRICS_PREFIX='' #optional
      - METRICS_PREFIX=fronius_ #optional
```

## Support

PRs are always welcome!
