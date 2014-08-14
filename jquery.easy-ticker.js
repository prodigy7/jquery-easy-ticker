/* 
 * jQuery - Easy Ticker plugin - v2.0
 * http://www.aakashweb.com/
 * Copyright 2014, Aakash Chakravarthy
 * Released under the MIT License.
 */
 
;(function($, window, document, undefined) {

	var name = "easyTicker", defaults = {
		mode: 'easing',		// Define animation mode. Values: 'easing' | 'continuous'
		needFocus: false,	// If set, window need no focus for animate ticket. Values: true |false
		direction: 'up',	// Directory for scrolling ticket. Values: 'up' | 'down'
		easing: 'linear',	// If mode 'easing', define animation behaviour. Values: See jquery UI documentation
		speed: 'slow',		// Define animation speed. Values: 'slow' | 'normal | 'fast' | <integer> (for ms)
		interval: 2000,		// If mode 'easing', interval between animations. Values: Integer value
		dummy: {
			use: true,	// If set, during init dummy containers are created with given (following) height for get a smoother scroll effect
			height: 100,	// Height of the dummy container
			html: 'li',	// HTML Tag name for item
		},
		height: 'auto',
		visible: 0,
		mousePause: 1,		// Define pause of animation if mouse is over item
		controls: {
			up: '',
			down: '',
			toggle: '',
			playText: 'Play',
			stopText: 'Stop'
		}
	};

	// Constructor
	function EasyTicker(el, options) {

		var s = this;

		s.opts = $.extend({}, defaults, options);
		s.elem = $(el);
		s.targ = $(el).children(':first-child');
		s.timer = 0;
		s.mHover = 0;
		s.winFocus = 1;
		s.counter = 0;
		s.queue = {};
		s.queue.add = new Array;
		s.queue.remove = new Array;
		s.dummyCount = 0;

		init();
		start();

		$([window, document]).off('focus.jqet').on('focus.jqet', function() {
			s.winFocus = 1;
		}).off('blur.jqet').on('blur.jqet', function() {
			s.winFocus = 0;
		});

		if(s.opts.mousePause == 1) {
			s.elem.mouseenter(function() {
				s.timerTemp = s.timer;
				stop();
			}).mouseleave(function() {
				if(s.timerTemp !== 0)
					start();
			});
		}

		$(s.opts.controls.up).on('click', function(e) {
			e.preventDefault();
			moveDir('up');
		});

		$(s.opts.controls.down).on('click', function(e) {
			e.preventDefault();
			moveDir('down');
		});

		$(s.opts.controls.toggle).on('click', function(e) {
			e.preventDefault();
			if(s.timer == 0) start();
			else stop();
		});

		function init() {

			if(s.opts.dummy.use) {
				s.dummyCount = Math.floor($(document).height() / s.opts.dummy.height);

				var counter = 0;
				while(counter < s.dummyCount) {

					// create an element with an object literal, defining properties
					var $dummy = $('<' + s.opts.dummy.html + '>', { html: '&nbsp;', data: {dummy: true}, style: 'height: ' + s.opts.dummy.height + 'px' });

					// add the element to the body
					s.targ.append($dummy);

					counter++;
				}
			}

			s.elem.children().css('margin', 0).children().css('margin', 0);

			if(s.opts.direction == 'up') {
				s.targ.children().each(function() {
					$(this).data('itemno', s.counter);
					s.counter++;
				});
			} else {
				s.targ.children().each(function() {
					s.counter++;
					$(this).data('itemno', s.targ.children().length - s.counter);
				});
			}

			s.elem.css({
				position : 'relative',
				height: s.opts.height,
				overflow : 'hidden'
			});

			s.targ.css({
				'position' : 'absolute',
				'margin' : 0
			});

			setInterval(function() {
				adjHeight();
			}, 100);

		} // Init Method

		function start() {
			switch(s.opts.mode) {
				case 'easing':
					s.timer = setInterval(function() {
						if(s.winFocus == 1 || !s.opts.needFocus) {
							move(s.opts.direction);
						}
					}, s.opts.interval);
				break;

				case 'continuous':
					if(s.winFocus == 1 || !s.opts.needFocus) {
						move(s.opts.direction);
					}
				break;
			}

			$(s.opts.controls.toggle).addClass('et-run').html(s.opts.controls.stopText);

		} // Start method

		function stop() {
			clearInterval(s.timer);
			s.timer = 0;
			$(s.opts.controls.toggle).removeClass('et-run').html(s.opts.controls.playText);
		}// Stop

		function move(dir) {
			var sel, eq, appType;

			if(!s.elem.is(':visible')) return;

			if(dir == 'up') {
				sel = ':first-child';
				eq = '-=';
				appType = 'appendTo';
			} else {
				sel = ':last-child';
				eq = '+=';
				appType = 'prependTo';
			}

			var selChild = s.targ.children(sel);
			var height = selChild.outerHeight();

			s.targ.stop(true, true).animate({
				'top': eq + height + "px"
			}, s.opts.speed, s.opts.easing, function() {

				selChild.hide()[appType](s.targ).fadeIn();
				s.targ.css('top', 0);

				adjHeight();

				handleQueue();

				if(s.opts.mode == 'continuous') {
					move(dir);
				}
			});
		}// Move

		function handleQueue() {

			var dir = s.opts.direction;
			if(dir == 'up') {
				sel = ':first-child';
			} else {
				sel = ':last-child';
			}
			var selChild = s.targ.children(sel);

			if(s.targ.children(':last-child').data('dummy') && (s.dummyCount < $(el).find(':data(dummy)').length)) {
				s.targ.children(':last-child').remove();
			}

			// Move done, trigger add and remove if neccessary
			if(s.queue.add) {
				if(dir == 'up') {
					if(selChild.data('itemno') == lastItemNo()) {
						$.each(s.queue.add, function(no, html) {
							s.targ.append(html);
						});
					}
				} else {
					if(selChild.data('itemno') == firstItemNo()) {
						$.each(s.queue.add, function(no, html) {
							s.targ.append(html);
						});
					}
				}
			}

			if(s.queue.remove) {
				itemLast = s.targ.children(':last-child').data('itemno')

				if(typeof(s.queue.remove[itemLast]) == 'object') {
					itemHtml = s.queue.remove[itemLast];
					$(itemHtml).remove();
					delete s.queue.remove[itemLast]
				}

				// Cleanup from undefined entries
				var cQueueRemove = new Array;
				$.each(s.queue.remove, function(no, html) {
					if(typeof(html) == 'object') {
						cQueueRemove[no] = html;
					}
				});
				s.queue.remove = cQueueRemove;
			}
		}

		function firstItemNo() {
			var number;
			s.targ.children().each(function() {
				if(typeof(number) == 'undefined') {
					number = $(this).data('itemno');
				}

				if(number > $(this).data('itemno')) {
					number = $(this).data('itemno');
				}
			});
			return(number);
		}

		function lastItemNo() {
			var number;
			s.targ.children().each(function() {
				if(typeof(number) == 'undefined') {
					number = $(this).data('itemno');
				}

				if(number < $(this).data('itemno')) {
					number = $(this).data('itemno');
				}
			});
			return(number);
		}

		function moveDir(dir) {
			stop();
			if(dir == 'up') move('up'); else move('down'); 
			// start();
		}

		function fullHeight() {
			var height = 0;
			var tempDisp = s.elem.css('display'); // Get the current el display value

			s.elem.css('display', 'block');

			s.targ.children().each(function() {
				height += $(this).outerHeight();
			});

			s.elem.css({
				'display' : tempDisp,
				'height' : height
			});
		}

		function visHeight(anim) {
			var wrapHeight = 0;
			s.targ.children(':lt(' + s.opts.visible + ')').each(function() {
				wrapHeight += $(this).outerHeight();
			});

			if(anim == 1) {
				s.elem.stop(true, true).animate({height: wrapHeight}, s.opts.speed);
			}else{
				s.elem.css('height', wrapHeight);
			}
		}

		function adjHeight() {
			if(s.opts.height == 'auto' && s.opts.visible != 0) {
				anim = arguments.callee.caller.name == 'init' ? 0 : 1;
				visHeight(anim);
			}else if(s.opts.height == 'auto') {
				fullHeight();
			}
		}

		function add(html, queue) {

			queue = queue || false;

			newItem = $.parseHTML(html);
			$(newItem).data('itemno', s.counter);
			$(newItem).css({
				'margin' : 0
			});

			s.dummyCount--;

			if($(el).find(':data(dummy)').length) {
				s.targ.append(newItem);
			} else if(queue) {
				s.queue.add[s.counter] = newItem;
			} else {
				s.targ.append(newItem);
			}

			s.counter++;
			return($(newItem));
		}

		function remove(no, queue) {

			queue = queue || false;

			var removed = false;
			s.targ.children().each(function() {
				if($(this).data('itemno') == no) {

					if(queue) {
						if(typeof(s.queue.remove[$(this).data('itemno')]) == 'object') {
							removed = false;
						} else {
							s.queue.remove[$(this).data('itemno')] = $(this);
							removed = true;
						}
					} else {
						if(typeof(s.queue.remove[$(this).data('itemno')]) == 'object') {
							delete s.queue.remove[$(this).data('itemno')]
						} 
						$(this).remove();
						removed = true;
					}

				}
			});

			return(removed);
		}

		return {
			add: function(html, queue) { return(add(html, queue)); },
			remove: function(no, queue) { return(remove(no, queue)); },
			up: function() { moveDir('up'); },
			down: function() { moveDir('down'); },
			start: start,
			stop: stop,
			options: s.opts
		};
	}

	// Attach the object to the DOM
	$.fn[name] = function(options) {
		return this.each(function() {
			if(!$.data(this, name)) {
				$.data(this, name, new EasyTicker(this, options));
			}
		});
	};
})(jQuery, window, document);
