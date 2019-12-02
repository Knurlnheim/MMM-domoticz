/* global Module */

/* Magic Mirror
 * Module: Domoticz
 *
 * By Mathias Arvidsson
 */

Module.register("MMM-domoticz",{

	defaults: {
		units: config.units,
		updateInterval: 5000,
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		lang: config.language,

		initialLoadDelay: 0,
		retryDelay: 2500,

		apiBase: "http://127.0.0.1",
		apiPort: "8080",
		sensors: [
			{
				idx: "1",
				symbolon: "fa fa-user",
				symboloff: "fa fa-user-o",
				hiddenon: false,
				hiddenoff: false,
				customTitle: "",
			},
		],
	},

	firstEvent: false,
	getStyles: function() {
	    return ['font-awesome.css'];
	},




	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.title = "Loading...";
		this.scheduleUpdate(this.config.updateInterval);
		this.domosensors = [];
		this.sensors = [];
		for (var c in this.config.sensors) {
			var sensor = this.config.sensors[c];
			var newSensor = {idx:sensor.idx, symbolon:sensor.symbolon, symboloff:sensor.symboloff, hiddenon:sensor.hiddenon, hiddenoff:sensor.hiddenoff, customTitle:sensor.customTitle, status:"", sname:"",type:""};
			// console.log(sensor.idx);
			this.sensors.push(newSensor);
		}
 // console.log(this.sensors);
		  this.getData();

	},



	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (!this.loaded) {
			wrapper.innerHTML = "Loading...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		var tableWrap = document.createElement("table");
		tableWrap.className = "small";
		var nbShown = 0;
		for (var c in this.sensors) {

			var sensor = this.sensors[c];
			//Log.info("sensor :"+ JSON.stringify(sensor));

			var dindex = this.domosensors.findIndex(MyIdx => MyIdx.idx === sensor.idx);
			sensor.sname = this.domosensors[dindex].Name;
			sensor.status = this.domosensors[dindex].Data;
			sensor.type = this.domosensors[dindex].Type;
			if (sensor.type == "Wind") {
				sensor.statexp = sensor.status.split(";");
				var wind = sensor.statexp[2]*.36;
				var gust = sensor.statexp[3]*.36;
				sensor.status = sensor.statexp[1] + ", " + wind.toFixed() + " km/h (" + gust.toFixed() + " km/h)"
			}
			//Log.info("sensor :"+ JSON.stringify(sensor));



			if((sensor.status=="On" && sensor.hiddenon)||(sensor.status=="Off" && sensor.hiddenoff)) continue;
			nbShown += 1;
			var sensorWrapper = document.createElement("tr");
			sensorWrapper.className = "normal";

			var symbolTD = document.createElement('td');
			symbolTD.className = "symbol";
			var symbol = document.createElement("span");
			var symbolClass = sensor.symboloff
			if(sensor.status=="On") symbolClass = sensor.symbolon
			symbol.className = symbolClass;
			symbolTD.appendChild(symbol);
			sensorWrapper.appendChild(symbolTD);

			var titleTD = document.createElement('td');
			titleTD.className = "title bright";
			if(sensor.status=="Off") titleTD.className = "title light";
			titleTD.innerHTML = sensor.sname;
			if(typeof sensor.customTitle !== 'undefined') titleTD.innerHTML = sensor.customTitle;
			sensorWrapper.appendChild(titleTD);

			var statusTD = document.createElement('td');
			statusTD.className = "time light";
			statusTD.innerHTML = sensor.status.replace(".", ",").replace(" C", "°C");
			sensorWrapper.appendChild(statusTD);

			tableWrap.appendChild(sensorWrapper);
		}
		wrapper.appendChild(tableWrap);

		if (nbShown > 0) {
			if (this.hidden == true ) {
				this.show(1000, {lockString: this.identifier});
				//Log.info("hidden was true") ;
			}
		} else {
			if (this.hidden == false ) {
				this.hide(1000, {lockString: this.identifier});
				//Log.info("hidden was false") ;
			}
		}

		return wrapper;
	},

	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setInterval(function() {
			self.getData();
		}, nextLoad);
	},

	getData: function () {
		var req_url = this.config.apiBase + ":" + this.config.apiPort + "/json.htm?type=devices&used=true&order=Name";
		this.sendSocketNotification('DOMOTICZ_READ', req_url);
		this.loaded = false;
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "DOMOTICZ_DATA") {
		  //Log.info("received :"+ JSON.stringify(payload));
			//var domoresults = payload;
			this.domosensors = payload.result;
			//Log.info("result :"+ JSON.stringify(payload.result[0]));
			this.loaded = true;
			var fade = 500;
			this.updateDom(fade);
		}

	}

});
