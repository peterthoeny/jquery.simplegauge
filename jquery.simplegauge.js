/**
 * Simple gauge plugin for jQuery
 * @version    0.9.2
 * @release    2021-05-11
 * @repository https://github.com/peterthoeny/jquery.simplegauge
 * @author     Peter Thoeny, https://twiki.org/ & https://github.com/peterthoeny
 * @copyright  2021 Peter Thoeny, https://github.com/peterthoeny
 * @license    MIT, https://opensource.org/licenses/mit-license
 * fork of:    https://github.com/henus/jquery-gauge
 */
(function($) {

    'use strict';

    let debug = true;

    function debugLog(msg) {
        if(debug) {
           console.log('- simpleGauge: ' + msg);
        }
    }

    /**
     *  SimpleGauge class definition
     */
    var SimpleGauge = function (element, options) {
        if (element && element instanceof jQuery) {
            this.init(element, options);
        }
    };

    SimpleGauge.prototype = {
        constructor: SimpleGauge,

        gaps: [
            [20, 12],
            [20, 8]
        ],

        mergeDeep: function(target, source) {
            function _isObject(item) {
                return (item && typeof item === 'object' && !Array.isArray(item));
            }
            let output = Object.assign({}, target);
            if (_isObject(target) && _isObject(source)) {
                Object.keys(source).forEach(key => {
                    if (_isObject(source[key])) {
                        if (!(key in target)) {
                            Object.assign(output, { [key]: source[key] });
                        } else {
                            output[key] = this.mergeDeep(target[key], source[key]);
                        }
                    } else {
                        Object.assign(output, { [key]: source[key] });
                    }
                });
            }
            return output;
        },

        init: function (element, options) {
            var self = this;
            this.options = this.mergeDeep($.fn.simpleGauge.defaults, options);
            this.$element = $(element);
            this.draw();
            $(window).on('resize', function () {
                self.draw();
            });
        },

        draw: function () {
            this.$element.html(this.options.template);
            this.$container = this.$element.find('.simpleGauge_container');
            this.$bars      = this.$element.find('.simpleGauge_bars');
            this.$labels    = this.$element.find('.simpleGauge_labels');
            this.$marks     = this.$element.find('.simpleGauge_marks');
            this.$digital   = this.$element.find('.simpleGauge_digital');
            this.$title     = this.$element.find('.simpleGauge_title');
            this.setContainer();
            this.getSizes();
            if(this.options.type.match(/\banalog\b/)) {
                this.setGaps();
                this.createBars();
                this.createArrow();
                this.createValues();
                this.createMarks();
            }
            this.setTitle();
            this.setValue(this.options.value); // set digital and/or analog value
        },

        setContainer: function () {
            if(this.options.container) {
                if(this.options.container.style) {
                    var style = this.options.container.style;
                    var css = this._styleToCss(style, $.fn.simpleGauge.defaults.container.style);
                    this.$container.css(css);
                }
                if(this.options.container.size) {
                    var size = this.options.container.size;
                    var css = {
                        width: size + '%',
                        height: size + '%'
                    };
                    this.$container.find('.simpleGauge').css(css);
                }
            }
        },

        getSizes: function () {
            var isOutside = (this.options.analog.inset === false);
            this.options.barsWidth  = (isOutside) ? this.$bars.innerWidth() - (this.gaps[0][0] * 2) : this.$bars.innerWidth();
            this.options.barsHeight = (isOutside) ? this.$bars.innerHeight() - (this.gaps[0][0] * 2) : this.$bars.innerHeight();
            this.options.labelsWidth  = (isOutside) ? this.$labels.innerWidth() : this.$labels.innerWidth() - (this.gaps[0][0] * 2);
            this.options.labelsHeight = (isOutside) ? this.$labels.innerHeight() : this.$labels.innerHeight() - (this.gaps[0][0] * 2);
            this.options.marksWidth  = (isOutside) ? this.$marks.innerWidth() - (this.gaps[0][1] * 2) : this.$marks.innerWidth() - (this.gaps[1][1] * 2);
            this.options.marksHeight = (isOutside) ? this.$marks.innerHeight() - (this.gaps[0][1] * 2) : this.$marks.innerWidth() - (this.gaps[1][1] * 2);
            var self = this;
            var colors = {};
            this.options.barColors.forEach(function(set) {
                var percent = (set[0] - self.options.min) / (self.options.max - self.options.min) * 100;
                var value = set[1];
                colors[percent] = value;
            });
            this.options.colors = colors;
        },

        getBarColor: function (value) {
            var color = '#ccc';
            this.options.barColors.forEach(function(set) {
                if(set[0] <= value) {
                   color = set[1];
                }
            });
            return color;
        },

        setGaps: function () {
            var isOutside = (this.options.analog.inset === false);
            this.$bars.css({
                left: (isOutside) ? this.gaps[0][0] : 0,
                top:  (isOutside) ? this.gaps[0][0] : 0,
                overflow: 'visible'
            });
            this.$labels.css({
                left: (isOutside) ? 0 : this.gaps[0][0],
                top:  (isOutside) ? 0 : this.gaps[0][0]
            });
            this.$marks.css({
                left: (isOutside) ? this.gaps[0][1] : this.gaps[1][1],
                top:  (isOutside) ? this.gaps[0][1] : this.gaps[1][1]
            });
        },

        walkPercents: function (obj, fn) {
            var angle;
            var self = this;
            var compareNumbers = function (a, b) {
                return a - b;
            };
            var percents = Object.keys(obj).map(parseFloat).sort(compareNumbers);
            $.each(percents, function (i, percent) {
                angle = self.getPercentAngle(percent);
                fn.call(self, percent, angle);
            });
        },

        getPercentAngle: function (percent) {
            return ((percent * 0.01 * (this.options.analog.maxAngle - 90 - this.options.analog.minAngle + 90)) + this.options.analog.minAngle - 90);
        },

        getCoordinate: function (angle, w, h) {
            angle = angle * Math.PI / 180;
            return [
                (Math.cos(angle) * w / 2 + w / 2),
                (Math.sin(angle) * h / 2 + h / 2)
            ];
        },

        createBars: function () {
            var self = this;
            var color;
            var lastAngle = this.options.analog.minAngle - 90;
            this.$bars.html('');
            this.walkPercents(this.options.colors, function (percent, angle) {
                if (color) {
                    self.createBar(lastAngle, angle, color);
                }
                color     = this.options.colors[percent];
                lastAngle = angle;
            });
            var endAngle = this.options.analog.maxAngle - 90;
            self.createBar(lastAngle, endAngle, color);
        },

        createBar: function (prevAngle, nextAngle, color) {
            var prevCoords = this.getCoordinate(prevAngle, this.options.barsWidth, this.options.barsHeight);
            var nextCoords = this.getCoordinate(nextAngle, this.options.barsWidth, this.options.barsHeight);
            var d = 'M ' + prevCoords + ' A ' + this.options.barsWidth / 2 + ' ' + this.options.barsHeight / 2
                  + ' 0 ' + (Math.abs(nextAngle - prevAngle) > 180 ? 1 : 0) + ' 1 ' + nextCoords;
            this.appendSVG('path', {
                'class'        : 'simpleGauge_bar',
                'd'            : d,
                'stroke'       : color,
                'stroke-width' : this.options.analog.lineWidth,
                'fill'         : 'none'
            });
        },

        createArrow: function () {
            var points = [  // digit: pointy arrow
                this.options.barsWidth / 2 - (this.options.analog.arrowWidth / 2) + ',' + this.options.barsHeight / 2,
                this.options.barsWidth / 2 + (this.options.analog.arrowWidth / 2) + ',' + this.options.barsHeight / 2,
                this.options.barsWidth / 2 + ',' + '-5'
            ].join(' ');
            this.appendSVG('polyline', {
                'class'  : 'simpleGauge_arrow',
                'points' : points,
                'fill'   : this.options.analog.arrowColor,
                'stroke' : 'white', // this.options.arrowStrokeColor,
                'stroke-width' : '1', // this.options.arrowStrokeWidth,
                'height' : this.options.barsHeight / 2
            });
            this.appendSVG('circle', {  // center circle
                'class' : 'simpleGauge_center',
                'cx'    : this.options.barsWidth / 2,
                'cy'    : this.options.barsHeight / 2,
                'r'     : this.options.analog.arrowWidth,
                'fill'  : this.options.analog.arrowColor
            });
        },

        appendSVG: function (type, attributes) {
            var path = document.createElementNS('http://www.w3.org/2000/svg', type);
            $.each(attributes, function (name, value) {
                path.setAttribute(name, value);
            });
            this.$bars.append(path);
        },

        getValue: function () {
            var value = this.options.value;
            debugLog('getValue(): ' + value);
            return value;
        },

        setValue: function (value) {
            debugLog('setValue(' + value + ')');
            this.options.value = value;
            if(this.options.type.match(/\bdigital\b/)) {
                this.setDigital();
            }
            if(this.options.type.match(/\banalog\b/)) {
                var percent = (value - this.options.min) / (this.options.max - this.options.min) * 100;
                var angle = this.getPercentAngle(percent);
                var arrow = this.$element.find('.simpleGauge_arrow');
                var height = arrow[0].getAttribute('height');
                arrow.attr({transform: 'rotate(' + (angle + 90) + ' ' + height + ' ' + height + ')'});
            }
            return null;
        },

        createValues: function () {
            this.options.ticksMap = {
                
            };
            var numTicks = this.options.analog.numTicks;
            var percentStep = 100 / numTicks;
            var val = this.options.min;
            var valStep = (this.options.max - this.options.min) / numTicks;
            let factor = 1;
            if(valStep < 0.1) {
                factor = 100;
            } else if(valStep < 1) {
                factor = 10;
            }
            for(var i = 0; i <= numTicks; i++) {
                var percent = Math.round(percentStep * i);
                this.options.ticksMap[percent] = Math.round(val * factor) / factor;
                val += valStep;
            }
            this.walkPercents(this.options.ticksMap, function (percent, angle) {
                var coords = this.getCoordinate(angle, this.options.labelsWidth, this.options.labelsHeight);
                var $label = $('<div>').addClass('simpleGauge_label').text(this.options.ticksMap[percent]);

                this.$labels.append($label);
                $label.css({
                    left: coords[0] - $label.width() / 2,
                    top: coords[1] - $label.height() / 2
                });
            });
        },

        createMarks: function () {
            this.walkPercents(this.options.ticksMap, function (percent, angle) {
                var coords = this.getCoordinate(angle, this.options.marksWidth, this.options.marksHeight);
                var $mark = $('<div>').addClass('simpleGauge_mark');
                this.$marks.append($mark);
                $mark.css({
                    transform: 'rotate(' + (angle + 90) + 'deg)',
                    left: coords[0] - $mark.width() / 2,
                    top: coords[1] - $mark.height() / 2
                });
            });
        },

        setDigital: function () {
            if(this.options.digital) {
                if(this.options.digital.text) {
                    var html = this.options.digital.text;
                    if(typeof html != 'string') {
                        html = $.fn.simpleGauge.defaults.digital.text;
                    }
                    var value = this.options.value;
                    html = html.replace(/\{value(?:\.(\d+))?\}/g, function(m, c1) {
                        if(c1) {
                            let factor = 10 ** parseInt(c1);
                            value = Math.round(value * factor) / factor;
                        }
                        return value.toString();
                    });
                    this.$digital.html('<span>' + html + '</span>');
                    var style = this.options.digital.style;
                    var css = this._styleToCss(style, $.fn.simpleGauge.defaults.digital.style);
                    if(css.color && css.color === 'auto') {
                        css.color = this.getBarColor(value);
                    }
                    this.$digital.find('> span').css(css);
                }
            }
        },

        setTitle: function () {
            if(this.options.title) {
                if(this.options.title.text) {
                    this.$title.html('<span>' + this.options.title.text + '</span>');
                    var style = this.options.title.style;
                    var css = this._styleToCss(style, $.fn.simpleGauge.defaults.title.style);
                    this.$title.find('> span').css(css);
                }
            }
        },

        _styleToCss: function (style, defaults) {
            var css = JSON.parse(JSON.stringify(defaults));
            if(typeof style === 'string') {
                style.split(/\s*;\s*/).filter(Boolean).forEach(function(txt) {
                    var keyVal = txt.split(/\s*:\s*/);
                    if(keyVal.length === 2) {
                        css[keyVal[0]] = keyVal[1];
                    }
                });
            } else if(typeof style === 'object') {
                Object.keys(style).forEach(function(key) {
                    css[key] = style[key];
                });
            }
            return css;
        }

    };

    $.fn.simpleGauge = function(options, val) {
        var isInit = typeof options === 'object';
        if(isInit && options.debug != undefined) {
           debug = options.debug;
        }
        var result = null;
        this.each(function () {
            var $this = $(this);
            var data = $this.data('plugin-simplegauge');
            if(isInit && !data) {
                $this.data('plugin-simplegauge', (data = new SimpleGauge($(this), options)));
            } else if(typeof options === 'string') {
                result = data[options](val);
            } else {
                // ignore undefined state
                debugLog('error with plugin parameters');
            }
        });
        return result;
    };

    $.fn.simpleGauge.defaults = {
        template: [
            '<div class="simpleGauge_container">',
            '<div class="simpleGauge">',
            '<svg class="simpleGauge_bars simpleGauge_block" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>',
            '<div class="simpleGauge_marks simpleGauge_block"></div>',
            '<div class="simpleGauge_labels simpleGauge_block"></div>',
            '<div class="simpleGauge_digital"></div>',
            '<div class="simpleGauge_title"></div>',
            '</div>',
            '</div>'
        ].join(''),

        min:    0,
        max:    100,
        value:  0,

        type:   'analog digital',
        container: {
            style: {
            },
            size: 90
        },
        title: {
            text: '',
            style: {
                padding:        '5px 7px',
                'font-size':    '30px'
            }
        },
        digital: {
            text: '{value.1}',
            style: {
                padding:        '5px 7px',
                color:          'auto',
                'font-size':    '25px',
                'font-family':  '"Digital Dream Skew Narrow","Helvetica Neue",Helvetica,Arial,sans-serif',
                'text-shadow':  '#999 2px 2px 4px'
            }
        },
        analog: {
            numTicks:   10,
            minAngle:   -120,
            maxAngle:   120,
            lineWidth:  10,
            arrowWidth: 10,
            arrowColor: '#486e85',
            inset:      false
        },
        barColors: [
            [ 0,  '#666666' ],
            [ 50, '#ffa500' ],
            [ 90, '#dd2222' ]
        ]
    };

})(jQuery);

// EOF
