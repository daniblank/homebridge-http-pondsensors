import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  Service,
} from 'homebridge';

import fetch from 'node-fetch';
let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('Pondsensors', Pondsensors);
};

interface PondsensorAccessoryConfig extends AccessoryConfig {
	'url'?: string;
	'ultrasound_distance'?: number;
}

class Pondsensors implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly url: string;
  private airtemperature: number;
  private airhumidity: number;
  private soilhumidity: number;
  private waterlevel: number;
  private watertemperature: number;
  private readonly ultrasound_distance: number;

  private readonly informationService: Service;
  private readonly airtemperatureService: Service;
  private readonly airhumidityService: Service;
  private readonly soilhumidityService: Service;
  private readonly waterlevelService: Service;
  private readonly watertemperatureService: Service;

  constructor(log: Logging, config: AccessoryConfig, api: API) {
    const pondConfig = config as PondsensorAccessoryConfig;
    this.log = log;
    this.name = config['name'];

    this.url = pondConfig['url'] || 'localhost';
    this.ultrasound_distance = pondConfig['ultrasound_distance'] || 0;

    this.airtemperature = 0;
    this.airhumidity = 0;
    this.soilhumidity = 0;
    this.waterlevel = 0;
    this.watertemperature = 0;

    this.log.debug('Pondsensors Plugin Loaded');

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Daniel Blank')
      .setCharacteristic(hap.Characteristic.Model, 'Pondsensor');

    this.airtemperatureService = new hap.Service.TemperatureSensor(this.name);
    this.airtemperatureService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentAirTemperatureGet.bind(this));

    this.airhumidityService = new hap.Service.HumiditySensor(this.name);
    this.airhumidityService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .on('get', this.handleCurrentAirHumidityGet.bind(this));

    this.soilhumidityService = new hap.Service.HumiditySensor(this.name);
    this.soilhumidityService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .on('get', this.handleCurrentSoilHumidityGet.bind(this));

    this.waterlevelService = new hap.Service.HumidifierDehumidifier(this.name);
    this.waterlevelService.getCharacteristic(hap.Characteristic.WaterLevel)
      .on('get', this.handleCurrentWaterLevelGet.bind(this));

    this.watertemperatureService = new hap.Service.TemperatureSensor(this.name);
    this.watertemperatureService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentWaterTemperatureGet.bind(this));

  }

  getData() {
    (async () => {
      try {
        const response = await fetch('http://192.168.1.7/');
        const data = await response.json();
        this.airtemperature = parseFloat(data.airtemperature);
        this.airhumidity = parseFloat(data.airhumidity);
        this.soilhumidity = parseFloat(data.soilhumidity);
        this.waterlevel = this.ultrasound_distance - parseFloat(data.waterlevel);
        this.watertemperature = parseFloat(data.watertemperature);
      } catch (error) {
        this.log('Error: ' + error);
      }
    })();

  }

  handleCurrentAirTemperatureGet(callback) {
    this.log.info('called handleCurrentAirTemperatureGet');
    this.getData();
    this.airtemperatureService.setCharacteristic(
      hap.Characteristic.CurrentTemperature,
      this.airtemperature,
    );
    callback(null, this.airtemperature);
  }

  handleCurrentAirHumidityGet(callback) {
    this.log.info('called handleCurrentAirHumidityGet');
    const value = 2;
    callback(null, value);
  }

  handleCurrentSoilHumidityGet(callback) {
    this.log.info('called handleCurrentSoilHumidityGet');
    const value = 3;
    callback(null, value);
  }

  handleCurrentWaterLevelGet(callback) {
    this.log.info('called handleCurrentWaterLevelGet');
    const value = 4;
    callback(null, value);
  }

  handleCurrentWaterTemperatureGet(callback) {
    this.log.info('called handleCurrentWaterTemperatureGet');
    const value = 5;
    callback(null, value);
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.airtemperatureService,
      this.airhumidityService,
      this.soilhumidityService,
      this.waterlevelService,
      this.watertemperatureService,
    ];
  }

}
