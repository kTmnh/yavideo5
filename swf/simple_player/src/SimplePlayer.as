package {
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.NetFilterEvent;
	import flash.events.NetStatusEvent;
	import flash.events.PressAndTapGestureEvent;
	import flash.external.ExternalInterface;
	import flash.media.SoundTransform;
	import flash.media.Video;
	import flash.net.NetConnection;
	import flash.net.NetStream;
	import flash.system.*;
	import flash.utils.setInterval;
	import flash.utils.clearInterval;
	public class SimplePlayer extends Sprite {
		private var _settings:Object;
		private var _ins:String;
		private var _src:String;
		private var _duration:Number;
		private var _sid:Number;
		private var _flushed:Boolean = false;
		private var _completed:Boolean = false;
		private var video:Video = new Video();
		private var connection:NetConnection = new NetConnection();
		private var netStream:NetStream;
		public function SimplePlayer():void {
			ExternalInterface.addCallback("initSWF", init);
			Security.allowDomain("*");
			addChild(video);
			video.width = 640;
			video.height = 360;
			video.smoothing = true;
			connection.connect(null);
			netStream = new NetStream(connection);
			netStream.soundTransform = new SoundTransform(1);
		}
		private function init(settings:Object):void {
			_settings = settings;
			_ins = settings.ins;
			video.attachNetStream(netStream);
			netStream.play(settings.src);
			if (!settings.autoplay) {
				netStream.pause();
			}
			netStream.client = new Object;
			netStream.client.onMetaData = function (param:Object):void {
				_duration = param.duration;
				ExternalInterface.call(_ins + ".durationchangeListener", _duration);
			}
			netStream.addEventListener(NetStatusEvent.NET_STATUS, netStatusEventListener);
			setCallbacks();
		}
		//Add callbacks for calling from JavaScript
		private function setCallbacks():void {
			ExternalInterface.addCallback("playSWF", playVideo);
			ExternalInterface.addCallback("pauseSWF", pauseVideo);
			ExternalInterface.addCallback("seekSWF", seekVideo);
			ExternalInterface.addCallback("getCurrentTimeSWF", getCurrentTime);
			ExternalInterface.addCallback("getVolumeSWF", getVolume);
			ExternalInterface.addCallback("setVolumeSWF", setVolume);
		}
		private function netStatusEventListener(event:NetStatusEvent):void {
			switch (event.info.code) {
				case "NetStream.Buffer.Flush":
					_flushed = true;
					break;
				case "NetStream.Play.Stop":
					if (_flushed) {
						_flushed = false;
						if (_settings.loop) {
							netStream.seek(0);
							netStream.play();
						} else {
							pauseVideo();
							_completed = true;
						}
						ExternalInterface.call(_ins + ".endedListener");
						break;
					}
			}
		}
		private function playVideo():void {
			if (!_completed) {
				netStream.resume();
			} else {
				netStream.play(_settings.src);
				_completed = false;
			}
			ExternalInterface.call(_ins + ".playListener");
			timeUpdate();
			_sid = setInterval(timeUpdate, 250);
		}
		private function pauseVideo():void {
			netStream.pause();
			ExternalInterface.call(_ins + ".pauseListener");
			clearInterval(_sid);
		}
		private function seekVideo(time:Number):void {
			if (_duration < time) return;
			if (!_completed) {
				netStream.seek(time);
			} else {
				netStream.resume();
				netStream.seek(time);
				_completed = false;
				ExternalInterface.call(_ins + ".playListener");
			}
			clearInterval(_sid);
			_sid = setInterval(timeUpdate, 250);
		}
		private function timeUpdate():void {
			ExternalInterface.call(_ins + ".timeupdateListener", netStream.time);
			if (_settings.bufferedBar) {
				var percent:int = (netStream.bytesLoaded / netStream.bytesTotal) * 100;
				ExternalInterface.call(_ins + ".updateBufferedBar", percent);
			}
		}
		private function getCurrentTime():Number {
			return netStream.time;
		}
		private function setVolume(vol:Number):void {
			netStream.soundTransform = new SoundTransform(vol);
		}
		private function getVolume():Number {
			return netStream.soundTransform.volume;
		}
	}
}