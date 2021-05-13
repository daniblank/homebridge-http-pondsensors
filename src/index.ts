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
  'airtemp_corr'?: number;
  'airtempname'?: string;
  'airhumname'?: string;
  'waterlevelname'?: string;
  'watertemperaturename'?: string;
}

class Pondsensors implements AccessoryPlugin {

  private readonly log: Logging;
  private readonly name: string;
  private readonly url: string;
  private airtemperature: number;
  private airhumidity: number;
  private waterlevel: number;
  private watertemperature: number;
  private readonly ultrasound_distance: number;
  private readonly airtemp_corr: number;

  private readonly informationService: Service;
  private readonly airtemperatureService: Service;
  private readonly airhumidityService: Service;
  private readonly waterlevelService: Service;
  private readonly watertemperatureService: Service;

  constructor(log: Logging, config: AccessoryConfig) {
    const pondConfig = config as PondsensorAccessoryConfig;
    this.log = log;
    this.name = config['name'];

    this.url = pondConfig['url'] || 'localhost';
    this.ultrasound_distance = pondConfig['ultrasound_distance'] || 0;
    this.airtemp_corr = pondConfig['airtemp_corr'] || 0;

    this.airtemperature = 0;
    this.airhumidity = 0;
    this.waterlevel = 0;
    this.watertemperature = 0;

    this.log.debug('Pondsensors Plugin Loaded');

    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Daniel Blank')
      .setCharacteristic(hap.Characteristic.Model, 'Pondsensor');

    this.airtemperatureService = new hap.Service.TemperatureSensor(pondConfig.airtempname, 'Airtemperature');
    this.airtemperatureService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentAirTemperatureGet.bind(this));

    this.airhumidityService = new hap.Service.HumiditySensor(pondConfig.airhumname, 'Airhumidity');
    this.airhumidityService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .on('get', this.handleCurrentAirHumidityGet.bind(this));

    this.waterlevelService = new hap.Service.HumiditySensor(pondConfig.waterlevelname, 'Waterlevel');
    this.waterlevelService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
      .on('get', this.handleCurrentWaterLevelGet.bind(this));
  
    // this.waterlevelService = new hap.Service.HumidifierDehumidifier(pondConfig.waterlevelname, 'Waterlevel');
    // this.waterlevelService.getCharacteristic(hap.Characteristic.WaterLevel)
    //   .on('get', this.handleCurrentWaterLevelGet.bind(this));
    // this.waterlevelService.getCharacteristic(hap.Characteristic.Active)
    //   .on('get', this.handleCurrentActiveGet.bind(this));s
    // this.waterlevelService.getCharacteristic(hap.Characteristic.CurrentHumidifierDehumidifierState)
    //   .on('get', this.handleCurrentHumidifierDehumidifierStateGet.bind(this));
    // this.waterlevelService.getCharacteristic(hap.Characteristic.TargetHumidifierDehumidifierState)
    //   .on('get', this.handleCurrentTargetHumidifierDehumidifierStateGet.bind(this));
    // this.waterlevelService.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity)
    //   .on('get', this.handleCurrentRelativeHumidityGet.bind(this));


    this.watertemperatureService = new hap.Service.TemperatureSensor(pondConfig.watertemperaturename, 'Watertemperature');
    this.watertemperatureService.getCharacteristic(hap.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentWaterTemperatureGet.bind(this));

  }

  getData() {
    (async () => {
      try {
        const response = await fetch(this.url);
        const data = await response.json();
        this.airtemperature = parseFloat(data.airtemperature) - this.airtemp_corr;
        this.airhumidity = parseFloat(data.airhumidity);
        this.waterlevel = this.ultrasound_distance - parseFloat(data.waterlevel);
        this.waterlevel = this.waterlevel > 100 ? 100 : this.waterlevel < 0 ? 0 : this.waterlevel;
        this.watertemperature = parseFloat(data.watertemperature);
      } catch (error) {
        this.log('Error: ' + error);
      }
    })();

  }

  handleCurrentAirTemperatureGet(callback) {
    this.log.info('called handleCurrentAirTemperatureGet');
    this.getData();
    callback(null, this.airtemperature);
  }

  handleCurrentAirHumidityGet(callback) {
    this.log.info('called handleCurrentAirHumidityGet');
    callback(null, this.airhumidity);
  }

  handleCurrentWaterLevelGet(callback) {
    this.log.info('called handleCurrentWaterLevelGet');
    callback(null, this.waterlevel);
  }
  
  /*
  handleCurrentActiveGet(callback) {
    this.log.info('called handleCurrentActiveGet');
    callback(null, 0);
  }

  handleCurrentHumidifierDehumidifierStateGet(callback) {
    this.log.info('called handleCurrentHumidifierDehumidifierStateGet');
    callback(null, 0);
  }

  handleCurrentTargetHumidifierDehumidifierStateGet(callback) {
    this.log.info('called handleCurrentTargetHumidifierDehumidifierStateGet');
    callback(null, 0);
  }

  handleCurrentRelativeHumidityGet(callback) {
    this.log.info('called handleCurrentRelativeHumidityGet');
    callback(null, 0);
  }
*/

  handleCurrentWaterTemperatureGet(callback) {
    this.log.info('called handleCurrentWaterTemperatureGet');
    callback(null, this.watertemperature);
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.airtemperatureService,
      this.airhumidityService,
      this.waterlevelService,
      this.watertemperatureService,
    ];
  }

}
