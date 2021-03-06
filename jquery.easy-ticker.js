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
		s.run = false;
		s.queue = {};
		s.queue.add = new Array;
		s.queue.remove = new Array;
		s.queue.update = new Array;
		s.callback = {
			first: undefined,
			last: undefined
		};
		s.dummy = {
			init: 0,
			current: 0,
		}

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

			return(true);
		}

		$(s.opts.controls.up).on('click', function(e) {
			e.preventDefault();
			moveDir('up');

			return(true);
		});

		$(s.opts.controls.down).on('click', function(e) {
			e.preventDefault();
			moveDir('down');

			return(true);
		});

		$(s.opts.controls.toggle).on('click', function(e) {
			e.preventDefault();
			if(s.timer == 0) start();
			else stop();

			return(true);
		});

		function init() {

			s.run = true;

			if(s.opts.dummy.use) {
				s.dummy.init = Math.floor($(window).height() / s.opts.dummy.height) + 1;
				s.dummy.current = s.dummy.init;

				if(s.dummy.current <= s.targ.children().length) {
					s.dummy.init = 0;
					s.dummy.current = s.dummy.init;
				} else {
					s.dummy.init = s.dummy.current - s.targ.children().length;
					s.dummy.current = s.dummy.init;
				}

				var counter = 0;
				while(counter < s.dummy.current) {
					// create an element with an object literal, defining properties
					var $dummy = $('<' + s.opts.dummy.html + '>', { html: '&nbsp;', data: {dummy: true}, style: 'height: ' + s.opts.dummy.height + 'px' });

					// add the element to the body
					s.targ.prepend($dummy);

					counter++;
				}
			}

			s.elem.children().css('margin', 0).children().css('margin', 0);

			if(s.opts.direction == 'up') {
				s.targ.children().each(function() {
					if(!$(this).data('dummy')) {
						$(this).attr('itemno', s.counter);
						$(this).data('itemno', s.counter);
						s.counter++;
					}
				});
			} else {
				s.targ.children().each(function() {
					if(!$(this).data('dummy')) {
						s.counter++;
						$(this).attr('itemno', s.targ.children().length - s.counter);
						$(this).data('itemno', s.targ.children().length - s.counter);
					}
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

			return(true);
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

			s.run = true;
			$(s.opts.controls.toggle).addClass('et-run').html(s.opts.controls.stopText);

			return(true);
		} // Start method

		function stop() {
			clearInterval(s.timer);
			s.timer = 0;
			s.run = false;
			$(s.opts.controls.toggle).removeClass('et-run').html(s.opts.controls.playText);

			return(true);
		}// Stop

		function move(dir) {
			if(!s.run) {
				return(false);
			}

			var sel, eq, appType, leaderChild;

			if(!s.elem.is(':visible')) return;

			if(dir == 'up') {
				eq = '-=';
				appType = 'appendTo';
				leaderChild = s.targ.children(':first-child');
			} else {
				eq = '+=';
				appType = 'prependTo';
				leaderChild = s.targ.children(':last-child');
			}

			var height = leaderChild.outerHeight();

			s.targ.stop(true, true).animate({
				'top': eq + height + "px"
			}, s.opts.speed, s.opts.easing, function() {

				leaderChild.hide(function() {
					if($(this).data('itemno') >= 0) {
						if(typeof(s.callback.last) == 'function') {
							s.callback.last.call(this, leaderChild);
						}
					}
				})[appType](s.targ).fadeIn(function() {
					if($(this).data('itemno') >= 0) {
						if(typeof(s.callback.first) == 'function') {
							s.callback.first.call(this, leaderChild);
						}
					}
				});
				s.targ.css('top', 0);

				adjHeight();

				handleQueue();

				if(s.opts.mode == 'continuous') {
					move(dir);
				}
			});

			return(true);
		}// Move

		function handleQueue() {

			var dir = s.opts.direction;
			if(dir == 'up') {
				sel = ':last-child';
			} else {
				sel = ':first-child';
			}
			var closeChild = s.targ.children(sel);

			if(s.targ.children(':last-child').data('dummy')) {
				if(s.dummy.current < $(el).find(':data(dummy)').length) {
					s.targ.children(':last-child').remove();
				}

				if(s.dummy.init > s.targ.children().length) {
					// create an element with an object literal, defining properties
					var $dummy = $('<' + s.opts.dummy.html + '>', { html: '&nbsp;', data: {dummy: true}, style: 'height: ' + s.opts.dummy.height + 'px' });

					// add the element to the body
					s.targ.append($dummy);

					s.dummy.current++;
				}
			}

			// Move done, trigger add and remove if neccessary
			if(s.queue.add) {
				if(dir == 'up') {
					if(closeChild.data('itemno') == firstItemNo()) {
						$.each(s.queue.add, function(no, data) {

							if(typeof(data) == 'object') {
								s.targ.append(data[0]);
								itemEl = s.targ.children('[itemno="' + no + '"]').eq(0);

								if(typeof(data[1]) == 'function') {
									data[1].call(itemEl, no, $(itemEl));
								}

								if(typeof(s.callback.first) == 'function') {
									s.callback.first.call(itemEl, $(itemEl));
								}
							}

							delete s.queue.add[no]
						});
					}
				} else {
					if(closeChild.data('itemno') == lastItemNo()) {
						$.each(s.queue.add.reverse(), function(no, data) {

							if(typeof(data) == 'object') {
								s.targ.append(data[0]);
								itemEl = s.targ.children('[itemno="' + no + '"]').eq(0);

								if(typeof(data[1]) == 'function') {
									data[1].call(itemEl, no, $(itemEl));
								}

								if(typeof(s.callback.first) == 'function') {
									s.callback.first.call(itemEl, $(itemEl));
								}
							}

							delete s.queue.add[no]
						});
					}
				}

				// Cleanup from undefined entries
				var cQueueAdd = new Array;

				$.each(s.queue.add, function(no, data) {
					if(typeof(data) == 'object') {
						if(typeof(data[0]) == 'object') {
							cQueueAdd[no] = data;
						}
					}
				});
				s.queue.add = cQueueAdd;
			}

			if(s.queue.remove) {
				itemLast = s.targ.children(':last-child');

				if(typeof(s.queue.remove[itemLast.data('itemno')]) == 'object') {
					data = s.queue.remove[itemLast.data('itemno')]
					itemHtml = data[0];
					$(itemHtml).remove();

					if(typeof(data[1]) == 'function') {
						data[1].call(this, itemLast.data('itemno'), true);
					}

					delete s.queue.remove[itemLast.data('itemno')]
				}

				// Cleanup from undefined entries
				var cQueueRemove = new Array;
				$.each(s.queue.remove, function(no, data) {
					if(typeof(data) == 'object') {
						if(typeof(data[0]) == 'object') {
							cQueueRemove[no] = data;
						}
					}
				});
				s.queue.remove = cQueueRemove;
			}

			if(s.queue.update) {

				itemLast = s.targ.children(':last-child');
				if(typeof(s.queue.update[itemLast.data('itemno')]) == 'object') {
					data = s.queue.update[itemLast.data('itemno')];

					itemCurrent = itemLast;
					$(itemCurrent).replaceWith(data[0]);

					if(typeof(data[1]) == 'function') {
						data[1].call(this, data[0]);
					}

					delete s.queue.update[itemLast.data('itemno')]
				}

				// Cleanup from undefined entries
				var cQueueUpdate = new Array;
				$.each(s.queue.update, function(no, data) {
					if(typeof(data) == 'object') {
						if(typeof(data[0]) == 'object') {
							cQueueUpdate[no] = data;
						}
					}
				});
				s.queue.update = cQueueUpdate;
			}

			return(true);
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

			return(true);
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

			return(true);
		}

		function visHeight(anim) {
			var wrapHeight = 0;
			s.targ.children(':lt(' + s.opts.visible + ')').each(function() {
				wrapHeight += $(this).outerHeight();
			});

			if(anim == 1) {
				s.elem.stop(true, true).animate({height: wrapHeight}, s.opts.speed);
			} else {
				s.elem.css('height', wrapHeight);
			}

			return(true);
		}

		function adjHeight() {
			if(s.opts.height == 'auto' && s.opts.visible != 0) {
				anim = arguments.callee.caller.name == 'init' ? 0 : 1;
				visHeight(anim);
			} else if(s.opts.height == 'auto') {
				fullHeight();
			}

			return(true);
		}

		function onFirst(callback) {
			if(typeof(callback) == 'function') {
				s.callback.first = callback;
			}
		}

		function onLast(callback) {
			if(typeof(callback) == 'function') {
				s.callback.last = callback;
			}
		}

		function add(html, queue, callback) {

			queue = queue || false;

			newItem = $.parseHTML(html);
			$(newItem).attr('itemno', s.counter);
			$(newItem).data('itemno', s.counter);
			$(newItem).css({
				'margin' : 0
			});

			if(queue) {
				s.queue.add[s.counter] = new Array(newItem, callback);
			} else {
				s.targ.append(newItem);

				if(typeof(callback) == 'function') {
					callback.call(this, s.counter, html);
				}
			}

			if(s.dummy.current > 0) {
				s.dummy.current--;
			}

			s.counter++;
			return($(newItem));
		}

		function remove(no, queue, callback) {

			queue = queue || false;

			var removed = false;
			s.targ.children().each(function() {
				if($(this).data('itemno') == no) {

					if(queue) {
						if(typeof(s.queue.remove[$(this).data('itemno')]) == 'object') {
							removed = false;
						} else {
							s.queue.remove[$(this).data('itemno')] = new Array($(this), callback);
							removed = true;
						}
					} else {
						if(typeof(s.queue.remove[$(this).data('itemno')]) == 'object') {
							delete s.queue.remove[$(this).data('itemno')]
						} 
						$(this).remove();
						removed = true;

						if(typeof(callback) == 'function') {
							callback.call(this, no, true);
						}
					}

				}
			});

			return(removed);
		}

		function update(no, html, queue, callback) {
			queue = queue || false;

			itemNew = $.parseHTML(html);
			$(itemNew).attr('itemno', no);
			$(itemNew).data('itemno', no);
			$(itemNew).css({
				'margin' : 0
			});

			if(queue) {
				s.queue.update[no] = new Array(itemNew, callback);
			} else {
				itemCurrent = s.targ.children('[itemno="' + no + '"]').eq(0);
				$(itemCurrent).replaceWith(itemNew);

				if(typeof(callback) == 'function') {
					callback.call(this, no, itemCurrent);
				}
			}
		}

		return {
			onFirst: function(callback)			{ return(onFirst(callback)); },
			onLast: function(callback)			{ return(onLast(callback)); },
			add: function(html, queue, callback)		{ return(add(html, queue, callback)); },
			remove: function(no, queue, callback)		{ return(remove(no, queue, callback)); },
			update: function(no, html, queue, callback)	{ return(update(no, html, queue, callback)); },
			up: function() { return(moveDir('up')); },
			down: function() { return(moveDir('down')); },
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
