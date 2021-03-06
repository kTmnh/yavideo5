﻿var YAVideo5 = YAVideo5 || (function () {
	function YAVideo5(config) {
		//Error handling for argument error
		if (typeof config === "undefined") {
			throw new Error("new YAVideo5(): Invalid argument. Argument is missing");
		} else if (typeof config !== "object") {
			throw new Error("new YAVideo5(): Invalid argument. Argument must be an Object");
		}
		//Set variables from config object. If not specified, then set default (|| value).
		autoplay = config["autoplay"] || false;
		preload = config["preload"] || "metadata";
		loop = config["loop"] || false;
		muted = config["muted"] || false;
		poster = config["poster"] || "";
		controls = config["controls"] || false;
		html5Video = config["html5Video"] || null;
		flashVideo = config["flashVideo"] || null;
		videoElement = config["videoElement"] || null;
		objectElement = config["objectElement"] || null;
		playButton = config["playButton"] || null;
		pauseButton = config["pauseButton"] || null;
		forwardButton = config["forwardButton"] || null;
		rewindButton = config["rewindButton"] || null;
		forwardTime = config["forwardTime"] || 30;
		rewindTime = config["rewindTime"] || 30;
		seekbar = config["seekbar"] || null;
		seekHandle = config["seekHandle"] || null;
		progressBar = config["progressBar"] || null;
		bufferedBar = config["bufferedBar"] || null;
		currentTimeDisplay = config["currentTimeDisplay"] || null;
		durationDisplay = config["durationDisplay"] || null;
		remainingTimeDisplay = config["remainingTimeDisplay"] || null;
		timeDisplay = config["timeDisplay"] || null;
		fullScreenButton = config["fullScreenButton"] || null;
		fullScreenTarget = config["fullScreenTarget"] || null;
		fullScreenControls = config["fullScreenControls"] || false;
		deleteUnusedElement = config["deleteUnusedElement"] || false;
		insName = config["insName"] || null;
		//Initializing flow
		p.checkSource().setSeekbar().setBufferedBar().setButtons().initEvents();
		//Public functions
		this["getCurrentTime"] = p.getCurrentTime;
		this["getDuration"] = p.getDuration;
		this["play"] = p.play;
		this["pause"] = p.pause;
		this["seek"] = p.seek;
		this["onStart"] = p.onStart;
		this["onTimeUpdate"] = p.onTimeUpdate;
		this["onComplete"] = p.onComplete;
		this["requestFullScreen"] = p.requestFullScreen;
		this["cancelFullScreen"] = p.cancelFullScreen;
		this["setVolume"] = p.setVolume;
		this["getVolume"] = p.getVolume;
		this["when"] = p.when;
		this["changePlaybackRate"] = p.changePlaybackRate;
		//Set public so that swf can call throught ExternalInterface
		if (!useHTML5) {
			//this["loadedmetadataListener"] = p.loadedmetadataListener;
			//this["canplayListener"] = p.canplayListener;
			this["durationchangeListener"] = p.durationchangeListener;
			this["timeupdateListener"] = p.timeupdateListener;
			this["playListener"] = p.playListener;
			this["pauseListener"] = p.pauseListener;
			this["endedListener"] = p.endedListener;
			this["updateBufferedBar"] = p.updateBufferedBar;
		}
	}
		//If the UA support HTML5 Video && the config has playable source available, then true. 
	var useHTML5,
		//Variable (instance) name of you created (new-ed). This variable is necessary for Flash fallback
		//in order to detect the player from Flash's script to execute the player's JavaScript methods through ExternalInterface.
		varName,
		deleteUnusedElement,
		//MediaElement related variables
		autoplay, preload, loop, muted, poster, controls, duration, currentTime, playbackRate = 1,
		isPlaying, isSeeking, isFullScreen,
		hasTouchEvent, lteIE8,
		bufferedLength = 1, maxBufferedLength = 1,
		//Current source from multiple sources of html5Video var.
		src,
		//File type of current source.
		fileType,
		//SWF related vars
		swfInitialized,
		//Playable HTML5 Video file type list. Checked by canPlayType method.
		html5VideoFileTypeList = {
			m3u8: false,
			mp4: false,
			webm: false,
			ogv: false
		},
		//HTML5 Video source object
		//{m3u8: "example.m3u8", mp4: "example.mp4", webm: "example.webm", ogv: "example.ogv"}
		html5Video,
		//Flash Video source
		flashVideo,
		//DOM Elements
		videoElement, objectElement, playButton, pauseButton, forwardButton, rewindButton, seekbar, seekHandle, progressBar,
		currentTimeDisplay, durationDisplay, remainingTimeDisplay, timeDisplay,
		fullScreenButton, fullScreenTarget,
		//Show browser built-in controller on fullscreen, then true.
		fullScreenControls,
		//Seekbar related vars
		seekbarWidth, handleWidth, seekOffset, seekbarX,
		//Forward & Rewind time in seconds
		forwardTime, rewindTime,
		//Callback store
		startFunction = function () {}, timeupdateFunction = function () {}, completeFunction = function () {},
		//when() method's time and function store used only for SWF.
		whenTime = [], whenFuncs = [], whenRemove = [], whenFired = false,
		//prototype
		p = this.prototype = {
			//Check available & playable source
			checkSource: function () {
				if (html5Video === null && flashVideo === null) {
					throw new Error("checkSource(): Configuration error. At least 1 video source required.");
				}
				//If there is no video source for HTML5, then use Flash.
				if (html5Video === null) {
					src = flashVideo;
					useHTML5 = false;
				} else {
					//Update html5VideoFileTypeList
					for (var extension in html5VideoFileTypeList) {
						//Get MIME Type from extension
						var mimeType = p.extensionToMimeType(extension);
						//Check canPlayType
						html5VideoFileTypeList[extension] = p.checkCanPlayType(videoElement, mimeType);
						//If UA supports a file type && an source available, then set the source to src
						if (html5VideoFileTypeList[extension] && html5Video[extension]) {
							useHTML5 = true;
							src = html5Video[extension];
							fileType = extension;
							break;
						}
					}
				}
				if (deleteUnusedElement) {
					if (useHTML5) {
						objectElement.parentNode.removeChild(objectElement);
					} else {
						videoElement.parentNode.removeChild(videoElement);
					}
				}
				//Check if the browser is less than or equal to IE 8
				lteIE8 = p.isLteIE8();
				return this;
			},
			/* Set seekbar vars from elements.
			 * If you change seekbar width dynamically on window.onresize event etc.,
			 * then call this method with events.
			 */
			setSeekbar: function () {
				if (seekbar) {
					seekbarWidth = seekbar.offsetWidth;
					handleWidth = seekHandle.offsetWidth;
					seekOffset = handleWidth / 2;
				}
				return this;
			},
			/* Set buffered bar.
			 * First, set id attribute for buffered bar so that duplicated after by updateBufferedBar().
			 */
			setBufferedBar: function () {
				if (bufferedBar) {
					bufferedBar.setAttribute("id", "buffered0");
				}
				return this;
			},
			setButtons: function () {
				hasTouchEvent = p.hasTouchEvent();
				var clickEvent = (hasTouchEvent) ? "touchend" : "click";
				var mousedownEvent = (hasTouchEvent) ? "touchstart" : "mousedown";
				if (playButton) playButton.addEventListener(clickEvent, p.clickPlay, false);
				if (pauseButton) pauseButton.addEventListener(clickEvent, p.clickPause, false);
				if (seekbar) seekbar.addEventListener(mousedownEvent, p.mousedownSeekbar, false);
				if (forwardButton) forwardButton.addEventListener(clickEvent, p.clickForward, false);
				if (rewindButton) rewindButton.addEventListener(clickEvent, p.clickRewind, false);
				return this;
			},
			//Initialize
			initEvents: function () {
				if (useHTML5) {
					p.initHTML5();
				} else {
					p.initFlash();
				}
				return this;
			},
			//Initialize HTML5 Video
			initHTML5: function () {
				videoElement.src = src;
				videoElement.muted = muted;
				videoElement.autoplay = autoplay;
				videoElement.poster = poster;
				videoElement.loop = loop;
				videoElement.preload = preload;
				videoElement.addEventListener("loadedmetadata", p.loadedmetadataListener, false);
				videoElement.addEventListener("canplay", p.canplayListener, false);
				videoElement.addEventListener("durationchange", p.durationchangeListener, false);
				videoElement.addEventListener("play", p.playListener, false);
				videoElement.addEventListener("pause", p.pauseListener, false);
				videoElement.addEventListener("timeupdate", p.timeupdateListener, false);
				videoElement.addEventListener("ended", p.endedListener, false);
				videoElement.addEventListener("error", p.errorListener, false);
				playbackRate = videoElement.defaultPlaybackRate;
				return this;
			},
			initFlash: function () {
				var useBufferedBar = (bufferedBar) ? true : false;
				//Settings object for swf
				var settings = {
					src: flashVideo,
					ins: insName,
					autoplay: autoplay,
					loop: loop,
					bufferedBar: useBufferedBar
				}
				//Check until swf ready for ExternalInterface.addCallback
				var si = setInterval(function () {
					if (objectElement.initSWF) {
						//Initialize swf
						objectElement.initSWF(settings);
						clearInterval(si);
					}
				}, 10);
			},
			/**** Video event listeners ****/
			/**** Also called from swf through EsternalInterface ****/
			//Event handler for loadedmetadata event.
			//loadedmetadata == readystate 1(HAVE_METADATA), fired when preload attribute set "metadata".
			loadedmetadataListener: function () {
				if (useHTML5) {
					duration = this.duration;
					currentTime = this.currentTime;
				} else {
					
				}
				if (timeDisplay) timeDisplay.innerHTML = p.secToMMSS(currentTime) + " / " + p.secToMMSS(duration);
				if (currentTimeDisplay) currentTimeDisplay.innerHTML = p.secToMMSS(currentTime);
				if (durationDisplay) durationDisplay.innerHTML = p.secToMMSS(duration);
				if (remainingTimeDisplay) remainingTimeDisplay.innerHTML = "-" + p.secToMMSS(duration - currentTime);
			},
			//Event handler for canplay event.
			//canplay == readystate 4(HAVE_ENOUGH_DATA), fired when preload attribute set "auto".
			canplayListener: function () {
				if (useHTML5) {
					duration = this.duration;
					currentTime = this.currentTime;
				} else {
					//TO BE WRITTEN
				}
				if (timeDisplay) timeDisplay.innerHTML = p.secToMMSS(currentTime) + " / " + p.secToMMSS(duration);
				if (currentTimeDisplay) currentTimeDisplay.innerHTML = p.secToMMSS(currentTime);
				if (durationDisplay) durationDisplay.innerHTML = p.secToMMSS(duration);
				if (remainingTimeDisplay) remainingTimeDisplay.innerHTML = "-" + p.secToMMSS(duration - currentTime);
			},
			//Event handler for durationchange event.
			durationchangeListener: function (time) {
				if (useHTML5) {
					duration = this.duration;
					currentTime = this.currentTime;
				} else {
					duration = time;
				}
				if (timeDisplay) timeDisplay.innerHTML = p.secToMMSS(currentTime) + " / " + p.secToMMSS(duration);
				if (durationDisplay) durationDisplay.innerHTML = p.secToMMSS(duration);
				if (remainingTimeDisplay) remainingTimeDisplay.innerHTML = "-" + p.secToMMSS(duration - currentTime);
			},
			//Event handler for timeupdate event.
			timeupdateListener: function (time, percent) {
				if (startFunction !== null) {
					startFunction();
					startFunction = null;
				}
				timeupdateFunction();
				if (useHTML5) {
					duration = this.duration;
					currentTime = this.currentTime;
					if (bufferedBar) {
						p.updateBufferedBar();
					}
				} else {
					currentTime = time;
					//execute when method's function at the set time
					for (var i = 0; i < whenFuncs.length; i ++) {
						if ((time | 0) == whenTime[i] && whenFired == false) {
							whenFuncs[i]();
							whenFired = true;
							if (whenRemove[i] == true) {
								whenTime.splice(i, 1);
								whenFuncs.splice(i, 1);
								whenRemove.splice(i, 1);
							}
							setTimeout(function () {
								whenFired = false;
							}, 1000);
						}
					}
				}
				if (!isSeeking) {
					if (seekHandle) {
						seekHandle.style.left = p.getSeekHandleLeft() + "px";
					}
					if (progressBar) {
						progressBar.style.width = p.getProgressBarWidth() + "px";
					}
				}
				if (timeDisplay) timeDisplay.innerHTML = p.secToMMSS(currentTime) + " / " + p.secToMMSS(duration);
				if (currentTimeDisplay) currentTimeDisplay.innerHTML = p.secToMMSS(currentTime);
				if (remainingTimeDisplay) remainingTimeDisplay.innerHTML = "-" + p.secToMMSS(duration - currentTime);
			},
			//Event handler for play event.
			playListener: function () {
				pauseButton.style.display = "block";
				playButton.style.display = "none";
				isPlaying = true;
			},
			//Event handler for pause event.
			pauseListener: function () {
				pauseButton.style.display = "none";
				playButton.style.display = "block";
				isPlaying = false;
			},
			//Event handler for ended event.
			endedListener: function () {
				if (completeFunction !== null) {
					completeFunction();
					completeFunction = null;
				}
			},
			//Event handler for error event.
			errorListener: function (e) {
				if (e.target.error !== null) {
					switch (e.target.error.code) {
						case 1:
							throw new Error("MEDIA_ERR_ABORTED");
							break;
						case 2:
							throw new Error("MEDIA_ERR_NETWORK");
							break;
						case 3:
							throw new Error("MEDIA_ERR_DECODE");
							break;
						case 4:
							throw new Error("MEDIA_ERR_SRC_NOT_SUPPORTED");
							break;
						case 5:
							throw new Error("MEDIA_ERR_ENCRYPTED");
							break;
						default:
							throw new Error("Unknown error occurred. The error code is " + e.target.error.code);
					}
				}
			},
			/* For HTML5: Duplicate bufferedBar & update bufferedBar's length, width from buffered TimeRange object
			 * For Flash: Update bufferdBar's width from bytesLoaded/bytesTotal
			 * @param percent Percent value (0-100) from swf
			 */
			updateBufferedBar: function (percent) {
				if (useHTML5) {
					var currentBuffered = videoElement.buffered;
					//If buffered.length (cached data, TimeRange) more than current bufferedBar elements,
					//duplicate bufferedBar elements as same as buffered objects
					if (bufferedLength < currentBuffered.length) {
						var diff = currentBuffered.length - bufferedLength;
						for (var i = 0; i < diff; i++) {
							var copy = bufferedBar.cloneNode(true);
							copy.setAttribute("id", "buffered" + (bufferedLength + i));
							bufferedBar.parentNode.insertBefore(copy, bufferedBar);
						}
						bufferedLength = currentBuffered.length;
						if (bufferedLength > maxBufferedLength) {
							maxBufferedLength = bufferedLength;
						}
					//If buffered.length less than current bufferedBar elements,
					//delete unnecessary elements.
					} else if (bufferedLength > currentBuffered.length) {
						bufferedLength = currentBuffered.length;
						for (var i = bufferedLength; i < maxBufferedLength; i++) {
							var temp = document.getElementById("buffered" + i);
							temp.parentNode.removeChild(temp);
						}
						maxBufferedLength = bufferedLength;
					}
					//Set bufferedBar style from start time, and end time.
					for (var i = 0; i < bufferedLength; i++) {
						var temp = document.getElementById("buffered" + i);
						temp.style.left = p.getBufferedLeft(currentBuffered.start(i), duration) + "px";
						temp.style.width = p.getBufferedWidth(currentBuffered.start(i), currentBuffered.end(i), duration) + "px";
					}
				} else {
					bufferedBar.style.width = percent + "%";
				}
			},
			/* Get bufferedBar left value from buffered object's start time and duration.
			 * @param start {Number} buffered.start(index) value in seconds
			 * @param duration {Number} video.duration
			 * @return {Number} left value in pixel
			 */
			getBufferedLeft: function (start, duration) {
				return (start / duration) * seekbarWidth | 0;
			},
			/* Get bufferedBar width value from buffered object's start time, end time and duration.
			 * @param start {Number} buffered.start(index) value in seconds
			 * @param end {Number} buffered.end(index) value in seconds
			 * @param duration {Number} video.duration
			 * @return {Number} width value in pixel
			 */
			getBufferedWidth: function (start, end, duration) {
				return ((end - start) / duration) * seekbarWidth | 0;
			},
			/* Get currentTime in seconds
			 * 
			 */
			getCurrentTime: function () {
				if (useHTML5) {
					return currentTime = videoElement.currentTime;
				} else {
					return currentTime = swf.getCurrentTimeSWF();
				}
			},
			/* Get video duration in seconds
			 * 
			 */
			getDuration: function () {
				return duration;
			},
			/* Get seekHandle left value from currentTime in pixel
			 * @return {Number} pixel
			 */
			getSeekHandleLeft: function () {
				return ((currentTime / duration) * seekbarWidth - seekOffset) | 0;
			},
			/* Get progressBar width value from currentTime in pixel.
			 * @return {Number} pixel
			 */
			getProgressBarWidth: function () {
				return ((currentTime / duration) * seekbarWidth) | 0;
			},
			/**** Mouse/Touch event handlers ****/
			//click/touchend event handler for playButton
			clickPlay: function () {
				p.play();
			},
			//click/touchend event handler for pauseButton
			clickPause: function () {
				p.pause();
			},
			//mousedown/touchstart event handler for seekbar
			mousedownSeekbar: function (e) {
				isSeeking = true;
				var temp;
				seekbarX = seekbar.getBoundingClientRect().left;
				if (hasTouchEvent) {
					temp = e.touches[0].pageX - seekbarX;
				} else {
					temp = e.clientX - seekbarX;
				}
				if (temp > 0 && temp < seekbarWidth) {
					if (seekHandle) {
						seekHandle.style.left = temp - seekOffset + "px";
					}
					if (progressBar) {
						progressBar.style.width = temp + "px";
					}
				}
				if (hasTouchEvent) {
					window.addEventListener("touchmove", p.mousemoveWindow, false);
					window.addEventListener("touchend", p.mouseleaveWindow, false);
				} else {
					//This and below mouseleaveWindow's same part are the only part for support old IE.
					if (lteIE8) {
						document.addEventListener("mousemove", p.mousemoveWindow, false);
						document.addEventListener("mouseleave", p.mouseleaveWindow, false);
						document.addEventListener("mouseup", p.mouseleaveWindow, false);
					} else {
						window.addEventListener("mousemove", p.mousemoveWindow, false);
						window.addEventListener("mouseleave", p.mouseleaveWindow, false);
						window.addEventListener("mouseup", p.mouseleaveWindow, false);
					}
				}
			},
			//mousemove/touchmove eventhandler for seekbar
			mousemoveWindow: function (e) {
				e.preventDefault();
				var temp;
				if (hasTouchEvent) {
					temp = e.touches[0].pageX - seekbarX;
				} else {
					temp = e.clientX - seekbarX;
				}
				if (temp > 0 && temp < seekbarWidth) {
					if (seekHandle) {
						seekHandle.style.left = temp - seekOffset + "px";
					}
					if (progressBar) {
						progressBar.style.width = temp + "px";
					}
				}
			},
			//mouseleave,mouseup/touchend event handler for seekbar
			mouseleaveWindow: function (e) {
				var temp, targetTime;
				if (hasTouchEvent) {
					temp = e.changedTouches[0].pageX - seekbarX;
				} else {
					temp = e.clientX - seekbarX;
				}
				if (temp < 0) {
					temp = 0;
				} else if (temp > seekbarWidth) {
					temp = seekbarWidth;
				}
				targetTime = duration * (temp / seekbarWidth);
				p.seek(targetTime);
				if (hasTouchEvent) {
					window.removeEventListener("touchmove", p.mousemoveWindow, false);
					window.removeEventListener("touchend", p.mouseleaveWindow, false);
				} else {
					if (lteIE8) {
						document.removeEventListener("mousemove", p.mousemoveWindow, false);
						document.removeEventListener("mouseleave", p.mouseleaveWindow, false);
						document.removeEventListener("mouseup", p.mouseleaveWindow, false);
					} else {
						window.removeEventListener("mousemove", p.mousemoveWindow, false);
						window.removeEventListener("mouseleave", p.mouseleaveWindow, false);
						window.removeEventListener("mouseup", p.mouseleaveWindow, false);
					}
				}
				isSeeking = false;
			},
			//click event handler for forwardButton
			clickForward: function () {
				if (!useHTML5) {
					currentTime = objectElement.getCurrentTimeSWF();
				}
				p.seek(currentTime + forwardTime);
			},
			//click event handler for rewindButton
			clickRewind: function () {
				if (!useHTML5) {
					currentTime = objectElement.getCurrentTimeSWF();
				}
				var targetTime = currentTime - rewindTime;
				if (targetTime <= 0) {
					targetTime = 0;
				}
				p.seek(targetTime);
			},
			//Play video (Use clickPlay for event handler)
			play: function () {
				if (useHTML5) {
					videoElement.play();
				} else {
					objectElement.playSWF();
				}
			},
			//Pause video (Use clickPause for event handler)
			pause: function () {
				if (useHTML5) {
					videoElement.pause();
				} else {
					objectElement.pauseSWF();
				}
			},
			/* Seek video
			 * @param targetTime {Number} target time in seconds
			 */
			seek: function (targetTime) {
				if (useHTML5) {
					videoElement.currentTime = targetTime;
					if (!isPlaying) {
						p.clickPlay();
					}
				} else {
					currentTime = objectElement.getCurrentTimeSWF();
					objectElement.seekSWF(targetTime);
				}
			},
			/* Execute custom function at the time video starts
			 * @param fn {Function} function
			 */
			onStart: function (fn) {
				startFunction = fn;
			},
			/* Execute custom function while video playing
			 * @param fn {Function} function
			 */
			onTimeUpdate: function (fn) {
				timeupdateFunction = fn;
			},
			/* Execute custom function at the time video ends
			 * @param fn {Function} function
			 */
			onComplete: function (fn) {
				completeFunction = fn;
			},
			/* Set desired element to fullscreen
			 * 
			 */
			requestFullScreen: function (targetElement) {
				if (targetElement.requestFullscreen) {
					targetElement.requestFullscreen();
				} else if (targetElement.webkitRequestFullScreen) {
					targetElement.webkitRequestFullScreen();
				} else if (targetElement.webkitEnterFullScreen) {
					targetElement.webkitEnterFullScreen();
				} else if (targetElement.mozRequestFullScreen) {
					targetElement.mozRequestFullScreen();
				} else {
					
				}
			},
			/* Exit fullscreen
			 * 
			 */
			cancelFullScreen: function () {
				if (document.cancelFullScreen) {
					document.cancelFullScreen();
				} else if (document.webkitCancelFullScreen) {
					document.webkitCancelFullScreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				}
			},
			/* Set video's volume value
			 *
			 */
			setVolume: function (volume) {
				if (volume > 1 || volume < 0) {
					throw new Error("setVolume: volume value must be between 0 to 1.");
				}
				if (useHTML5) {
					videoElement.volume = volume;
				} else {
					objectElement.setVolumeSWF(volume);
				}
			},
			/* Get video's volume value
			 * 
			 */
			getVolume: function () {
				if (useHTML5) {
					return videoElement.volume;
				} else {
					return objectElement.getVolumeSWF();
				}
			},
			/* Execute function at desired video time
			 * Target time must be in seconds because timeupdate event fires around 3 or 4 times per seconds.
			 * @param targetTime {Number} target time in seconds
			 * @param fn {Function} callback function
			 * @param remove {Boolean} OPTION if you want to remove the callback after fired (fire only once), then true.
			 */
			when: function (targetTime, fn, remove) {
				if (useHTML5) {
					videoElement.addEventListener("timeupdate", updateListener, false);
					var fired = false;
					function updateListener() {
						var currentTime = p.getCurrentTime() | 0;
						if (targetTime == currentTime && fired == false) {
							fn();
							fired = true;
							if (remove) {
								videoElement.removeEventListener("timeupdate", updateListener, false);
							}
							//Set fired flag false 1 second after to fire again at the same time later.
							setTimeout(function () {
								fired = false;
							}, 1000);
						}
					}
				} else {
					//Push time, fn, remove values to when arrays, execute on timeupdateListener.
					whenTime.push(targetTime);
					whenFuncs.push(fn);
					whenRemove.push(remove);
				}
			},
			/* Enable button, seekbar and UI elements
			 * 
			 */
			enableButton: function (buttonName) {
				//buttonName.addEventListener(ev, fn, false);
			},
			/* Disable button, seekbar and UI elements
			 * 
			 */
			disableButton: function (buttonName) {
				//buttonName.addEventListener(ev, fn, false);
			},
			/* Change playbackRate value
			 * 
			 */
			changePlaybackRate: function (playbackRate) {
				if (useHTML5) {
					videoElement.playbackRate = playbackRate;
				}
			},
			/* Convert file extension to MIME type.
			 * @param {String} extension File extension
			 * @return {String} MIME Type
			 */
			extensionToMimeType: function (extension) {
				var mimeType = "";
				switch (extension) {
					case "m3u8":
						mimeType = "application/x-mpegURL";
						break;
					case "mp4":
						mimeType = "video/mp4";
						break;
					case "ogv":
						mimeType = "video/ogg";
						break;
					case "webm":
						mimeType = "video/webm";
						break;
					default:
						throw new Error("extensionToMimeType(): The file type you set is not supported by most UA");
				}
				return mimeType;
			},
			/* Check playable file type from MIME type by using canPlayType method.
			 * @param {String} mimeType MIME Type
			 * @return {Boolean} if playable, then true
			 */
			checkCanPlayType: function (videoElement, mimeType) {
				//If there is no Video Element or UA doesn't support HTML5 Video (Old IE etc.), then return false to prevent error on canPlayType method.
				if (!videoElement || !videoElement.canPlayType) {
					return false;
				}
				var canPlay = videoElement.canPlayType(mimeType);
				if (canPlay == "probably" || canPlay == "maybe") {
					return true;
				} else {
					return false;
				}
			},
			/* Detect touchevent availablility
			 * @return {Boolean} if available, then true
			 */
			hasTouchEvent: function () {
				return (window.ontouchstart !== undefined) ? true : false;
			},
			/* Check if Internet Explorer 8 or older
			 * @return {Boolean} if IE8 or older, then true.
			 */
			isLteIE8: function (ua) {
				var _ua = ua || navigator.userAgent;
				return (_ua.match(/MSIE\s[6-8]/) !== null) ? true : false;
			},
			/* Convert seconds value into "MM:SS" string
			 * @param {Number} seconds
			 * @return {String} "MM:SS" string
			 */
			secToMMSS: function (sec) {
				var s = sec | 0;
				var seconds = s % 60;
				var minutes = s / 60 | 0;
				if (seconds < 10) {
					seconds = "0" + seconds;
				}
				if (minutes < 10) {
					minutes = "0" + minutes;
				}
				return minutes + ":" + seconds;
			}
		}
	return YAVideo5;
})();

//Set for Closure Compiler
window["YAVideo5"] = YAVideo5;