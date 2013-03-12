package {
	import flash.display.*;
	import flash.events.*;
	import flash.external.ExternalInterface;
	import flash.system.*;
	import org.osmf.elements.*;
	import org.osmf.events.*;
	import org.osmf.media.*;
	import org.osmf.traits.*;
	public class OSMFPlayer extends Sprite {
		private var _settings:Object;
		private var _ins:String = "";
		private var _duration:Number = 0;
		private var mediaPlayerSprite:MediaPlayerSprite = new MediaPlayerSprite();
		private var displayObject:Object = new Object();
		//Constructor
		public function OSMFPlayer():void {
			ExternalInterface.addCallback("initSWF", init);
			Security.allowDomain("*");
			addChild(mediaPlayerSprite);
			mediaPlayerSprite.width = 640;
			mediaPlayerSprite.height = 360;
		}
		//Initialize
		private function init(settings:Object):void {
			_settings = settings;
			_ins = settings.ins;
			//Check if source is F4M(HTTP Dynamic Streaming)
			var temp:Boolean = isF4M(settings.src);
			if (temp) {
				var manifestElement:F4MElement = new F4MElement();
				manifestElement.resource = new URLResource(settings.src);
				mediaPlayerSprite.media = manifestElement;
			} else {
				var resource:URLResource = new URLResource(settings.src);
				//Use LightweightVideoElement instead of VideoElement for saving CPU usage.
				mediaPlayerSprite.media = new LightweightVideoElement(resource);
			}
			mediaPlayerSprite.media.addEventListener(MediaElementEvent.TRAIT_ADD, traitListener);
			mediaPlayerSprite.mediaPlayer.addEventListener(TimeEvent.DURATION_CHANGE, durationChangeListener);
			mediaPlayerSprite.mediaPlayer.addEventListener(PlayEvent.PLAY_STATE_CHANGE, playStateChangeListener);
			mediaPlayerSprite.mediaPlayer.addEventListener(TimeEvent.CURRENT_TIME_CHANGE, currentTimeChangeListener);
			if (_settings.bufferedBar) {
				mediaPlayerSprite.mediaPlayer.addEventListener(LoadEvent.BYTES_LOADED_CHANGE, bytesLoadedChangeListener);
			}
			mediaPlayerSprite.mediaPlayer.autoRewind = false;
			mediaPlayerSprite.mediaPlayer.addEventListener(MediaPlayerStateChangeEvent.MEDIA_PLAYER_STATE_CHANGE, function (event:MediaPlayerStateChangeEvent):void {
				event.currentTarget.removeEventListener(MediaPlayerStateChangeEvent.MEDIA_PLAYER_STATE_CHANGE, arguments.callee);
				//Pause video if autoplay is false.
				//For some reasons, mediaPlayer.autoPlay property cannot be applied before video start playing.
				if (!settings.autoplay) {
					event.currentTarget.pause();
				} else {
					ExternalInterface.call(_ins + ".playListener");
				}
				event.currentTarget.loop = settings.loop;
			});
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
		private function durationChangeListener(event:TimeEvent):void {
			_duration = mediaPlayerSprite.mediaPlayer.duration;
			ExternalInterface.call(_ins + ".durationchangeListener", _duration);
		}
		private function playStateChangeListener(event:PlayEvent):void {
			switch (event.playState) {
				case "playing":
					ExternalInterface.call(_ins + ".playListener");
					break;
				case "paused":
					ExternalInterface.call(_ins + ".pauseListener");
					break;
				case "stopped":
					//Fire only at end of the video
					if (_duration - mediaPlayerSprite.mediaPlayer.currentTime < 1) {
						ExternalInterface.call(_ins + ".endedListener");
						//Call pauseListener in order to set the button from Pause to Play
						if (!_settings.loop) {
							ExternalInterface.call(_ins+".pauseListener");
						}
					}
					break;
			}
		}
		private function currentTimeChangeListener(event:TimeEvent):void {
			ExternalInterface.call(_ins + ".timeupdateListener", event.time);
		}
		private function bytesLoadedChangeListener(event:LoadEvent):void {
			var percent:int = (event.currentTarget.bytesLoaded / event.currentTarget.bytesTotal) * 100;
			ExternalInterface.call(_ins + ".updateBufferedBar", percent);
		}
		
		//Smoothing is not set true in OSMF default
		private function traitListener(event:MediaElementEvent):void {
			if (event.traitType == MediaTraitType.DISPLAY_OBJECT) {
				var displayObject:Object = (mediaPlayerSprite.media.getTrait(MediaTraitType.DISPLAY_OBJECT) as DisplayObjectTrait).displayObject;
				displayObject.smoothing = true;
			}
		}
		private function playVideo():void {
			mediaPlayerSprite.mediaPlayer.play();
		}
		private function pauseVideo():void {
			mediaPlayerSprite.mediaPlayer.pause();
		}
		private function seekVideo(time:Number):void {
			mediaPlayerSprite.mediaPlayer.seek(time);
		}
		private function getCurrentTime():Number {
			return mediaPlayerSprite.mediaPlayer.currentTime;
		}
		private function setVolume(vol:Number):void {
			mediaPlayerSprite.mediaPlayer.volume = vol;
		}
		private function getVolume():Number {
			return mediaPlayerSprite.mediaPlayer.volume;
		}
		//Detect if the video source is F4M (HTTP Dynamic Streaming) from url string
		private function isF4M(url:String):Boolean {
			var temp:Array = url.match(/.f4m$/);
			if (temp === null) {
				return false;
			} else {
				return true;
			}
		}
	}
}